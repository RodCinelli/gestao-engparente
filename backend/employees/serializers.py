from rest_framework import serializers
from .models import Employee, Department, Construction, ConstructionSector
from django.utils import timezone


class ConstructionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Construction
        fields = "__all__"
        read_only_fields = ["created_at", "updated_at"]


class ConstructionSectorSerializer(serializers.ModelSerializer):
    construction_name = serializers.ReadOnlyField(source="construction.name")

    class Meta:
        model = ConstructionSector
        fields = "__all__"
        read_only_fields = ["created_at", "updated_at"]


class DepartmentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Department
        fields = "__all__"


class EmployeeSerializer(serializers.ModelSerializer):
    department_name = serializers.ReadOnlyField(source="department.name")
    construction_name = serializers.ReadOnlyField(source="construction.name")
    construction_sector_name = serializers.ReadOnlyField(
        source="construction_sector.name"
    )
    total_to_receive = serializers.ReadOnlyField()
    total_paid = serializers.ReadOnlyField()

    class Meta:
        model = Employee
        fields = [
            "id",
            "name",
            "cpf",
            "phone",
            "email",
            "department",
            "department_name",
            "position",
            "construction",
            "construction_name",
            "construction_sector",
            "construction_sector_name",
            "salary",
            "payment_day",
            "salary_payment_status",
            "salary_amount_paid",
            "last_salary_payment_date",
            "meal_allowance",
            "meal_allowance_payment_status",
            "meal_allowance_amount_paid",
            "last_meal_allowance_payment_date",
            "transport_allowance",
            "transport_allowance_payment_status",
            "transport_allowance_amount_paid",
            "last_transport_allowance_payment_date",
            "total_to_receive",
            "total_paid",
            "created_at",
            "updated_at",
        ]
        read_only_fields = [
            "created_at",
            "updated_at",
            "total_to_receive",
            "total_paid",
        ]


class EmployeeCreateUpdateSerializer(serializers.ModelSerializer):
    """Serializer para criação e atualização de funcionários"""

    # Campos de texto livre que serão convertidos em objetos
    department = serializers.CharField(max_length=100)
    construction = serializers.CharField(max_length=200)
    construction_sector = serializers.CharField(max_length=100)

    class Meta:
        model = Employee
        fields = [
            "name",
            "cpf",
            "phone",
            "email",
            "department",
            "position",
            "construction",
            "construction_sector",
            "salary",
            "payment_day",
            "meal_allowance",
            "transport_allowance",
        ]

    def create(self, validated_data):
        """Cria funcionário criando automaticamente departamento, obra e setor se necessário"""

        # Extrair os nomes dos campos
        department_name = validated_data.pop("department")
        construction_name = validated_data.pop("construction")
        construction_sector_name = validated_data.pop("construction_sector")

        # Criar ou buscar o departamento
        department, created = Department.objects.get_or_create(
            name=department_name,
            defaults={
                "description": f"Departamento criado automaticamente: {department_name}"
            },
        )

        # Criar ou buscar a obra
        construction, created = Construction.objects.get_or_create(
            name=construction_name,
            defaults={
                "address": "Endereço a ser definido",
                "start_date": timezone.now().date(),
                "is_active": True,
            },
        )

        # Criar ou buscar o setor da obra
        construction_sector, created = ConstructionSector.objects.get_or_create(
            name=construction_sector_name,
            construction=construction,
            defaults={
                "description": f"Setor criado automaticamente: {construction_sector_name}"
            },
        )

        # Criar o funcionário com os objetos
        validated_data["department"] = department
        validated_data["construction"] = construction
        validated_data["construction_sector"] = construction_sector

        return super().create(validated_data)

    def update(self, instance, validated_data):
        """Atualiza funcionário criando automaticamente departamento, obra e setor se necessário"""

        # Se há campos de departamento, obra ou setor para atualizar
        if "department" in validated_data:
            department_name = validated_data.pop("department")
            department, created = Department.objects.get_or_create(
                name=department_name,
                defaults={
                    "description": f"Departamento criado automaticamente: {department_name}"
                },
            )
            validated_data["department"] = department

        if "construction" in validated_data:
            construction_name = validated_data.pop("construction")
            construction, created = Construction.objects.get_or_create(
                name=construction_name,
                defaults={
                    "address": "Endereço a ser definido",
                    "start_date": timezone.now().date(),
                    "is_active": True,
                },
            )
            validated_data["construction"] = construction

        if "construction_sector" in validated_data:
            construction_sector_name = validated_data.pop("construction_sector")
            construction = validated_data.get("construction", instance.construction)
            construction_sector, created = ConstructionSector.objects.get_or_create(
                name=construction_sector_name,
                construction=construction,
                defaults={
                    "description": f"Setor criado automaticamente: {construction_sector_name}"
                },
            )
            validated_data["construction_sector"] = construction_sector

        return super().update(instance, validated_data)

    def validate(self, data):
        """Validação customizada para os novos campos"""
        # Remove a validação anterior de FK, pois agora são campos de texto
        return data


class EmployeePaymentSerializer(serializers.Serializer):
    """Serializer para registrar pagamentos"""

    payment_type = serializers.ChoiceField(
        choices=["salary", "meal_allowance", "transport_allowance"]
    )
    amount = serializers.DecimalField(max_digits=10, decimal_places=2, required=False)

    def validate(self, data):
        employee = self.context.get("employee")
        if not employee:
            raise serializers.ValidationError("Funcionário não encontrado no contexto.")

        payment_type = data.get("payment_type")
        amount = data.get("amount")

        # Valida o valor do pagamento
        if payment_type == "salary" and amount and amount > employee.salary:
            raise serializers.ValidationError(
                "O valor do pagamento não pode ser maior que o salário."
            )
        elif (
            payment_type == "meal_allowance"
            and amount
            and amount > employee.meal_allowance
        ):
            raise serializers.ValidationError(
                "O valor do pagamento não pode ser maior que o vale refeição."
            )
        elif (
            payment_type == "transport_allowance"
            and amount
            and amount > employee.transport_allowance
        ):
            raise serializers.ValidationError(
                "O valor do pagamento não pode ser maior que o vale transporte."
            )

        return data


class DashboardSerializer(serializers.Serializer):
    """Serializer para dados do dashboard"""

    total_employees = serializers.IntegerField()
    total_constructions = serializers.IntegerField()
    total_departments = serializers.IntegerField()

    # Totais de pagamentos
    total_salary_to_pay = serializers.DecimalField(max_digits=12, decimal_places=2)
    total_salary_paid = serializers.DecimalField(max_digits=12, decimal_places=2)
    total_meal_allowance_to_pay = serializers.DecimalField(
        max_digits=12, decimal_places=2
    )
    total_meal_allowance_paid = serializers.DecimalField(
        max_digits=12, decimal_places=2
    )
    total_transport_allowance_to_pay = serializers.DecimalField(
        max_digits=12, decimal_places=2
    )
    total_transport_allowance_paid = serializers.DecimalField(
        max_digits=12, decimal_places=2
    )

    # Status de pagamentos
    employees_with_pending_salary = serializers.IntegerField()
    employees_with_paid_salary = serializers.IntegerField()
    employees_with_partial_salary = serializers.IntegerField()

    # Por obra
    employees_by_construction = serializers.ListField(child=serializers.DictField())
    payments_by_construction = serializers.ListField(child=serializers.DictField())
