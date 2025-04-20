"use client"

import * as React from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'
import { useQuery } from "@tanstack/react-query"
import { employeesAPI, financialsAPI } from "@/lib/api"
import { useState, useEffect, useMemo } from "react"
import { useToast } from "@/hooks/use-toast"
import { Department, Employee, Material, Expense } from "@/lib/types"

type DepartmentCount = {
  name: string;
  count: number;
}

type MaterialUsage = {
  [key: string]: {
    name: string;
    quantity: number;
  }
}

type ExpensesByType = {
  [key: string]: number;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#FF6B6B'];

export default function Home() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("employees");

  // Fetch employees
  const { data: employees, isLoading: isLoadingEmployees } = useQuery({
    queryKey: ['employees'],
    queryFn: employeesAPI.getAll,
  });

  // Fetch departments
  const { data: departments } = useQuery({
    queryKey: ['departments'],
    queryFn: employeesAPI.getDepartments,
  });

  // Fetch expenses
  const { data: expenses, isLoading: isLoadingExpenses } = useQuery({
    queryKey: ['expenses'],
    queryFn: financialsAPI.getExpenses,
  });

  // Fetch materials
  const { data: materials } = useQuery({
    queryKey: ['materials'],
    queryFn: financialsAPI.getMaterials,
  });

  // Prepare employee dashboard data
  const employeeDashboardData = useMemo(() => {
    if (!employees || !departments) return null;

    // Group employees by department
    const departmentCounts: Record<string, DepartmentCount> = {};
    
    departments.forEach((dept: Department) => {
      departmentCounts[dept.id] = { name: dept.name, count: 0 };
    });

    let totalSalary = 0;
    let pendingPayments = 0;
    let paidPayments = 0;

    employees.forEach((employee: Employee) => {
      if (departmentCounts[employee.department]) {
        departmentCounts[employee.department].count += 1;
      }
      totalSalary += parseFloat(employee.salary.toString());
      if (employee.payment_status === 'pending') {
        pendingPayments += 1;
      } else {
        paidPayments += 1;
      }
    });

    const employeesByDepartment = Object.values(departmentCounts);

    return {
      totalEmployees: employees.length,
      employeesByDepartment,
      totalSalary,
      pendingPayments,
      paidPayments,
    };
  }, [employees, departments]);

  // Prepare financial dashboard data
  const financialDashboardData = useMemo(() => {
    if (!expenses || !materials) return null;

    // Group expenses by type
    const expensesByType: ExpensesByType = {};
    let totalExpenseAmount = 0;

    expenses.forEach((expense: Expense) => {
      const type = expense.expense_type;
      if (!expensesByType[type]) {
        expensesByType[type] = 0;
      }
      const amount = parseFloat(expense.amount.toString());
      expensesByType[type] += amount;
      totalExpenseAmount += amount;
    });

    const expensesByTypeArray = Object.entries(expensesByType).map(([type, amount]) => ({
      type: type === 'material' ? 'Material' : 
            type === 'service' ? 'Serviço' : 
            type === 'utility' ? 'Utilidade' : 'Outro',
      amount
    }));

    // Group material usage
    const materialUsage: MaterialUsage = {};
    expenses.forEach((expense: Expense) => {
      if (expense.expense_type === 'material' && expense.material) {
        const materialId = expense.material.toString();
        if (!materialUsage[materialId]) {
          materialUsage[materialId] = {
            quantity: 0,
            name: expense.material_name || 'Desconhecido'
          };
        }
        materialUsage[materialId].quantity += expense.quantity;
      }
    });

    const topMaterials = Object.entries(materialUsage)
      .map(([id, data]) => ({
        name: data.name,
        quantity: data.quantity
      }))
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 5);

    return {
      totalExpenseAmount,
      expensesByType: expensesByTypeArray,
      topMaterials,
    };
  }, [expenses, materials]);

  if (isLoadingEmployees || isLoadingExpenses) {
    return <div className="flex items-center justify-center h-full">Carregando...</div>;
  }

  return (
    <div className="flex-1 space-y-4 p-4">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
      </div>
      
      <Tabs defaultValue="employees" value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="employees">Funcionários</TabsTrigger>
          <TabsTrigger value="financials">Financeiro</TabsTrigger>
        </TabsList>
        
        <TabsContent value="employees" className="space-y-4">
          {employeeDashboardData && (
            <>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total de Funcionários</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{employeeDashboardData.totalEmployees}</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Salários Pendentes</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{employeeDashboardData.pendingPayments}</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Salários Pagos</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{employeeDashboardData.paidPayments}</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total de Salários</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(employeeDashboardData.totalSalary)}
                    </div>
                  </CardContent>
                </Card>
              </div>
              
              <div className="grid gap-4 md:grid-cols-2">
                <Card className="col-span-1">
                  <CardHeader>
                    <CardTitle>Funcionários por Departamento</CardTitle>
                  </CardHeader>
                  <CardContent className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={employeeDashboardData.employeesByDepartment}
                        margin={{ top: 10, right: 30, left: 0, bottom: 20 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" angle={-45} textAnchor="end" height={60} />
                        <YAxis />
                        <Tooltip formatter={(value: number) => [`${value} funcionários`, 'Quantidade']} />
                        <Bar dataKey="count" fill="#8884d8" name="Funcionários" />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
                
                <Card className="col-span-1">
                  <CardHeader>
                    <CardTitle>Status de Pagamento</CardTitle>
                  </CardHeader>
                  <CardContent className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={[
                            { name: 'Pendentes', value: employeeDashboardData.pendingPayments },
                            { name: 'Pagos', value: employeeDashboardData.paidPayments }
                          ]}
                          cx="50%"
                          cy="50%"
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="value"
                          nameKey="name"
                          label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                        >
                          <Cell fill="#FFBB28" />
                          <Cell fill="#00C49F" />
                        </Pie>
                        <Tooltip formatter={(value: number) => [`${value} funcionários`, 'Quantidade']} />
                      </PieChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </div>
            </>
          )}
        </TabsContent>
        
        <TabsContent value="financials" className="space-y-4">
          {financialDashboardData && (
            <>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total de Despesas</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(financialDashboardData.totalExpenseAmount)}
                    </div>
                  </CardContent>
                </Card>
              </div>
              
              <div className="grid gap-4 md:grid-cols-2">
                <Card className="col-span-1">
                  <CardHeader>
                    <CardTitle>Despesas por Tipo</CardTitle>
                  </CardHeader>
                  <CardContent className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={financialDashboardData.expensesByType}
                          cx="50%"
                          cy="50%"
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="amount"
                          nameKey="type"
                          label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                        >
                          {financialDashboardData.expensesByType.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(value: number) => [new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value), 'Valor']} />
                      </PieChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
                
                <Card className="col-span-1">
                  <CardHeader>
                    <CardTitle>Materiais Mais Utilizados</CardTitle>
                  </CardHeader>
                  <CardContent className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={financialDashboardData.topMaterials}
                        layout="vertical"
                        margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis type="number" />
                        <YAxis type="category" dataKey="name" width={100} />
                        <Tooltip formatter={(value: number) => [`${value} unidades`, 'Quantidade']} />
                        <Bar dataKey="quantity" fill="#82ca9d" />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </div>
            </>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
