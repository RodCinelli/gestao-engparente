from django.shortcuts import render
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.exceptions import ValidationError
from django.utils import timezone
from channels.layers import get_channel_layer
from asgiref.sync import async_to_sync
from typing import Any
from .models import Material, Expense, ExpenseCategory, Transaction
from .serializers import (
    MaterialSerializer,
    ExpenseSerializer,
    ExpenseCategorySerializer,
    TransactionSerializer,
)


class MaterialViewSet(viewsets.ModelViewSet):
    queryset = Material.objects.all()
    serializer_class = MaterialSerializer

    def perform_create(self, serializer):
        instance = serializer.save()
        self._notify_update("material_created")

    def perform_update(self, serializer):
        instance = serializer.save()
        self._notify_update("material_updated")

    def perform_destroy(self, instance):
        instance.delete()
        self._notify_update("material_deleted")

    def _notify_update(self, action):
        channel_layer = get_channel_layer()
        async_to_sync(channel_layer.group_send)(  # type: ignore
            "financials",
            {
                "type": "financial_message",
                "message": "Material data changed",
                "action": action,
            },
        )


class ExpenseViewSet(viewsets.ModelViewSet):
    queryset = Expense.objects.all()
    serializer_class = ExpenseSerializer
    filterset_fields = ["expense_type", "material", "expense_date"]

    def perform_create(self, serializer):
        instance = serializer.save()
        self._notify_update("expense_created")

    def perform_update(self, serializer):
        instance = serializer.save()
        self._notify_update("expense_updated")

    def perform_destroy(self, instance):
        instance.delete()
        self._notify_update("expense_deleted")

    def _notify_update(self, action):
        channel_layer = get_channel_layer()
        async_to_sync(channel_layer.group_send)(  # type: ignore
            "financials",
            {
                "type": "financial_message",
                "message": "Expense data changed",
                "action": action,
            },
        )


class ExpenseCategoryViewSet(viewsets.ModelViewSet):
    queryset = ExpenseCategory.objects.all()
    serializer_class = ExpenseCategorySerializer

    def perform_create(self, serializer):
        instance = serializer.save()
        self._notify_update("category_created")

    def perform_update(self, serializer):
        instance = serializer.save()
        self._notify_update("category_updated")

    def perform_destroy(self, instance):
        instance.delete()
        self._notify_update("category_deleted")

    def _notify_update(self, action):
        channel_layer = get_channel_layer()
        async_to_sync(channel_layer.group_send)(  # type: ignore
            "financials",
            {
                "type": "financial_message",
                "message": "Category data changed",
                "action": action,
            },
        )


class TransactionViewSet(viewsets.ModelViewSet):
    queryset = Transaction.objects.all()
    serializer_class = TransactionSerializer
    filterset_fields = ["category", "transaction_type"]

    def perform_create(self, serializer):
        instance = serializer.save()
        self._notify_update("transaction_created")

    def perform_update(self, serializer):
        instance = serializer.save()
        self._notify_update("transaction_updated")

    def perform_destroy(self, instance):
        instance.delete()
        self._notify_update("transaction_deleted")

    def _notify_update(self, action):
        channel_layer = get_channel_layer()
        async_to_sync(channel_layer.group_send)(  # type: ignore
            "financials",
            {
                "type": "financial_message",
                "message": "Transaction data changed",
                "action": action,
            },
        )
