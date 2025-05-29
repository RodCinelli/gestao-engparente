'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useWebSocket } from '@/hooks/useWebSocket';
import { DashboardData } from '@/lib/types';
import { TrendingUp, Users, DollarSign, AlertCircle } from 'lucide-react';

interface RealTimeDashboardProps {
  data: DashboardData | null;
}

export function RealTimeDashboard({ data }: RealTimeDashboardProps) {
  const [isConnected, setIsConnected] = useState(false);
  
  const WS_URL = process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:8000/ws/employees/';

  const { isConnected: wsConnected } = useWebSocket({
    url: WS_URL,
    onOpen: () => setIsConnected(true),
    onClose: () => setIsConnected(false),
  });

  useEffect(() => {
    setIsConnected(wsConnected);
  }, [wsConnected]);

  const formatCurrency = (value: string | number) => {
    const numValue = typeof value === 'string' ? parseFloat(value) : value;
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(numValue);
  };

  // Calculate efficiency metrics
  const paymentEfficiency = data 
    ? ((data.employees_with_paid_salary || 0) / (data.total_employees || 1)) * 100
    : 0;

  const salaryProgress = data
    ? ((parseFloat(data.total_salary_paid || '0')) / (parseFloat(data.total_salary_to_pay || '1'))) * 100
    : 0;

  return (
    <div className="space-y-4">
      {/* Métricas de Eficiência */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Eficiência de Pagamento</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{paymentEfficiency.toFixed(1)}%</div>
            <p className="text-xs text-muted-foreground">
              Funcionários com salários pagos
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Progresso Salarial</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{salaryProgress.toFixed(1)}%</div>
            <p className="text-xs text-muted-foreground">
              Do total de salários pagos
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Obras</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data?.total_constructions || 0}</div>
            <p className="text-xs text-muted-foreground">
              Obras ativas no sistema
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Departamentos</CardTitle>
            <AlertCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data?.total_departments || 0}</div>
            <p className="text-xs text-muted-foreground">
              Departamentos cadastrados
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Gráfico de Progresso de Pagamentos */}
      {data?.payments_by_construction && data.payments_by_construction.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Progresso de Pagamentos por Obra</CardTitle>
          </CardHeader>
          <CardContent className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={data.payments_by_construction.map(item => ({
                  ...item,
                  progress: ((parseFloat(item.total_paid || '0')) / (parseFloat(item.total_to_pay || '1'))) * 100
                }))}
                margin={{ top: 10, right: 30, left: 0, bottom: 20 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="construction_name" 
                  tick={{ fontSize: 11 }}
                  axisLine={{ stroke: '#e0e0e0' }}
                />
                <YAxis 
                  tick={{ fontSize: 11 }}
                  axisLine={{ stroke: '#e0e0e0' }}
                />
                <Tooltip 
                  formatter={(value: number) => [`${value.toFixed(1)}%`, 'Progresso']}
                  labelFormatter={(label) => `Obra: ${label}`}
                />
                <Line 
                  type="monotone" 
                  dataKey="progress" 
                  stroke="#009688" 
                  strokeWidth={3}
                  dot={{ fill: '#009688', strokeWidth: 2, r: 6 }}
                  activeDot={{ r: 8 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}
    </div>
  );
} 