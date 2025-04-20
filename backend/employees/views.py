from django.shortcuts import render
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.utils import timezone
from channels.layers import get_channel_layer
from asgiref.sync import async_to_sync
from typing import Any
from .models import Employee, Department
from .serializers import EmployeeSerializer, DepartmentSerializer


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


class EmployeeViewSet(viewsets.ModelViewSet):
    queryset = Employee.objects.all()
    serializer_class = EmployeeSerializer
    filterset_fields = ["department", "payment_status"]

    def perform_create(self, serializer):
        instance = serializer.save()
        self._notify_update("employee_created")

    def perform_update(self, serializer):
        instance = serializer.save()
        self._notify_update("employee_updated")

    def perform_destroy(self, instance):
        instance.delete()
        self._notify_update("employee_deleted")

    @action(detail=True, methods=["post"])
    def mark_as_paid(self, request, pk=None):
        employee = self.get_object()
        employee.mark_as_paid()
        serializer = self.get_serializer(employee)
        self._notify_update("payment_status_changed")
        return Response(serializer.data)

    @action(detail=True, methods=["post"])
    def reset_payment(self, request, pk=None):
        employee = self.get_object()
        employee.reset_payment_status()
        serializer = self.get_serializer(employee)
        self._notify_update("payment_status_changed")
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
