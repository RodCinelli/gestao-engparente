import json
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
from .models import Employee, Construction, Department
from .serializers import EmployeeSerializer, DashboardSerializer
from django.db.models import Sum, Count, Q
from decimal import Decimal


class EmployeeConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.room_group_name = "employees"

        # Join room group
        if self.channel_layer is not None:
            await self.channel_layer.group_add(self.room_group_name, self.channel_name)

        await self.accept()

        # Send initial data
        await self.send_initial_data()

    async def disconnect(self, close_code):
        # Leave room group
        if self.channel_layer is not None:
            await self.channel_layer.group_discard(
                self.room_group_name, self.channel_name
            )

    async def receive(self, text_data):
        try:
            text_data_json = json.loads(text_data)
            message_type = text_data_json.get("type")

            if message_type == "get_dashboard":
                await self.send_dashboard_data()
            elif message_type == "get_employees":
                await self.send_employees_data()
        except json.JSONDecodeError:
            # Handle invalid JSON
            await self.send(
                text_data=json.dumps(
                    {"type": "error", "message": "Invalid JSON format"}
                )
            )
        except Exception as e:
            # Handle other errors
            await self.send(
                text_data=json.dumps(
                    {"type": "error", "message": f"Server error: {str(e)}"}
                )
            )

    async def employee_message(self, event):
        # Send message to WebSocket
        await self.send(
            text_data=json.dumps(
                {
                    "type": "update",
                    "message": event["message"],
                    "action": event["action"],
                }
            )
        )

        # Send updated data based on action
        if event["action"] in [
            "employee_created",
            "employee_updated",
            "employee_deleted",
            "payment_registered",
            "payments_reset",
        ]:
            await self.send_employees_data()
            await self.send_dashboard_data()
        elif event["action"] in [
            "construction_created",
            "construction_updated",
            "construction_sector_created",
            "department_update",
        ]:
            await self.send_initial_data()

    async def send_initial_data(self):
        """Send initial data including constructions, departments, and sectors"""
        data = await self.get_initial_data()
        await self.send(text_data=json.dumps({"type": "initial_data", "data": data}))

    async def send_employees_data(self):
        """Send employees list"""
        employees = await self.get_employees()
        await self.send(
            text_data=json.dumps({"type": "employees_update", "data": employees})
        )

    async def send_dashboard_data(self):
        """Send dashboard statistics"""
        dashboard_data = await self.get_dashboard_data()
        await self.send(
            text_data=json.dumps({"type": "dashboard_update", "data": dashboard_data})
        )

    @database_sync_to_async
    def get_initial_data(self):
        from .serializers import (
            ConstructionSerializer,
            DepartmentSerializer,
            ConstructionSectorSerializer,
        )

        constructions = Construction.objects.filter(is_active=True)
        departments = Department.objects.all()

        return {
            "constructions": ConstructionSerializer(constructions, many=True).data,
            "departments": DepartmentSerializer(departments, many=True).data,
        }

    @database_sync_to_async
    def get_employees(self):
        employees = Employee.objects.select_related(
            "department", "construction", "construction_sector"
        ).all()
        return EmployeeSerializer(employees, many=True).data

    @database_sync_to_async
    def get_dashboard_data(self):
        employees = Employee.objects.all()

        # Dados gerais
        total_employees = employees.count()
        total_constructions = Construction.objects.filter(is_active=True).count()
        total_departments = Department.objects.count()

        # Cálculos de pagamentos
        salary_aggregates = employees.aggregate(
            total_salary=Sum("salary"),
            total_salary_paid=Sum("salary_amount_paid"),
            total_meal_allowance=Sum("meal_allowance"),
            total_meal_allowance_paid=Sum("meal_allowance_amount_paid"),
            total_transport_allowance=Sum("transport_allowance"),
            total_transport_allowance_paid=Sum("transport_allowance_amount_paid"),
        )

        # Status de pagamentos
        payment_status = employees.aggregate(
            pending_salary=Count("id", filter=Q(salary_payment_status="pending")),
            paid_salary=Count("id", filter=Q(salary_payment_status="paid")),
            partial_salary=Count("id", filter=Q(salary_payment_status="partial")),
        )

        # Funcionários por obra
        employees_by_construction = []
        constructions = Construction.objects.filter(is_active=True)

        for construction in constructions:
            construction_employees = employees.filter(construction=construction)
            salary_sum = construction_employees.aggregate(Sum("salary"))
            paid_sum = construction_employees.aggregate(
                salary_paid=Sum("salary_amount_paid"),
                meal_paid=Sum("meal_allowance_amount_paid"),
                transport_paid=Sum("transport_allowance_amount_paid"),
            )

            total_paid = Decimal("0")
            if paid_sum.get("salary_paid"):
                total_paid += paid_sum["salary_paid"]
            if paid_sum.get("meal_paid"):
                total_paid += paid_sum["meal_paid"]
            if paid_sum.get("transport_paid"):
                total_paid += paid_sum["transport_paid"]

            employees_by_construction.append(
                {
                    "construction_id": construction.pk,
                    "construction_name": construction.name,
                    "total_employees": construction_employees.count(),
                    "total_salary": salary_sum.get("salary__sum", Decimal("0"))
                    or Decimal("0"),
                    "total_paid": total_paid,
                }
            )

        # Pagamentos por obra
        payments_by_construction = []
        for construction in constructions:
            construction_employees = employees.filter(construction=construction)
            aggregates = construction_employees.aggregate(
                total_salary_to_pay=Sum("salary"),
                total_salary_paid=Sum("salary_amount_paid"),
                total_meal_to_pay=Sum("meal_allowance"),
                total_meal_paid=Sum("meal_allowance_amount_paid"),
                total_transport_to_pay=Sum("transport_allowance"),
                total_transport_paid=Sum("transport_allowance_amount_paid"),
            )

            total_to_pay = Decimal("0")
            total_paid = Decimal("0")

            if aggregates.get("total_salary_to_pay"):
                total_to_pay += aggregates["total_salary_to_pay"]
            if aggregates.get("total_meal_to_pay"):
                total_to_pay += aggregates["total_meal_to_pay"]
            if aggregates.get("total_transport_to_pay"):
                total_to_pay += aggregates["total_transport_to_pay"]

            if aggregates.get("total_salary_paid"):
                total_paid += aggregates["total_salary_paid"]
            if aggregates.get("total_meal_paid"):
                total_paid += aggregates["total_meal_paid"]
            if aggregates.get("total_transport_paid"):
                total_paid += aggregates["total_transport_paid"]

            payments_by_construction.append(
                {
                    "construction_id": construction.pk,
                    "construction_name": construction.name,
                    "total_to_pay": total_to_pay,
                    "total_paid": total_paid,
                }
            )

        data = {
            "total_employees": total_employees,
            "total_constructions": total_constructions,
            "total_departments": total_departments,
            "total_salary_to_pay": salary_aggregates.get("total_salary", Decimal("0"))
            or Decimal("0"),
            "total_salary_paid": salary_aggregates.get(
                "total_salary_paid", Decimal("0")
            )
            or Decimal("0"),
            "total_meal_allowance_to_pay": salary_aggregates.get(
                "total_meal_allowance", Decimal("0")
            )
            or Decimal("0"),
            "total_meal_allowance_paid": salary_aggregates.get(
                "total_meal_allowance_paid", Decimal("0")
            )
            or Decimal("0"),
            "total_transport_allowance_to_pay": salary_aggregates.get(
                "total_transport_allowance", Decimal("0")
            )
            or Decimal("0"),
            "total_transport_allowance_paid": salary_aggregates.get(
                "total_transport_allowance_paid", Decimal("0")
            )
            or Decimal("0"),
            "employees_with_pending_salary": payment_status.get("pending_salary", 0),
            "employees_with_paid_salary": payment_status.get("paid_salary", 0),
            "employees_with_partial_salary": payment_status.get("partial_salary", 0),
            "employees_by_construction": employees_by_construction,
            "payments_by_construction": payments_by_construction,
        }

        serializer = DashboardSerializer(data)
        return serializer.data
