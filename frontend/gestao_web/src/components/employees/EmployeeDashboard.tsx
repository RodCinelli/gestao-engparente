'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { DashboardData } from '@/lib/types';
import { dashboardAPI } from '@/lib/api';
import { useWebSocket } from '@/hooks/useWebSocket';
import { Loader2, Users, Building2, DollarSign, TrendingUp } from 'lucide-react';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line } from 'recharts';

// Paleta de cores aprimorada com tons profissionais
const PAYMENT_STATUS_COLORS = {
  paid: '#10B981',      // Verde moderno
  pending: '#EF4444',   // Vermelho vibrante  
  partial: '#F59E0B',   // Laranja elegante
};

const CHART_COLORS = {
  primary: '#6366F1',     // Índigo
  secondary: '#8B5CF6',   // Roxo
  success: '#10B981',     // Verde
  warning: '#F59E0B',     // Laranja
  danger: '#EF4444',      // Vermelho
  info: '#06B6D4',        // Ciano
  gradient: ['#6366F1', '#8B5CF6', '#EC4899', '#EF4444', '#F59E0B', '#10B981']
};

export function EmployeeDashboard() {
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  const WS_URL = process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:8000/ws/employees/';

  useWebSocket({
    url: WS_URL,
    onMessage: (message) => {
      if (message.type === 'dashboard_update' && message.data) {
        setDashboardData(message.data);
      }
    },
  });

  useEffect(() => {
    loadDashboardData();
  }, []);

  async function loadDashboardData() {
    try {
      setLoading(true);
      const data = await dashboardAPI.getData();
      setDashboardData(data);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  }

  if (loading || !dashboardData) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

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

  const paymentStatusData = [
    { name: 'Pagos', value: dashboardData.employees_with_paid_salary, color: PAYMENT_STATUS_COLORS.paid },
    { name: 'Pendentes', value: dashboardData.employees_with_pending_salary, color: PAYMENT_STATUS_COLORS.pending },
    { name: 'Parcial', value: dashboardData.employees_with_partial_salary, color: PAYMENT_STATUS_COLORS.partial },
  ];

  const totalPayments = parseFloat(dashboardData.total_salary_to_pay) + 
                       parseFloat(dashboardData.total_meal_allowance_to_pay) + 
                       parseFloat(dashboardData.total_transport_allowance_to_pay);

  const totalPaid = parseFloat(dashboardData.total_salary_paid) + 
                    parseFloat(dashboardData.total_meal_allowance_paid) + 
                    parseFloat(dashboardData.total_transport_allowance_paid);

  // Calcular o valor restante a pagar (total original - já pago)
  const totalRemaining = totalPayments - totalPaid;

  const paymentProgress = totalPayments > 0 ? (totalPaid / totalPayments) * 100 : 0;

  // Calcular valores restantes para cada obra
  const paymentsWithRemaining = dashboardData.payments_by_construction.map(payment => ({
    ...payment,
    total_remaining: parseFloat(payment.total_to_pay) - parseFloat(payment.total_paid)
  }));

  // Calcular métricas executivas
  const executiveMetrics = {
    burnRate: paymentProgress,
    criticalWorks: paymentsWithRemaining.filter(work => {
      const workPaid = parseFloat(work.total_paid || '0');
      const workTotal = parseFloat(work.total_to_pay || '0');
      return workTotal > 0 && (workPaid / workTotal) < 0.5; // Menos de 50% pagas
    }).length,
    totalBudget: totalPayments,
    totalExecuted: totalPaid,
    pendingEmployees: dashboardData.employees_with_pending_salary,
    partialEmployees: dashboardData.employees_with_partial_salary,
  };

  // Works status para heatmap
  const worksStatus = dashboardData.payments_by_construction.map(work => {
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

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Funcionários</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dashboardData.total_employees}</div>
            <p className="text-xs text-muted-foreground">
              Funcionários cadastrados
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Obras Ativas</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dashboardData.total_constructions}</div>
            <p className="text-xs text-muted-foreground">
              Obras em andamento
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total a Pagar</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalRemaining)}</div>
            <p className="text-xs text-muted-foreground">
              Valor restante (R$ {formatCurrency(totalPayments)} - R$ {formatCurrency(totalPaid)})
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Pago</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalPaid)}</div>
            <div className="flex items-center text-xs text-muted-foreground">
              <span>{paymentProgress.toFixed(1)}% do total</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Executive Metrics Panel */}
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
            <CardTitle className="text-sm font-medium text-green-700">Total Executado</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold text-green-600">{formatCurrency(executiveMetrics.totalExecuted)}</div>
            <p className="text-xs text-muted-foreground">Valor pago</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-red-500">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-red-700">Saldo Pendente</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold text-red-600">{formatCurrency(totalRemaining)}</div>
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
            <CardTitle className="text-sm font-medium text-purple-700">Pendências</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">{executiveMetrics.pendingEmployees + executiveMetrics.partialEmployees}</div>
            <p className="text-xs text-muted-foreground">Funcionários com pendências</p>
          </CardContent>
        </Card>
      </div>

      {/* Works Status Heatmap */}
      {worksStatus.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-gradient-to-r from-yellow-400 to-red-500"></div>
              Status Executivo de Obras
            </CardTitle>
            <CardDescription>
              Heatmap de situação crítica por obra
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

      {/* Charts */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-gradient-to-r from-green-400 to-blue-500"></div>
              Status de Pagamentos
            </CardTitle>
            <CardDescription>
              Distribuição dos status de pagamento dos funcionários
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={350}>
              <PieChart>
                <defs>
                  <linearGradient id="gradientPaid" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%" stopColor="#10B981" stopOpacity={0.8} />
                    <stop offset="100%" stopColor="#059669" stopOpacity={1} />
                  </linearGradient>
                  <linearGradient id="gradientPending" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%" stopColor="#EF4444" stopOpacity={0.8} />
                    <stop offset="100%" stopColor="#DC2626" stopOpacity={1} />
                  </linearGradient>
                  <linearGradient id="gradientPartial" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%" stopColor="#F59E0B" stopOpacity={0.8} />
                    <stop offset="100%" stopColor="#D97706" stopOpacity={1} />
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
                  innerRadius={40}
                  fill="#8884d8"
                  dataKey="value"
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
                            {((data.value / dashboardData.total_employees) * 100).toFixed(1)}% do total
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

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-gradient-to-r from-purple-400 to-pink-500"></div>
              Funcionários por Obra
            </CardTitle>
            <CardDescription>
              Distribuição de funcionários entre as obras
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={350}>
              <BarChart 
                data={dashboardData.employees_by_construction}
                margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
              >
                <defs>
                  <linearGradient id="employeeGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={CHART_COLORS.primary} stopOpacity={0.9} />
                    <stop offset="100%" stopColor={CHART_COLORS.secondary} stopOpacity={0.6} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis 
                  dataKey="construction_name" 
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
                <Legend />
                <Bar 
                  dataKey="total_employees" 
                  fill="url(#employeeGradient)" 
                  name="Funcionários"
                  radius={[4, 4, 0, 0]}
                  animationDuration={1000}
                />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Payment Information */}
      <Card>
        <CardHeader>
          <CardTitle>Detalhamento de Pagamentos</CardTitle>
          <CardDescription>
            Valores detalhados de salários e benefícios
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid gap-4 md:grid-cols-3">
              <div className="space-y-2">
                <p className="text-sm font-medium">Salários</p>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Restante:</span>
                  <span className="text-red-600">{formatCurrency(parseFloat(dashboardData.total_salary_to_pay) - parseFloat(dashboardData.total_salary_paid))}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Pago:</span>
                  <span className="text-green-600">{formatCurrency(dashboardData.total_salary_paid)}</span>
                </div>
                <div className="flex justify-between text-sm border-t pt-1">
                  <span className="text-muted-foreground">Total:</span>
                  <span className="font-medium">{formatCurrency(dashboardData.total_salary_to_pay)}</span>
                </div>
              </div>

              <div className="space-y-2">
                <p className="text-sm font-medium">Vale Refeição</p>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Restante:</span>
                  <span className="text-red-600">{formatCurrency(parseFloat(dashboardData.total_meal_allowance_to_pay) - parseFloat(dashboardData.total_meal_allowance_paid))}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Pago:</span>
                  <span className="text-green-600">{formatCurrency(dashboardData.total_meal_allowance_paid)}</span>
                </div>
                <div className="flex justify-between text-sm border-t pt-1">
                  <span className="text-muted-foreground">Total:</span>
                  <span className="font-medium">{formatCurrency(dashboardData.total_meal_allowance_to_pay)}</span>
                </div>
              </div>

              <div className="space-y-2">
                <p className="text-sm font-medium">Vale Transporte</p>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Restante:</span>
                  <span className="text-red-600">{formatCurrency(parseFloat(dashboardData.total_transport_allowance_to_pay) - parseFloat(dashboardData.total_transport_allowance_paid))}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Pago:</span>
                  <span className="text-green-600">{formatCurrency(dashboardData.total_transport_allowance_paid)}</span>
                </div>
                <div className="flex justify-between text-sm border-t pt-1">
                  <span className="text-muted-foreground">Total:</span>
                  <span className="font-medium">{formatCurrency(dashboardData.total_transport_allowance_to_pay)}</span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Payments by Construction */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-gradient-to-r from-red-400 to-yellow-500"></div>
            Pagamentos por Obra
          </CardTitle>
          <CardDescription>
            Resumo financeiro por obra - Valores restantes vs pagos
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={450}>
            <BarChart 
              data={paymentsWithRemaining}
              margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
            >
              <defs>
                <linearGradient id="remainingGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={CHART_COLORS.danger} stopOpacity={0.9} />
                  <stop offset="100%" stopColor="#B91C1C" stopOpacity={0.7} />
                </linearGradient>
                <linearGradient id="paidGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={CHART_COLORS.success} stopOpacity={0.9} />
                  <stop offset="100%" stopColor="#047857" stopOpacity={0.7} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis 
                dataKey="construction_name" 
                tick={{ fontSize: 12 }}
                axisLine={{ stroke: '#e0e0e0' }}
              />
              <YAxis 
                tickFormatter={(value) => new Intl.NumberFormat('pt-BR').format(value)}
                tick={{ fontSize: 11 }}
                axisLine={{ stroke: '#e0e0e0' }}
              />
              <Tooltip content={<CustomMoneyTooltip />} />
              <Legend />
              <Bar 
                dataKey="total_remaining" 
                fill="url(#remainingGradient)" 
                name="Restante a Pagar"
                radius={[2, 2, 0, 0]}
                animationDuration={1200}
              />
              <Bar 
                dataKey="total_paid" 
                fill="url(#paidGradient)" 
                name="Pago"
                radius={[2, 2, 0, 0]}
                animationDuration={1000}
              />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
} 