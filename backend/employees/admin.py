from django.contrib import admin
from .models import Employee, Department, Construction, ConstructionSector


@admin.register(Construction)
class ConstructionAdmin(admin.ModelAdmin):
    list_display = ("name", "address", "start_date", "end_date", "is_active")
    list_filter = ("is_active", "start_date")
    search_fields = ("name", "address")
    date_hierarchy = "start_date"


@admin.register(ConstructionSector)
class ConstructionSectorAdmin(admin.ModelAdmin):
    list_display = ("name", "construction", "description")
    list_filter = ("construction",)
    search_fields = ("name", "construction__name")


@admin.register(Department)
class DepartmentAdmin(admin.ModelAdmin):
    list_display = ("name", "description")
    search_fields = ("name",)


@admin.register(Employee)
class EmployeeAdmin(admin.ModelAdmin):
    list_display = (
        "name",
        "cpf",
        "construction",
        "construction_sector",
        "department",
        "position",
        "salary",
        "salary_payment_status",
        "total_to_receive",
    )
    list_filter = (
        "construction",
        "construction_sector",
        "department",
        "salary_payment_status",
        "meal_allowance_payment_status",
        "transport_allowance_payment_status",
    )
    search_fields = ("name", "cpf", "position", "construction__name")
    readonly_fields = ("total_to_receive", "total_paid", "created_at", "updated_at")
    actions = ["mark_salary_as_paid", "mark_all_as_paid", "reset_all_payments"]

    fieldsets = (
        ("Informações Pessoais", {"fields": ("name", "cpf", "phone", "email")}),
        (
            "Informações Profissionais",
            {
                "fields": (
                    "department",
                    "position",
                    "construction",
                    "construction_sector",
                )
            },
        ),
        (
            "Informações de Pagamento - Salário",
            {
                "fields": (
                    "salary",
                    "payment_day",
                    "salary_payment_status",
                    "salary_amount_paid",
                    "last_salary_payment_date",
                )
            },
        ),
        (
            "Informações de Pagamento - Vale Refeição",
            {
                "fields": (
                    "meal_allowance",
                    "meal_allowance_payment_status",
                    "meal_allowance_amount_paid",
                    "last_meal_allowance_payment_date",
                )
            },
        ),
        (
            "Informações de Pagamento - Vale Transporte",
            {
                "fields": (
                    "transport_allowance",
                    "transport_allowance_payment_status",
                    "transport_allowance_amount_paid",
                    "last_transport_allowance_payment_date",
                )
            },
        ),
        (
            "Resumo",
            {"fields": ("total_to_receive", "total_paid", "created_at", "updated_at")},
        ),
    )

    def mark_salary_as_paid(self, request, queryset):
        for employee in queryset:
            employee.mark_salary_as_paid()
        self.message_user(request, f"{queryset.count()} salários marcados como pagos.")

    mark_salary_as_paid.short_description = "Marcar salários como pagos"

    def mark_all_as_paid(self, request, queryset):
        for employee in queryset:
            employee.mark_salary_as_paid()
            employee.mark_meal_allowance_as_paid()
            employee.mark_transport_allowance_as_paid()
        self.message_user(
            request,
            f"Todos os pagamentos de {queryset.count()} funcionários foram marcados como pagos.",
        )

    mark_all_as_paid.short_description = "Marcar todos os pagamentos como pagos"

    def reset_all_payments(self, request, queryset):
        for employee in queryset:
            employee.reset_all_payment_status()
        self.message_user(
            request,
            f"Status de pagamento resetado para {queryset.count()} funcionários.",
        )

    reset_all_payments.short_description = "Resetar todos os status de pagamento"
