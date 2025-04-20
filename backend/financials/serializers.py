from rest_framework import serializers
from .models import Material, Expense, ExpenseCategory, Transaction


class MaterialSerializer(serializers.ModelSerializer):
    class Meta:
        model = Material
        fields = "__all__"
        read_only_fields = ["created_at", "updated_at"]


class ExpenseCategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = ExpenseCategory
        fields = "__all__"
        read_only_fields = ["created_at", "updated_at"]


class ExpenseSerializer(serializers.ModelSerializer):
    material_name = serializers.ReadOnlyField(source="material.name", read_only=True)
    category_name = serializers.ReadOnlyField(source="category.name", read_only=True)

    class Meta:
        model = Expense
        fields = [
            "id",
            "description",
            "expense_type",
            "material",
            "material_name",
            "category",
            "category_name",
            "quantity",
            "amount",
            "expense_date",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["created_at", "updated_at"]


class TransactionSerializer(serializers.ModelSerializer):
    category_name = serializers.ReadOnlyField(source="category.name", read_only=True)
    expense_description = serializers.ReadOnlyField(
        source="expense.description", read_only=True
    )

    class Meta:
        model = Transaction
        fields = [
            "id",
            "description",
            "transaction_type",
            "amount",
            "transaction_date",
            "payment_method",
            "category",
            "category_name",
            "expense",
            "expense_description",
            "notes",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["created_at", "updated_at"]
