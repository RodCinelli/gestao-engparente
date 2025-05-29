from django.db import models
from django.utils import timezone
from decimal import Decimal


class Construction(models.Model):
    """Modelo para representar as obras"""

    name = models.CharField(max_length=200, verbose_name="Nome da Obra")
    address = models.TextField(verbose_name="Endereço")
    start_date = models.DateField(verbose_name="Data de Início")
    end_date = models.DateField(null=True, blank=True, verbose_name="Data de Término")
    is_active = models.BooleanField(default=True, verbose_name="Obra Ativa")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.name

    class Meta:
        ordering = ["-is_active", "name"]
        verbose_name = "Obra"
        verbose_name_plural = "Obras"


class ConstructionSector(models.Model):
    """Modelo para representar os setores de uma obra"""

    name = models.CharField(max_length=100, verbose_name="Nome do Setor")
    description = models.TextField(blank=True, null=True, verbose_name="Descrição")
    construction = models.ForeignKey(
        Construction,
        on_delete=models.CASCADE,
        related_name="sectors",
        verbose_name="Obra",
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.name} - {self.construction.name}"

    class Meta:
        ordering = ["construction", "name"]
        verbose_name = "Setor da Obra"
        verbose_name_plural = "Setores das Obras"
        unique_together = ["name", "construction"]


class Department(models.Model):
    name = models.CharField(max_length=100)
    description = models.TextField(blank=True, null=True)

    def __str__(self):
        return self.name


class Employee(models.Model):
    PAYMENT_STATUS_CHOICES = [
        ("pending", "Pendente"),
        ("paid", "Pago"),
        ("partial", "Parcial"),
    ]

    # Informações básicas
    name = models.CharField(max_length=100, verbose_name="Nome")
    cpf = models.CharField(
        max_length=14, unique=True, verbose_name="CPF", blank=True, null=True
    )
    phone = models.CharField(
        max_length=20, verbose_name="Telefone", blank=True, null=True
    )
    email = models.EmailField(blank=True, null=True, verbose_name="E-mail")

    # Informações de trabalho
    department = models.ForeignKey(
        Department, on_delete=models.PROTECT, verbose_name="Departamento"
    )
    position = models.CharField(max_length=100, verbose_name="Cargo")
    construction = models.ForeignKey(
        Construction,
        on_delete=models.PROTECT,
        verbose_name="Obra",
        related_name="employees",
        null=True,
        blank=True,
    )
    construction_sector = models.ForeignKey(
        ConstructionSector,
        on_delete=models.PROTECT,
        verbose_name="Setor da Obra",
        related_name="employees",
        null=True,
        blank=True,
    )

    # Informações de pagamento - Salário
    salary = models.DecimalField(
        max_digits=10, decimal_places=2, verbose_name="Salário"
    )
    payment_day = models.PositiveSmallIntegerField(verbose_name="Dia do Pagamento")
    salary_payment_status = models.CharField(
        max_length=10,
        choices=PAYMENT_STATUS_CHOICES,
        default="pending",
        verbose_name="Status do Pagamento do Salário",
    )
    salary_amount_paid = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        default=Decimal("0.00"),
        verbose_name="Valor do Salário Pago",
    )
    last_salary_payment_date = models.DateField(
        null=True, blank=True, verbose_name="Data do Último Pagamento de Salário"
    )

    # Informações de pagamento - Vale Refeição
    meal_allowance = models.DecimalField(
        max_digits=8,
        decimal_places=2,
        default=Decimal("0.00"),
        verbose_name="Vale Refeição",
    )
    meal_allowance_payment_status = models.CharField(
        max_length=10,
        choices=PAYMENT_STATUS_CHOICES,
        default="pending",
        verbose_name="Status do Pagamento do Vale Refeição",
    )
    meal_allowance_amount_paid = models.DecimalField(
        max_digits=8,
        decimal_places=2,
        default=Decimal("0.00"),
        verbose_name="Valor do Vale Refeição Pago",
    )
    last_meal_allowance_payment_date = models.DateField(
        null=True, blank=True, verbose_name="Data do Último Pagamento de Vale Refeição"
    )

    # Informações de pagamento - Vale Transporte
    transport_allowance = models.DecimalField(
        max_digits=8,
        decimal_places=2,
        default=Decimal("0.00"),
        verbose_name="Vale Transporte",
    )
    transport_allowance_payment_status = models.CharField(
        max_length=10,
        choices=PAYMENT_STATUS_CHOICES,
        default="pending",
        verbose_name="Status do Pagamento do Vale Transporte",
    )
    transport_allowance_amount_paid = models.DecimalField(
        max_digits=8,
        decimal_places=2,
        default=Decimal("0.00"),
        verbose_name="Valor do Vale Transporte Pago",
    )
    last_transport_allowance_payment_date = models.DateField(
        null=True,
        blank=True,
        verbose_name="Data do Último Pagamento de Vale Transporte",
    )

    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        if self.construction:
            return f"{self.name} - {self.construction.name}"
        return self.name

    def mark_salary_as_paid(self, amount=None):
        """Marca o salário como pago"""
        self.salary_payment_status = "paid"
        self.salary_amount_paid = amount or self.salary
        self.last_salary_payment_date = timezone.now().date()
        self.save()

    def mark_meal_allowance_as_paid(self, amount=None):
        """Marca o vale refeição como pago"""
        self.meal_allowance_payment_status = "paid"
        self.meal_allowance_amount_paid = amount or self.meal_allowance
        self.last_meal_allowance_payment_date = timezone.now().date()
        self.save()

    def mark_transport_allowance_as_paid(self, amount=None):
        """Marca o vale transporte como pago"""
        self.transport_allowance_payment_status = "paid"
        self.transport_allowance_amount_paid = amount or self.transport_allowance
        self.last_transport_allowance_payment_date = timezone.now().date()
        self.save()

    def reset_all_payment_status(self):
        """Reseta todos os status de pagamento"""
        self.salary_payment_status = "pending"
        self.meal_allowance_payment_status = "pending"
        self.transport_allowance_payment_status = "pending"
        self.salary_amount_paid = Decimal("0.00")
        self.meal_allowance_amount_paid = Decimal("0.00")
        self.transport_allowance_amount_paid = Decimal("0.00")
        self.save()

    @property
    def total_to_receive(self):
        """Calcula o total a receber (salário + benefícios)"""
        return self.salary + self.meal_allowance + self.transport_allowance

    @property
    def total_paid(self):
        """Calcula o total já pago"""
        return (
            self.salary_amount_paid
            + self.meal_allowance_amount_paid
            + self.transport_allowance_amount_paid
        )

    class Meta:
        ordering = ["name"]
        verbose_name = "Funcionário"
        verbose_name_plural = "Funcionários"
