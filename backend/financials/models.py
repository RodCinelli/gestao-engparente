from django.db import models

# Create your models here.


class Material(models.Model):
    name = models.CharField(max_length=100, verbose_name="Nome")
    description = models.TextField(blank=True, null=True, verbose_name="Descrição")
    unit_price = models.DecimalField(
        max_digits=10, decimal_places=2, verbose_name="Preço Unitário"
    )
    stock_quantity = models.PositiveIntegerField(
        default=0, verbose_name="Quantidade em Estoque"
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.name

    class Meta:
        ordering = ["name"]
        verbose_name = "Material"
        verbose_name_plural = "Materiais"


class ExpenseCategory(models.Model):
    name = models.CharField(max_length=100, verbose_name="Nome")
    description = models.TextField(blank=True, null=True, verbose_name="Descrição")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.name

    class Meta:
        ordering = ["name"]
        verbose_name = "Categoria de Despesa"
        verbose_name_plural = "Categorias de Despesas"


class Expense(models.Model):
    EXPENSE_TYPE_CHOICES = [
        ("material", "Material"),
        ("service", "Serviço"),
        ("utility", "Utilidade"),
        ("other", "Outro"),
    ]

    description = models.CharField(max_length=200, verbose_name="Descrição")
    expense_type = models.CharField(
        max_length=10,
        choices=EXPENSE_TYPE_CHOICES,
        default="material",
        verbose_name="Tipo de Despesa",
    )
    material = models.ForeignKey(
        Material,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        verbose_name="Material",
    )
    category = models.ForeignKey(
        ExpenseCategory,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        verbose_name="Categoria",
    )
    quantity = models.PositiveIntegerField(default=1, verbose_name="Quantidade")
    amount = models.DecimalField(max_digits=10, decimal_places=2, verbose_name="Valor")
    expense_date = models.DateField(verbose_name="Data da Despesa")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.description

    def save(self, *args, **kwargs):
        # Update material stock if expense type is material
        if self.expense_type == "material" and self.material:
            self.material.stock_quantity += self.quantity
            self.material.save()
        super().save(*args, **kwargs)

    class Meta:
        ordering = ["-expense_date"]
        verbose_name = "Despesa"
        verbose_name_plural = "Despesas"


class Transaction(models.Model):
    TRANSACTION_TYPE_CHOICES = [
        ("income", "Receita"),
        ("expense", "Despesa"),
    ]

    PAYMENT_METHOD_CHOICES = [
        ("cash", "Dinheiro"),
        ("credit_card", "Cartão de Crédito"),
        ("debit_card", "Cartão de Débito"),
        ("transfer", "Transferência"),
        ("pix", "PIX"),
        ("other", "Outro"),
    ]

    description = models.CharField(max_length=200, verbose_name="Descrição")
    transaction_type = models.CharField(
        max_length=10,
        choices=TRANSACTION_TYPE_CHOICES,
        verbose_name="Tipo de Transação",
    )
    amount = models.DecimalField(max_digits=10, decimal_places=2, verbose_name="Valor")
    transaction_date = models.DateField(verbose_name="Data da Transação")
    payment_method = models.CharField(
        max_length=20,
        choices=PAYMENT_METHOD_CHOICES,
        default="cash",
        verbose_name="Método de Pagamento",
    )
    category = models.ForeignKey(
        ExpenseCategory,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        verbose_name="Categoria",
    )
    expense = models.ForeignKey(
        Expense,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        verbose_name="Despesa Relacionada",
    )
    notes = models.TextField(blank=True, null=True, verbose_name="Observações")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.description} - {self.amount}"

    class Meta:
        ordering = ["-transaction_date"]
        verbose_name = "Transação"
        verbose_name_plural = "Transações"
