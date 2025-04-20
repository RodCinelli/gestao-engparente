from django.contrib import admin
from .models import Employee, Department


@admin.register(Department)
class DepartmentAdmin(admin.ModelAdmin):
    list_display = ('name', 'description')
    search_fields = ('name',)


@admin.register(Employee)
class EmployeeAdmin(admin.ModelAdmin):
    list_display = ('name', 'department', 'position', 'salary', 'payment_day', 'payment_status', 'last_payment_date')
    list_filter = ('department', 'payment_status')
    search_fields = ('name', 'position')
    actions = ['mark_as_paid', 'reset_payment']
    
    def mark_as_paid(self, request, queryset):
        for employee in queryset:
            employee.mark_as_paid()
        self.message_user(request, f"{queryset.count()} employees marked as paid.")
    mark_as_paid.short_description = "Mark selected employees as paid"
    
    def reset_payment(self, request, queryset):
        for employee in queryset:
            employee.reset_payment_status()
        self.message_user(request, f"{queryset.count()} employees reset to pending payment status.")
    reset_payment.short_description = "Reset payment status to pending"
