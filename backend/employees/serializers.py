from rest_framework import serializers
from .models import Employee, Department


class DepartmentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Department
        fields = '__all__'


class EmployeeSerializer(serializers.ModelSerializer):
    department_name = serializers.ReadOnlyField(source='department.name')
    
    class Meta:
        model = Employee
        fields = [
            'id', 'name', 'department', 'department_name', 'position', 
            'salary', 'payment_day', 'payment_status', 'last_payment_date',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['created_at', 'updated_at'] 