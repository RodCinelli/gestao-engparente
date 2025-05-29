"use client"

import * as React from "react"
import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'
import { useWebSocket } from "@/hooks/useWebSocket"
import { dashboardAPI, employeesAPI, departmentsAPI } from "@/lib/api"
import { DashboardData, Employee, Department } from "@/lib/types"
import { Loader2, Users, TrendingUp, DollarSign, Building2 } from "lucide-react"
import { RealTimeDashboard } from "@/components/dashboard/RealTimeDashboard"

// Paleta de cores aprimorada para o dashboard principal
const MAIN_DASHBOARD_COLORS = {
  primary: '#009688',      // Azul-esverdeado do logo
  secondary: '#006D77',    // Azul-esverdeado escuro
  accent: '#EDE4D0',       // Bege claro
  success: '#10B981',      // Verde moderno
  warning: '#F59E0B',      // Laranja
  danger: '#EF4444',       // Vermelho
  gradient: ['#009688', '#006D77', '#10B981', '#F59E0B', '#EF4444', '#83C5BE']
};

const PAYMENT_STATUS_COLORS = {
  'Pendentes': '#F59E0B',   // Laranja para pendentes
  'Pagos': '#009688',       // Verde da marca para pagos
  'Parciais': '#006D77',    // Azul escuro para parciais
};

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState("employees")
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null)
  const [employees, setEmployees] = useState<Employee[]>([])
  const [departments, setDepartments] = useState<Department[]>([])
  const [loading, setLoading] = useState(true)

  const WS_URL = process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:8000/ws/employees/'

  // WebSocket connection for real-time updates
  const { isConnected } = useWebSocket({
    url: WS_URL,
    onMessage: (message) => {
      console.log('Dashboard WebSocket message received:', message);
      
      switch (message.type) {
        case 'dashboard_update':
          if (message.data) {
            setDashboardData(message.data);
          }
          break;
        case 'employees_update':
          if (message.data) {
            setEmployees(message.data);
          }
          break;
        case 'initial_data':
          if (message.data) {
            setDepartments(message.data.departments || []);
          }
          break;
      }
    },
    onOpen: () => {
      console.log('Dashboard connected to WebSocket');
    },
    onClose: () => {
      console.log('Dashboard disconnected from WebSocket');
    },
  });

  // Load initial data
  useEffect(() => {
    loadInitialData();
  }, []);

  async function loadInitialData() {
    try {
      setLoading(true);
      
      console.log('🔄 Carregando dados do dashboard...');
      
      // Usar fetch direto para evitar problemas de autenticação
      const [dashboardDataRes, employeesResponse, departmentsResponse] = await Promise.all([
        dashboardAPI.getData(),
        fetch('http://localhost:8000/api/employees/employees/'),
        fetch('http://localhost:8000/api/employees/departments/'),
      ]);

      console.log('🔍 DEBUG - Responses from APIs:');
      console.log('Dashboard response:', dashboardDataRes);
      console.log('Employees response status:', employeesResponse.status);
      console.log('Departments response status:', departmentsResponse.status);

      const employeesData = employeesResponse.ok ? await employeesResponse.json() : { results: [] };
      const departmentsData = departmentsResponse.ok ? await departmentsResponse.json() : { results: [] };

      console.log('📊 Parsed data:');
      console.log('Dashboard data:', dashboardDataRes);
      console.log('Employees data:', employeesData);
      console.log('Departments data:', departmentsData);

      setDashboardData(dashboardDataRes);
      
      // As APIs do Django REST podem retornar dados paginados com "results"
      const processedEmployees = employeesData.results || employeesData;
      const processedDepartments = departmentsData.results || departmentsData;
      
      console.log(`✅ Setting employees: ${processedEmployees.length} employees`);
      console.log(`✅ Setting departments: ${processedDepartments.length} departments`);
      
      setEmployees(processedEmployees);
      setDepartments(processedDepartments);
      
      console.log('✅ State updated with loaded data');
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  }

  // Calculate employees by department
  const employeesByDepartment = React.useMemo(() => {
    console.log('Calculando funcionários por departamento...', {
      totalEmployees: employees.length,
      totalDepartments: departments.length
    });
    
    if (!employees || employees.length === 0) {
      return [{ name: 'Nenhum funcionário', count: 0 }];
    }
    
    // Create map of departments with employees
    const departmentsWithEmployees = new Map<number, { name: string; count: number }>();
    
    employees.forEach(emp => {
      // Validate employee data
      if (!emp || typeof emp.department !== 'number') {
        console.warn(`Invalid employee data:`, emp);
        return;
      }
      
      const deptId = emp.department;
      const deptName = emp.department_name || `Departamento ${deptId}`;
      
      if (departmentsWithEmployees.has(deptId)) {
        departmentsWithEmployees.get(deptId)!.count++;
      } else {
        departmentsWithEmployees.set(deptId, {
          name: deptName,
          count: 1
        });
      }
    });
    
    const result = Array.from(departmentsWithEmployees.values());
    console.log(`✅ Departamentos com funcionários:`, result);
    
    // If no result, return message
    if (result.length === 0) {
      return [{ name: 'Nenhum departamento', count: 0 }];
    }
    
    return result;
  }, [employees, departments]);

  // Calculate payment status data
  const paymentStatusData = React.useMemo(() => {
    if (!dashboardData) return [];
    
    return [
      { 
        name: 'Pendentes', 
        value: dashboardData.employees_with_pending_salary || 0,
        color: PAYMENT_STATUS_COLORS['Pendentes']
      },
      { 
        name: 'Pagos', 
        value: dashboardData.employees_with_paid_salary || 0,
        color: PAYMENT_STATUS_COLORS['Pagos']
      },
      { 
        name: 'Parciais', 
        value: dashboardData.employees_with_partial_salary || 0,
        color: PAYMENT_STATUS_COLORS['Parciais']
      }
    ].filter(item => item.value > 0);
  }, [dashboardData]);

  // Calculate benefits data for the new chart
  const benefitsData = React.useMemo(() => {
    if (!dashboardData) return [];
    
    const totalMealAllowance = parseFloat(dashboardData.total_meal_allowance_to_pay || '0');
    const totalTransportAllowance = parseFloat(dashboardData.total_transport_allowance_to_pay || '0');
    const totalMealPaid = parseFloat(dashboardData.total_meal_allowance_paid || '0');
    const totalTransportPaid = parseFloat(dashboardData.total_transport_allowance_paid || '0');
    
    return [
      {
        name: 'Vale Refeição',
        total: totalMealAllowance,
        paid: totalMealPaid,
        pending: totalMealAllowance - totalMealPaid,
        percentage: totalMealAllowance > 0 ? (totalMealPaid / totalMealAllowance) * 100 : 0
      },
      {
        name: 'Vale Transporte',
        total: totalTransportAllowance,
        paid: totalTransportPaid,
        pending: totalTransportAllowance - totalTransportPaid,
        percentage: totalTransportAllowance > 0 ? (totalTransportPaid / totalTransportAllowance) * 100 : 0
      }
    ];
  }, [dashboardData]);

  // Calculate executive metrics
  const executiveMetrics = React.useMemo(() => {
    if (!dashboardData) return null;
    
    const totalSalaryBudget = parseFloat(dashboardData.total_salary_to_pay || '0');
    const totalSalaryPaid = parseFloat(dashboardData.total_salary_paid || '0');
    const totalMealBudget = parseFloat(dashboardData.total_meal_allowance_to_pay || '0');
    const totalMealPaid = parseFloat(dashboardData.total_meal_allowance_paid || '0');
    const totalTransportBudget = parseFloat(dashboardData.total_transport_allowance_to_pay || '0');
    const totalTransportPaid = parseFloat(dashboardData.total_transport_allowance_paid || '0');
    
    const totalBudget = totalSalaryBudget + totalMealBudget + totalTransportBudget;
    const totalPaid = totalSalaryPaid + totalMealPaid + totalTransportPaid;
    const totalPending = totalBudget - totalPaid;
    
    const burnRate = totalBudget > 0 ? (totalPaid / totalBudget) * 100 : 0;
    const criticalWorks = dashboardData.payments_by_construction?.filter(work => {
      const workPaid = parseFloat(work.total_paid || '0');
      const workTotal = parseFloat(work.total_to_pay || '0');
      return workTotal > 0 && (workPaid / workTotal) < 0.5; // Less than 50% paid
    }).length || 0;
    
    return {
      totalBudget,
      totalPaid,
      totalPending,
      burnRate,
      criticalWorks,
      pendingEmployees: dashboardData.employees_with_pending_salary || 0,
      partialEmployees: dashboardData.employees_with_partial_salary || 0,
    };
  }, [dashboardData]);

  // Detailed payment breakdown for expanded chart
  const detailedPaymentData = React.useMemo(() => {
    if (!dashboardData) return [];
    
    return [
      {
        category: 'Salários',
        total: parseFloat(dashboardData.total_salary_to_pay || '0'),
        paid: parseFloat(dashboardData.total_salary_paid || '0'),
        pending: parseFloat(dashboardData.total_salary_to_pay || '0') - parseFloat(dashboardData.total_salary_paid || '0'),
        employees_paid: dashboardData.employees_with_paid_salary || 0,
        employees_pending: dashboardData.employees_with_pending_salary || 0,
        employees_partial: dashboardData.employees_with_partial_salary || 0,
      },
      {
        category: 'Vale Refeição',
        total: parseFloat(dashboardData.total_meal_allowance_to_pay || '0'),
        paid: parseFloat(dashboardData.total_meal_allowance_paid || '0'),
        pending: parseFloat(dashboardData.total_meal_allowance_to_pay || '0') - parseFloat(dashboardData.total_meal_allowance_paid || '0'),
        employees_paid: dashboardData.employees_with_paid_salary || 0, // Approximation
        employees_pending: dashboardData.employees_with_pending_salary || 0,
        employees_partial: dashboardData.employees_with_partial_salary || 0,
      },
      {
        category: 'Vale Transporte',
        total: parseFloat(dashboardData.total_transport_allowance_to_pay || '0'),
        paid: parseFloat(dashboardData.total_transport_allowance_paid || '0'),
        pending: parseFloat(dashboardData.total_transport_allowance_to_pay || '0') - parseFloat(dashboardData.total_transport_allowance_paid || '0'),
        employees_paid: dashboardData.employees_with_paid_salary || 0, // Approximation
        employees_pending: dashboardData.employees_with_pending_salary || 0,
        employees_partial: dashboardData.employees_with_partial_salary || 0,
      },
    ];
  }, [dashboardData]);

  // Works status for heatmap
  const worksStatus = React.useMemo(() => {
    if (!dashboardData?.payments_by_construction) return [];
    
    return dashboardData.payments_by_construction.map(work => {
      const paid = parseFloat(work.total_paid || '0');
      const total = parseFloat(work.total_to_pay || '0');
      const percentage = total > 0 ? (paid / total) * 100 : 0;
      
      let status = 'critical';
      let color = '#EF4444';
      
      if (percentage >= 90) {
        status = 'excellent';
        color = '#10B981';
      } else if (percentage >= 70) {
        status = 'good';
        color = '#F59E0B';
      } else if (percentage >= 40) {
        status = 'warning';
        color = '#F97316';
      }
      
      return {
        ...work,
        percentage,
        status,
        color,
      };
    });
  }, [dashboardData]);

  // Format currency
  const formatCurrency = (value: string | number) => {
    const numValue = typeof value === 'string' ? parseFloat(value) : value;
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(numValue);
  };

  // Função para formatar números de funcionários (sempre inteiros)
  const formatEmployeeCount = (value: string | number) => {
    const numValue = typeof value === 'string' ? parseFloat(value) : value;
    return Math.floor(numValue); // Garantir valores inteiros
  };

  // Tooltip customizada para valores monetários
  const CustomMoneyTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
          <p className="text-gray-600 font-medium">{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} style={{ color: entry.color }} className="font-semibold">
              {entry.name}: {formatCurrency(entry.value)}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  // Tooltip customizada para contagem de funcionários
  const CustomEmployeeTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
          <p className="text-gray-600 font-medium">{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} style={{ color: entry.color }} className="font-semibold">
              {entry.name}: {formatEmployeeCount(entry.value)} funcionário{formatEmployeeCount(entry.value) !== 1 ? 's' : ''}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="fade-in space-y-4">
      {/* Status de Conexão no Topo */}
      <Card className={`border-l-4 ${isConnected ? 'border-l-green-500 bg-green-50/50' : 'border-l-red-500 bg-red-50/50'} transition-all duration-300`}>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`h-3 w-3 rounded-full ${isConnected ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`} />
              <span className="text-sm font-medium">
                {isConnected ? 'Dashboard conectado - Dados em tempo real' : '🔴 Dashboard desconectado'}
              </span>
              {isConnected && (
                <span className="text-xs text-green-600 font-medium bg-green-100 px-2 py-1 rounded-full">
                  ATIVO
                </span>
              )}
            </div>
            <div className="text-xs text-muted-foreground">
              {new Date().toLocaleTimeString('pt-BR')}
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
          <p className="text-muted-foreground">
            Visão geral em tempo real do sistema de gestão
          </p>
        </div>
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
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{dashboardData?.total_employees || 0}</div>
              </CardContent>
            </Card>
            
            <Card className="slide-up" style={{ animationDelay: "0.1s" }}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Salários Pendentes</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{dashboardData?.employees_with_pending_salary || 0}</div>
              </CardContent>
            </Card>
            
            <Card className="slide-up" style={{ animationDelay: "0.2s" }}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Salários Pagos</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{dashboardData?.employees_with_paid_salary || 0}</div>
              </CardContent>
            </Card>
            
            <Card className="slide-up" style={{ animationDelay: "0.3s" }}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total de Salários</CardTitle>
                <Building2 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {formatCurrency(dashboardData?.total_salary_to_pay || 0)}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Executive Metrics Panel */}
          {executiveMetrics && (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
              <Card className="border-l-4 border-l-blue-500">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-blue-700">Taxa de Execução</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-blue-600">{executiveMetrics.burnRate.toFixed(1)}%</div>
                  <p className="text-xs text-muted-foreground">Do orçamento total</p>
                </CardContent>
              </Card>

              <Card className="border-l-4 border-l-green-500">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-green-700">Total Pago</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-xl font-bold text-green-600">{formatCurrency(executiveMetrics.totalPaid)}</div>
                  <p className="text-xs text-muted-foreground">Valor executado</p>
                </CardContent>
              </Card>

              <Card className="border-l-4 border-l-red-500">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-red-700">Saldo Pendente</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-xl font-bold text-red-600">{formatCurrency(executiveMetrics.totalPending)}</div>
                  <p className="text-xs text-muted-foreground">A executar</p>
                </CardContent>
              </Card>

              <Card className="border-l-4 border-l-orange-500">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-orange-700">Obras Críticas</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-orange-600">{executiveMetrics.criticalWorks}</div>
                  <p className="text-xs text-muted-foreground">Menos de 50% pagas</p>
                </CardContent>
              </Card>

              <Card className="border-l-4 border-l-purple-500">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-purple-700">Funcionários Pendentes</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-purple-600">{executiveMetrics.pendingEmployees}</div>
                  <p className="text-xs text-muted-foreground">Aguardando pagamento</p>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Expanded Payment Status Chart */}
          {detailedPaymentData.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-gradient-to-r from-blue-400 to-green-500"></div>
                  Detalhamento Completo de Pagamentos
                </CardTitle>
                <CardDescription>
                  Visão executiva de salários e benefícios - valores pagos vs pendentes
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={400}>
                  <BarChart
                    data={detailedPaymentData}
                    margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                  >
                    <defs>
                      <linearGradient id="paidExecutiveGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor={MAIN_DASHBOARD_COLORS.success} stopOpacity={0.9} />
                        <stop offset="100%" stopColor="#047857" stopOpacity={0.8} />
                      </linearGradient>
                      <linearGradient id="pendingExecutiveGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor={MAIN_DASHBOARD_COLORS.danger} stopOpacity={0.9} />
                        <stop offset="100%" stopColor="#B91C1C" stopOpacity={0.8} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis 
                      dataKey="category" 
                      tick={{ fontSize: 12 }}
                      axisLine={{ stroke: '#e0e0e0' }}
                    />
                    <YAxis 
                      tickFormatter={(value) => new Intl.NumberFormat('pt-BR').format(value)}
                      tick={{ fontSize: 11 }}
                      axisLine={{ stroke: '#e0e0e0' }}
                    />
                    <Tooltip 
                      content={({ active, payload, label }) => {
                        if (active && payload && payload.length) {
                          const data = payload[0].payload;
                          return (
                            <div className="bg-white p-4 border border-gray-200 rounded-lg shadow-lg">
                              <p className="text-gray-600 font-medium text-lg">{label}</p>
                              <div className="space-y-2 mt-2">
                                <div className="flex justify-between items-center">
                                  <span className="text-green-600">✓ Pago:</span>
                                  <span className="font-semibold text-green-600">{formatCurrency(data.paid)}</span>
                                </div>
                                <div className="flex justify-between items-center">
                                  <span className="text-red-600">⏳ Pendente:</span>
                                  <span className="font-semibold text-red-600">{formatCurrency(data.pending)}</span>
                                </div>
                                <div className="border-t pt-2 flex justify-between items-center">
                                  <span className="text-gray-600">Total:</span>
                                  <span className="font-semibold">{formatCurrency(data.total)}</span>
                                </div>
                                <div className="text-sm text-gray-500">
                                  Taxa: {data.total > 0 ? ((data.paid / data.total) * 100).toFixed(1) : 0}% executado
                                </div>
                              </div>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Bar 
                      dataKey="paid" 
                      fill="url(#paidExecutiveGradient)" 
                      name="Valor Pago"
                      radius={[2, 2, 0, 0]}
                      animationDuration={1000}
                    />
                    <Bar 
                      dataKey="pending" 
                      fill="url(#pendingExecutiveGradient)" 
                      name="Valor Pendente"
                      radius={[2, 2, 0, 0]}
                      animationDuration={1200}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}

          {/* Works Status Heatmap */}
          {worksStatus.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-gradient-to-r from-yellow-400 to-red-500"></div>
                  Status de Pagamentos por Obra
                </CardTitle>
                <CardDescription>
                  Heatmap executivo - situação crítica de cada obra
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                  {worksStatus.map((work, index) => (
                    <Card key={index} className="border-l-4" style={{ borderLeftColor: work.color }}>
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-medium text-sm truncate">{work.construction_name}</h4>
                          <div 
                            className="w-3 h-3 rounded-full" 
                            style={{ backgroundColor: work.color }}
                          />
                        </div>
                        <div className="space-y-1">
                          <div className="flex justify-between text-xs">
                            <span>Executado:</span>
                            <span className="font-semibold">{work.percentage.toFixed(1)}%</span>
                          </div>
                          <div className="flex justify-between text-xs">
                            <span>Pago:</span>
                            <span className="text-green-600">{formatCurrency(work.total_paid)}</span>
                          </div>
                          <div className="flex justify-between text-xs">
                            <span>Pendente:</span>
                            <span className="text-red-600">
                              {formatCurrency(parseFloat(work.total_to_pay) - parseFloat(work.total_paid))}
                            </span>
                          </div>
                        </div>
                        <div className="mt-2 bg-gray-200 rounded-full h-2">
                          <div 
                            className="h-2 rounded-full transition-all duration-500"
                            style={{ 
                              width: `${work.percentage}%`,
                              backgroundColor: work.color 
                            }}
                          />
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          <div className="grid gap-4 md:grid-cols-2">
            <Card className="slide-up" style={{ animationDelay: "0.4s" }}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-gradient-to-r from-purple-400 to-pink-500"></div>
                  Funcionários por Departamento
                </CardTitle>
              </CardHeader>
              <CardContent className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart 
                    data={employeesByDepartment}
                    margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                  >
                    <defs>
                      <linearGradient id="departmentGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor={MAIN_DASHBOARD_COLORS.primary} stopOpacity={0.9} />
                        <stop offset="100%" stopColor={MAIN_DASHBOARD_COLORS.secondary} stopOpacity={0.7} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis 
                      dataKey="name" 
                      tick={{ fontSize: 12 }}
                      axisLine={{ stroke: '#e0e0e0' }}
                    />
                    <YAxis 
                      domain={[0, 'dataMax + 1']}
                      allowDecimals={false}
                      tick={{ fontSize: 12 }}
                      axisLine={{ stroke: '#e0e0e0' }}
                      label={{ value: 'Funcionários', angle: -90, position: 'insideLeft' }}
                    />
                    <Tooltip content={<CustomEmployeeTooltip />} />
                    <Bar 
                      dataKey="count" 
                      fill="url(#departmentGradient)" 
                      name="Funcionários"
                      radius={[4, 4, 0, 0]}
                      animationDuration={1000}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
            
            {/* Novo Gráfico de Benefícios */}
            {benefitsData.length > 0 && (
              <Card className="slide-up" style={{ animationDelay: "0.5s" }}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-gradient-to-r from-orange-400 to-red-500"></div>
                    Benefícios Pagos
                  </CardTitle>
                </CardHeader>
                <CardContent className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={benefitsData}
                      margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                    >
                      <defs>
                        <linearGradient id="benefitsPaidGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor={MAIN_DASHBOARD_COLORS.success} stopOpacity={0.9} />
                          <stop offset="100%" stopColor="#047857" stopOpacity={0.7} />
                        </linearGradient>
                        <linearGradient id="benefitsPendingGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor={MAIN_DASHBOARD_COLORS.warning} stopOpacity={0.9} />
                          <stop offset="100%" stopColor="#D97706" stopOpacity={0.7} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis 
                        dataKey="name" 
                        tick={{ fontSize: 11 }}
                        axisLine={{ stroke: '#e0e0e0' }}
                      />
                      <YAxis 
                        tickFormatter={(value) => new Intl.NumberFormat('pt-BR').format(value)}
                        tick={{ fontSize: 11 }}
                        axisLine={{ stroke: '#e0e0e0' }}
                      />
                      <Tooltip content={<CustomMoneyTooltip />} />
                      <Bar 
                        dataKey="paid" 
                        fill="url(#benefitsPaidGradient)" 
                        name="Pago"
                        radius={[2, 2, 0, 0]}
                        animationDuration={1000}
                      />
                      <Bar 
                        dataKey="pending" 
                        fill="url(#benefitsPendingGradient)" 
                        name="Pendente"
                        radius={[2, 2, 0, 0]}
                        animationDuration={1200}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Segunda linha de gráficos */}
          <div className="grid gap-4 md:grid-cols-2">
            {/* Funcionários por Obra */}
            {dashboardData?.employees_by_construction && dashboardData.employees_by_construction.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-gradient-to-r from-indigo-400 to-purple-500"></div>
                    Funcionários por Obra
                  </CardTitle>
                </CardHeader>
                <CardContent className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={dashboardData.employees_by_construction}
                      margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                    >
                      <defs>
                        <linearGradient id="constructionGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor={MAIN_DASHBOARD_COLORS.secondary} stopOpacity={0.9} />
                          <stop offset="100%" stopColor={MAIN_DASHBOARD_COLORS.primary} stopOpacity={0.7} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis 
                        dataKey="construction_name" 
                        tick={{ fontSize: 11 }}
                        axisLine={{ stroke: '#e0e0e0' }}
                      />
                      <YAxis 
                        domain={[0, 'dataMax + 1']}
                        allowDecimals={false}
                        tick={{ fontSize: 12 }}
                        axisLine={{ stroke: '#e0e0e0' }}
                        label={{ value: 'Funcionários', angle: -90, position: 'insideLeft' }}
                      />
                      <Tooltip content={<CustomEmployeeTooltip />} />
                      <Bar 
                        dataKey="total_employees" 
                        fill="url(#constructionGradient)" 
                        name="Funcionários"
                        radius={[4, 4, 0, 0]}
                        animationDuration={1200}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            )}

            {/* Gráfico de Status de Pagamentos (Pizza) */}
            {paymentStatusData.length > 0 && (
              <Card className="slide-up" style={{ animationDelay: "0.3s" }}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-gradient-to-r from-blue-400 to-green-500"></div>
                    Status de Pagamentos
                  </CardTitle>
                </CardHeader>
                <CardContent className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <defs>
                        <linearGradient id="pendingGradient" x1="0" y1="0" x2="1" y2="1">
                          <stop offset="0%" stopColor={PAYMENT_STATUS_COLORS['Pendentes']} stopOpacity={0.9} />
                          <stop offset="100%" stopColor="#D97706" stopOpacity={0.7} />
                        </linearGradient>
                        <linearGradient id="paidGradient" x1="0" y1="0" x2="1" y2="1">
                          <stop offset="0%" stopColor={PAYMENT_STATUS_COLORS['Pagos']} stopOpacity={0.9} />
                          <stop offset="100%" stopColor="#047857" stopOpacity={0.7} />
                        </linearGradient>
                        <linearGradient id="partialGradient" x1="0" y1="0" x2="1" y2="1">
                          <stop offset="0%" stopColor={PAYMENT_STATUS_COLORS['Parciais']} stopOpacity={0.9} />
                          <stop offset="100%" stopColor="#0F766E" stopOpacity={0.7} />
                        </linearGradient>
                      </defs>
                      <Pie
                        data={paymentStatusData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, value, percent }) => 
                          value > 0 ? `${name}: ${value} (${(percent * 100).toFixed(0)}%)` : null
                        }
                        outerRadius={100}
                        innerRadius={35}
                        fill={MAIN_DASHBOARD_COLORS.primary}
                        dataKey="value"
                        nameKey="name"
                        animationBegin={0}
                        animationDuration={800}
                      >
                        {paymentStatusData.map((entry, index) => (
                          <Cell 
                            key={`cell-${index}`} 
                            fill={entry.color}
                            stroke="white"
                            strokeWidth={2}
                          />
                        ))}
                      </Pie>
                      <Tooltip 
                        content={({ active, payload }) => {
                          if (active && payload && payload.length > 0) {
                            const data = payload[0].payload;
                            return (
                              <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
                                <p className="text-gray-600 font-medium">{data.name}</p>
                                <p style={{ color: data.color }} className="font-semibold text-lg">
                                  {data.value} funcionário{data.value !== 1 ? 's' : ''}
                                </p>
                                <p className="text-gray-500 text-sm">
                                  {((data.value / (dashboardData?.total_employees || 1)) * 100).toFixed(1)}% do total
                                </p>
                              </div>
                            );
                          }
                          return null;
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            )}
          </div>

          <RealTimeDashboard data={dashboardData} />
        </TabsContent>
        
        <TabsContent value="financials" className="space-y-4">
          {/* Cards de Resumo Financeiro Expandido */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
            <Card className="slide-up">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total de Salários</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {formatCurrency(dashboardData?.total_salary_to_pay || 0)}
                </div>
                <div className="text-xs text-green-600 mt-1">
                  Pago: {formatCurrency(dashboardData?.total_salary_paid || 0)}
                </div>
              </CardContent>
            </Card>
            
            <Card className="slide-up" style={{ animationDelay: "0.1s" }}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Vale Refeição</CardTitle>
                <Building2 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {formatCurrency(dashboardData?.total_meal_allowance_to_pay || 0)}
                </div>
                <div className="text-xs text-green-600 mt-1">
                  Pago: {formatCurrency(dashboardData?.total_meal_allowance_paid || 0)}
                </div>
              </CardContent>
            </Card>
            
            <Card className="slide-up" style={{ animationDelay: "0.2s" }}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Vale Transporte</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {formatCurrency(dashboardData?.total_transport_allowance_to_pay || 0)}
                </div>
                <div className="text-xs text-green-600 mt-1">
                  Pago: {formatCurrency(dashboardData?.total_transport_allowance_paid || 0)}
                </div>
              </CardContent>
            </Card>

            <Card className="slide-up" style={{ animationDelay: "0.3s" }}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Geral</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {formatCurrency((parseFloat(dashboardData?.total_salary_to_pay || '0') + parseFloat(dashboardData?.total_meal_allowance_to_pay || '0') + parseFloat(dashboardData?.total_transport_allowance_to_pay || '0')))}
                </div>
                <div className="text-xs text-muted-foreground mt-1">
                  Orçamento total
                </div>
              </CardContent>
            </Card>

            <Card className="slide-up" style={{ animationDelay: "0.4s" }}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Saldo Pendente</CardTitle>
                <Building2 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">
                  {formatCurrency((parseFloat(dashboardData?.total_salary_to_pay || '0') + parseFloat(dashboardData?.total_meal_allowance_to_pay || '0') + parseFloat(dashboardData?.total_transport_allowance_to_pay || '0')) - (parseFloat(dashboardData?.total_salary_paid || '0') + parseFloat(dashboardData?.total_meal_allowance_paid || '0') + parseFloat(dashboardData?.total_transport_allowance_paid || '0')))}
                </div>
                <div className="text-xs text-muted-foreground mt-1">
                  A pagar
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Gráfico de Benefícios Detalhado */}
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-gradient-to-r from-green-400 to-blue-500"></div>
                  Controle de Benefícios
                </CardTitle>
                <CardDescription>
                  Status de pagamento dos benefícios por categoria
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={350}>
                  <BarChart
                    data={benefitsData}
                    margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                  >
                    <defs>
                      <linearGradient id="benefitsPaidFinancialGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor={MAIN_DASHBOARD_COLORS.success} stopOpacity={0.9} />
                        <stop offset="100%" stopColor="#047857" stopOpacity={0.7} />
                      </linearGradient>
                      <linearGradient id="benefitsPendingFinancialGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor={MAIN_DASHBOARD_COLORS.warning} stopOpacity={0.9} />
                        <stop offset="100%" stopColor="#D97706" stopOpacity={0.7} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis 
                      dataKey="name" 
                      tick={{ fontSize: 12 }}
                      axisLine={{ stroke: '#e0e0e0' }}
                    />
                    <YAxis 
                      tickFormatter={(value) => new Intl.NumberFormat('pt-BR').format(value)}
                      tick={{ fontSize: 11 }}
                      axisLine={{ stroke: '#e0e0e0' }}
                    />
                    <Tooltip 
                      content={({ active, payload, label }) => {
                        if (active && payload && payload.length) {
                          const data = payload[0].payload;
                          return (
                            <div className="bg-white p-4 border border-gray-200 rounded-lg shadow-lg">
                              <p className="text-gray-600 font-medium text-lg">{label}</p>
                              <div className="space-y-2 mt-2">
                                <div className="flex justify-between items-center">
                                  <span className="text-green-600">✓ Pago:</span>
                                  <span className="font-semibold text-green-600">{formatCurrency(data.paid)}</span>
                                </div>
                                <div className="flex justify-between items-center">
                                  <span className="text-red-600">⏳ Pendente:</span>
                                  <span className="font-semibold text-red-600">{formatCurrency(data.pending)}</span>
                                </div>
                                <div className="border-t pt-2 flex justify-between items-center">
                                  <span className="text-gray-600">Total:</span>
                                  <span className="font-semibold">{formatCurrency(data.total)}</span>
                                </div>
                                <div className="text-sm text-gray-500">
                                  Taxa: {data.percentage.toFixed(1)}% executado
                                </div>
                              </div>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Bar 
                      dataKey="paid" 
                      fill="url(#benefitsPaidFinancialGradient)" 
                      name="Pago"
                      radius={[2, 2, 0, 0]}
                      animationDuration={1000}
                    />
                    <Bar 
                      dataKey="pending" 
                      fill="url(#benefitsPendingFinancialGradient)" 
                      name="Pendente"
                      radius={[2, 2, 0, 0]}
                      animationDuration={1200}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Resumo Detalhado dos Benefícios */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-gradient-to-r from-purple-400 to-pink-500"></div>
                  Resumo Detalhado
                </CardTitle>
                <CardDescription>
                  Breakdown financeiro completo
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {/* Salários */}
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="font-medium text-gray-700">💰 Salários</span>
                      <span className="text-sm text-gray-500">
                        {dashboardData && parseFloat(dashboardData.total_salary_to_pay) > 0 ? 
                          `${((parseFloat(dashboardData.total_salary_paid) / parseFloat(dashboardData.total_salary_to_pay)) * 100).toFixed(1)}%` : '0%'
                        }
                      </span>
                    </div>
                    <div className="bg-gray-200 rounded-full h-3">
                      <div 
                        className="bg-gradient-to-r from-green-500 to-green-600 h-3 rounded-full transition-all duration-500"
                        style={{ 
                          width: dashboardData && parseFloat(dashboardData.total_salary_to_pay) > 0 ? 
                            `${((parseFloat(dashboardData.total_salary_paid) / parseFloat(dashboardData.total_salary_to_pay)) * 100)}%` : '0%'
                        }}
                      />
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-green-600">Pago: {formatCurrency(dashboardData?.total_salary_paid || 0)}</span>
                      <span className="text-red-600">Pendente: {formatCurrency((parseFloat(dashboardData?.total_salary_to_pay || '0') - parseFloat(dashboardData?.total_salary_paid || '0')))}</span>
                    </div>
                  </div>

                  {/* Vale Refeição */}
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="font-medium text-gray-700">🍽️ Vale Refeição</span>
                      <span className="text-sm text-gray-500">
                        {dashboardData && parseFloat(dashboardData.total_meal_allowance_to_pay) > 0 ? 
                          `${((parseFloat(dashboardData.total_meal_allowance_paid) / parseFloat(dashboardData.total_meal_allowance_to_pay)) * 100).toFixed(1)}%` : '0%'
                        }
                      </span>
                    </div>
                    <div className="bg-gray-200 rounded-full h-3">
                      <div 
                        className="bg-gradient-to-r from-blue-500 to-blue-600 h-3 rounded-full transition-all duration-500"
                        style={{ 
                          width: dashboardData && parseFloat(dashboardData.total_meal_allowance_to_pay) > 0 ? 
                            `${((parseFloat(dashboardData.total_meal_allowance_paid) / parseFloat(dashboardData.total_meal_allowance_to_pay)) * 100)}%` : '0%'
                        }}
                      />
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-green-600">Pago: {formatCurrency(dashboardData?.total_meal_allowance_paid || 0)}</span>
                      <span className="text-red-600">Pendente: {formatCurrency((parseFloat(dashboardData?.total_meal_allowance_to_pay || '0') - parseFloat(dashboardData?.total_meal_allowance_paid || '0')))}</span>
                    </div>
                  </div>

                  {/* Vale Transporte */}
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="font-medium text-gray-700">🚌 Vale Transporte</span>
                      <span className="text-sm text-gray-500">
                        {dashboardData && parseFloat(dashboardData.total_transport_allowance_to_pay) > 0 ? 
                          `${((parseFloat(dashboardData.total_transport_allowance_paid) / parseFloat(dashboardData.total_transport_allowance_to_pay)) * 100).toFixed(1)}%` : '0%'
                        }
                      </span>
                    </div>
                    <div className="bg-gray-200 rounded-full h-3">
                      <div 
                        className="bg-gradient-to-r from-orange-500 to-orange-600 h-3 rounded-full transition-all duration-500"
                        style={{ 
                          width: dashboardData && parseFloat(dashboardData.total_transport_allowance_to_pay) > 0 ? 
                            `${((parseFloat(dashboardData.total_transport_allowance_paid) / parseFloat(dashboardData.total_transport_allowance_to_pay)) * 100)}%` : '0%'
                        }}
                      />
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-green-600">Pago: {formatCurrency(dashboardData?.total_transport_allowance_paid || 0)}</span>
                      <span className="text-red-600">Pendente: {formatCurrency((parseFloat(dashboardData?.total_transport_allowance_to_pay || '0') - parseFloat(dashboardData?.total_transport_allowance_paid || '0')))}</span>
                    </div>
                  </div>

                  {/* Total Geral */}
                  <div className="pt-4 border-t">
                    <div className="flex justify-between items-center mb-2">
                      <span className="font-bold text-gray-800">📊 Total Geral</span>
                      <span className="text-sm text-gray-500 font-medium">
                        {dashboardData ? 
                          `${(((parseFloat(dashboardData.total_salary_paid) + parseFloat(dashboardData.total_meal_allowance_paid) + parseFloat(dashboardData.total_transport_allowance_paid)) / (parseFloat(dashboardData.total_salary_to_pay) + parseFloat(dashboardData.total_meal_allowance_to_pay) + parseFloat(dashboardData.total_transport_allowance_to_pay))) * 100).toFixed(1)}%` : '0%'
                        }
                      </span>
                    </div>
                    <div className="flex justify-between text-lg font-semibold">
                      <span className="text-green-600">
                        {formatCurrency((parseFloat(dashboardData?.total_salary_paid || '0') + parseFloat(dashboardData?.total_meal_allowance_paid || '0') + parseFloat(dashboardData?.total_transport_allowance_paid || '0')))}
                      </span>
                      <span className="text-red-600">
                        {formatCurrency((parseFloat(dashboardData?.total_salary_to_pay || '0') + parseFloat(dashboardData?.total_meal_allowance_to_pay || '0') + parseFloat(dashboardData?.total_transport_allowance_to_pay || '0')) - (parseFloat(dashboardData?.total_salary_paid || '0') + parseFloat(dashboardData?.total_meal_allowance_paid || '0') + parseFloat(dashboardData?.total_transport_allowance_paid || '0')))}
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
          
          {/* Pagamentos por Obra */}
          {dashboardData?.payments_by_construction && dashboardData.payments_by_construction.length > 0 && (
            <Card className="col-span-full">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-gradient-to-r from-yellow-400 to-red-500"></div>
                  Pagamentos por Obra
                </CardTitle>
                <CardDescription>
                  Resumo financeiro consolidado por obra (salários + benefícios)
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={400}>
                  <BarChart 
                    data={dashboardData.payments_by_construction}
                    margin={{ top: 20, right: 30, left: 20, bottom: 40 }}
                  >
                    <defs>
                      <linearGradient id="toPayGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor={MAIN_DASHBOARD_COLORS.warning} stopOpacity={0.9} />
                        <stop offset="100%" stopColor="#D97706" stopOpacity={0.7} />
                      </linearGradient>
                      <linearGradient id="paidConstructionGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor={MAIN_DASHBOARD_COLORS.primary} stopOpacity={0.9} />
                        <stop offset="100%" stopColor="#047857" stopOpacity={0.7} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis 
                      dataKey="construction_name" 
                      tick={{ fontSize: 11 }}
                      axisLine={{ stroke: '#e0e0e0' }}
                    />
                    <YAxis 
                      tickFormatter={(value) => new Intl.NumberFormat('pt-BR').format(value)}
                      tick={{ fontSize: 11 }}
                      axisLine={{ stroke: '#e0e0e0' }}
                    />
                    <Tooltip content={<CustomMoneyTooltip />} />
                    <Bar 
                      dataKey="total_to_pay" 
                      fill="url(#toPayGradient)" 
                      name="A Pagar"
                      radius={[2, 2, 0, 0]}
                      animationDuration={1000}
                    />
                    <Bar 
                      dataKey="total_paid" 
                      fill="url(#paidConstructionGradient)" 
                      name="Pago"
                      radius={[2, 2, 0, 0]}
                      animationDuration={1200}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
} 