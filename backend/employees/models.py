from django.db import models
from django.utils import timezone


class Department(models.Model):
    name = models.CharField(max_length=100)
    description = models.TextField(blank=True, null=True)
    
    def __str__(self):
        return self.name


class Employee(models.Model):
    PAYMENT_STATUS_CHOICES = [
        ('pending', 'Pendente'),
        ('paid', 'Pago'),
    ]
    
    name = models.CharField(max_length=100, verbose_name="Nome")
    department = models.ForeignKey(Department, on_delete=models.PROTECT, verbose_name="Departamento")
    position = models.CharField(max_length=100, verbose_name="Cargo")
    salary = models.DecimalField(max_digits=10, decimal_places=2, verbose_name="Salário")
    payment_day = models.PositiveSmallIntegerField(verbose_name="Dia do Pagamento")
    payment_status = models.CharField(
        max_length=10, 
        choices=PAYMENT_STATUS_CHOICES, 
        default='pending',
        verbose_name="Status do Pagamento"
    )
    last_payment_date = models.DateField(null=True, blank=True, verbose_name="Data do Último Pagamento")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    def __str__(self):
        return self.name
    
    def mark_as_paid(self):
        self.payment_status = 'paid'
        self.last_payment_date = timezone.now().date()
        self.save()
    
    def reset_payment_status(self):
        self.payment_status = 'pending'
        self.save()
    
    class Meta:
        ordering = ['name']
        verbose_name = "Funcionário"
        verbose_name_plural = "Funcionários"
