"use client"

import * as React from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'

// Dados de exemplo para demonstração
const EMPLOYEES_DATA = {
  totalEmployees: 24,
  pendingPayments: 8,
  paidPayments: 16,
  totalSalary: 56400,
  employeesByDepartment: [
    { name: "Administração", count: 4 },
    { name: "Engenharia", count: 12 },
    { name: "Financeiro", count: 3 },
    { name: "Operações", count: 5 },
  ]
}

const FINANCIALS_DATA = {
  totalExpenseAmount: 32750,
  expensesByType: [
    { type: "Material", amount: 18500 },
    { type: "Serviço", amount: 8250 },
    { type: "Utilidade", amount: 6000 },
  ],
  topMaterials: [
    { name: "Tijolo", quantity: 3500 },
    { name: "Cimento", quantity: 2800 },
    { name: "Areia", quantity: 1500 },
    { name: "Ferro", quantity: 750 },
    { name: "Madeira", quantity: 600 },
  ]
}

const COLORS = ['#009688', '#006D77', '#EDE4D0', '#83C5BE', '#FFDDD2'];

export default function Dashboard() {
  const [activeTab, setActiveTab] = React.useState("employees")

  return (
    <div className="fade-in space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
      </div>
      
      <Tabs defaultValue="employees" value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="employees">Funcionários</TabsTrigger>
          <TabsTrigger value="financials">Financeiro</TabsTrigger>
        </TabsList>
        
        <TabsContent value="employees" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card className="slide-up">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total de Funcionários</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{EMPLOYEES_DATA.totalEmployees}</div>
              </CardContent>
            </Card>
            <Card className="slide-up" style={{ animationDelay: "0.1s" }}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Salários Pendentes</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{EMPLOYEES_DATA.pendingPayments}</div>
              </CardContent>
            </Card>
            <Card className="slide-up" style={{ animationDelay: "0.2s" }}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Salários Pagos</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{EMPLOYEES_DATA.paidPayments}</div>
              </CardContent>
            </Card>
            <Card className="slide-up" style={{ animationDelay: "0.3s" }}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total de Salários</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(EMPLOYEES_DATA.totalSalary)}
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
                    data={EMPLOYEES_DATA.employeesByDepartment}
                    margin={{ top: 10, right: 30, left: 0, bottom: 20 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" angle={-45} textAnchor="end" height={60} />
                    <YAxis />
                    <Tooltip formatter={(value: number) => [`${value} funcionários`, 'Quantidade']} />
                    <Bar dataKey="count" fill="var(--primary)" name="Funcionários" />
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
                        { name: 'Pendentes', value: EMPLOYEES_DATA.pendingPayments },
                        { name: 'Pagos', value: EMPLOYEES_DATA.paidPayments }
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
                      <Cell fill="var(--primary)" />
                    </Pie>
                    <Tooltip formatter={(value: number) => [`${value} funcionários`, 'Quantidade']} />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        <TabsContent value="financials" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <Card className="slide-up">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total de Despesas</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(FINANCIALS_DATA.totalExpenseAmount)}
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
                      data={FINANCIALS_DATA.expensesByType}
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="amount"
                      nameKey="type"
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    >
                      {FINANCIALS_DATA.expensesByType.map((entry, index) => (
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
                    data={FINANCIALS_DATA.topMaterials}
                    layout="vertical"
                    margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" />
                    <YAxis type="category" dataKey="name" width={100} />
                    <Tooltip formatter={(value: number) => [`${value} unidades`, 'Quantidade']} />
                    <Bar dataKey="quantity" fill="var(--primary)" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
} 