from django.shortcuts import render
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.views import APIView
from django.utils import timezone
from django.db.models import Sum, Count, Q
from channels.layers import get_channel_layer
from asgiref.sync import async_to_sync
from decimal import Decimal
from typing import Dict, Any, cast
from .models import Employee, Department, Construction, ConstructionSector
from .serializers import (
    EmployeeSerializer,
    EmployeeCreateUpdateSerializer,
    EmployeePaymentSerializer,
    DepartmentSerializer,
    ConstructionSerializer,
    ConstructionSectorSerializer,
    DashboardSerializer,
)


class ConstructionViewSet(viewsets.ModelViewSet):
    queryset = Construction.objects.all()
    serializer_class = ConstructionSerializer

    def perform_create(self, serializer):
        instance = serializer.save()
        self._notify_update("construction_created")

    def perform_update(self, serializer):
        instance = serializer.save()
        self._notify_update("construction_updated")

    def _notify_update(self, action):
        channel_layer = get_channel_layer()
        async_to_sync(channel_layer.group_send)(  # type: ignore
            "employees",
            {
                "type": "employee_message",
                "message": "Construction data changed",
                "action": action,
            },
        )


class ConstructionSectorViewSet(viewsets.ModelViewSet):
    queryset = ConstructionSector.objects.all()
    serializer_class = ConstructionSectorSerializer

    def get_queryset(self):
        queryset = super().get_queryset()
        construction_id = self.request.GET.get("construction")
        if construction_id:
            queryset = queryset.filter(construction_id=construction_id)
        return queryset

    def perform_create(self, serializer):
        instance = serializer.save()
        self._notify_update("construction_sector_created")

    def _notify_update(self, action):
        channel_layer = get_channel_layer()
        async_to_sync(channel_layer.group_send)(  # type: ignore
            "employees",
            {
                "type": "employee_message",
                "message": "Construction sector data changed",
                "action": action,
            },
        )


class DepartmentViewSet(viewsets.ModelViewSet):
    queryset = Department.objects.all()
    serializer_class = DepartmentSerializer

    def perform_create(self, serializer):
        instance = serializer.save()
        channel_layer = get_channel_layer()
        async_to_sync(channel_layer.group_send)(  # type: ignore
            "employees",
            {
                "type": "employee_message",
                "message": "Department created/updated",
                "action": "department_update",
            },
        )

    @action(detail=False, methods=["post"])
    def cleanup_orphans(self, request):
        """Remove departamentos que não têm funcionários associados"""
        from django.db.models import Count

        # Encontrar departamentos sem funcionários
        orphan_departments = Department.objects.annotate(
            employee_count=Count("employee")
        ).filter(employee_count=0)

        orphan_count = orphan_departments.count()
        orphan_names = list(orphan_departments.values_list("name", flat=True))

        # Deletar departamentos órfãos
        orphan_departments.delete()

        channel_layer = get_channel_layer()
        async_to_sync(channel_layer.group_send)(  # type: ignore
            "employees",
            {
                "type": "employee_message",
                "message": "Orphan departments cleaned up",
                "action": "departments_cleaned",
            },
        )

        return Response(
            {
                "message": f"Removed {orphan_count} orphan departments",
                "removed_departments": orphan_names,
            }
        )


