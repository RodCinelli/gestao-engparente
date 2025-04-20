from django.contrib import admin
from .models import Material, Expense, ExpenseCategory, Transaction


@admin.register(Material)
class MaterialAdmin(admin.ModelAdmin):
    list_display = ("name", "unit_price", "stock_quantity")
    search_fields = ("name",)


@admin.register(ExpenseCategory)
class ExpenseCategoryAdmin(admin.ModelAdmin):
    list_display = ("name", "description")
    search_fields = ("name",)


@admin.register(Expense)
class ExpenseAdmin(admin.ModelAdmin):
    list_display = (
        "description",
        "expense_type",
        "material",
        "category",
        "quantity",
        "amount",
        "expense_date",
    )
    list_filter = ("expense_type", "expense_date", "category")
    search_fields = ("description",)
    date_hierarchy = "expense_date"


@admin.register(Transaction)
class TransactionAdmin(admin.ModelAdmin):
    list_display = (
        "description",
        "transaction_type",
        "amount",
        "payment_method",
        "transaction_date",
        "category",
    )
    list_filter = ("transaction_type", "payment_method", "transaction_date", "category")
    search_fields = ("description", "notes")
    date_hierarchy = "transaction_date"