class EmployeeViewSet(viewsets.ModelViewSet):
    queryset = Employee.objects.all()
    serializer_class = EmployeeSerializer
    filterset_fields = [
        "department",
        "construction",
        "construction_sector",
        "salary_payment_status",
        "meal_allowance_payment_status",
        "transport_allowance_payment_status",
    ]

    def get_serializer_class(self):
        if self.action in ["create", "update", "partial_update"]:
            return EmployeeCreateUpdateSerializer
        return EmployeeSerializer

    def perform_create(self, serializer):
        instance = serializer.save()
        self._notify_update("employee_created")

    def perform_update(self, serializer):
        instance = serializer.save()
        self._notify_update("employee_updated")

    def perform_destroy(self, instance):
        # Capturar o departamento antes da exclusão
        department_to_check = instance.department

        # Excluir o funcionário
        instance.delete()

        # Verificar se o departamento ficou órfão e removê-lo se necessário
        if department_to_check:
            remaining_employees = Employee.objects.filter(
                department=department_to_check
            ).count()
            if remaining_employees == 0:
                department_name = department_to_check.name
                department_to_check.delete()
                print(
                    f"🧹 Departamento órfão removido automaticamente: {department_name}"
                )

        self._notify_update("employee_deleted")

    @action(detail=True, methods=["post"])
    def register_payment(self, request, pk=None):
        """Registra um pagamento para o funcionário"""
        employee = self.get_object()
        serializer = EmployeePaymentSerializer(
            data=request.data, context={"employee": employee}
        )

        if serializer.is_valid():
            # Verificação segura dos dados validados
            validated_data = cast(Dict[str, Any], serializer.validated_data)

            payment_type = validated_data.get("payment_type")
            if not payment_type:
                return Response(
                    {"error": "Tipo de pagamento é obrigatório"},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            amount = validated_data.get("amount")

            if payment_type == "salary":
                employee.mark_salary_as_paid(amount)
            elif payment_type == "meal_allowance":
                employee.mark_meal_allowance_as_paid(amount)
            elif payment_type == "transport_allowance":
                employee.mark_transport_allowance_as_paid(amount)

            self._notify_update("payment_registered")
            return Response(EmployeeSerializer(employee).data)

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=True, methods=["post"])
    def reset_payments(self, request, pk=None):
        """Reseta todos os pagamentos do funcionário"""
        employee = self.get_object()
        employee.reset_all_payment_status()
        serializer = self.get_serializer(employee)
        self._notify_update("payments_reset")
        return Response(serializer.data)

    def _notify_update(self, action):
        channel_layer = get_channel_layer()
        async_to_sync(channel_layer.group_send)(  # type: ignore
            "employees",
            {
                "type": "employee_message",
                "message": "Employee data changed",
                "action": action,
            },
        )


class DashboardView(APIView):
    """View para fornecer dados do dashboard"""

    def get(self, request):
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
            salary_sum = construction_employees.aggregate(salary_total=Sum("salary"))
            paid_sum = construction_employees.aggregate(
                salary_paid=Sum("salary_amount_paid"),
                meal_paid=Sum("meal_allowance_amount_paid"),
                transport_paid=Sum("transport_allowance_amount_paid"),
            )

            total_paid = Decimal("0")
            if paid_sum:
                salary_paid = paid_sum.get("salary_paid")
                meal_paid = paid_sum.get("meal_paid")
                transport_paid = paid_sum.get("transport_paid")

                if salary_paid:
                    total_paid += salary_paid
                if meal_paid:
                    total_paid += meal_paid
                if transport_paid:
                    total_paid += transport_paid

            employees_by_construction.append(
                {
                    "construction_id": construction.pk,
                    "construction_name": construction.name,
                    "total_employees": construction_employees.count(),
                    "total_salary": salary_sum.get("salary_total") or Decimal("0"),
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

            # Verificação segura para evitar erros de tipo
            if aggregates and isinstance(aggregates, dict):
                total_salary_to_pay = aggregates.get("total_salary_to_pay")
                total_meal_to_pay = aggregates.get("total_meal_to_pay")
                total_transport_to_pay = aggregates.get("total_transport_to_pay")
                total_salary_paid_val = aggregates.get("total_salary_paid")
                total_meal_paid_val = aggregates.get("total_meal_paid")
                total_transport_paid_val = aggregates.get("total_transport_paid")

                if total_salary_to_pay:
                    total_to_pay += total_salary_to_pay
                if total_meal_to_pay:
                    total_to_pay += total_meal_to_pay
                if total_transport_to_pay:
                    total_to_pay += total_transport_to_pay

                if total_salary_paid_val:
                    total_paid += total_salary_paid_val
                if total_meal_paid_val:
                    total_paid += total_meal_paid_val
                if total_transport_paid_val:
                    total_paid += total_transport_paid_val

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
            "total_salary_to_pay": salary_aggregates.get("total_salary")
            or Decimal("0"),
            "total_salary_paid": salary_aggregates.get("total_salary_paid")
            or Decimal("0"),
            "total_meal_allowance_to_pay": salary_aggregates.get("total_meal_allowance")
            or Decimal("0"),
            "total_meal_allowance_paid": salary_aggregates.get(
                "total_meal_allowance_paid"
            )
            or Decimal("0"),
            "total_transport_allowance_to_pay": salary_aggregates.get(
                "total_transport_allowance"
            )
            or Decimal("0"),
            "total_transport_allowance_paid": salary_aggregates.get(
                "total_transport_allowance_paid"
            )
            or Decimal("0"),
            "employees_with_pending_salary": payment_status.get("pending_salary", 0),
            "employees_with_paid_salary": payment_status.get("paid_salary", 0),
            "employees_with_partial_salary": payment_status.get("partial_salary", 0),
            "employees_by_construction": employees_by_construction,
            "payments_by_construction": payments_by_construction,
        }

        serializer = DashboardSerializer(data)
        return Response(serializer.data)
