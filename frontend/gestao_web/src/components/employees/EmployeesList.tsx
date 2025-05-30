'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Employee, Department, Construction, PaymentData } from '@/lib/types';
import { Trash2, DollarSign, Phone, Mail } from 'lucide-react';

interface EmployeesListProps {
  employees: Employee[];
  departments: Department[];
  constructions: Construction[];
  onPaymentRegister: (employeeId: number, paymentData: PaymentData) => Promise<void>;
  onEmployeeDelete: (employeeId: number) => Promise<void>;
  onRefresh?: () => void;
}

export function EmployeesList({
  employees,
  departments,
  constructions,
  onPaymentRegister,
  onEmployeeDelete,
  onRefresh,
}: EmployeesListProps) {
  const [filterDepartment, setFilterDepartment] = useState<string>('all');
  const [filterConstruction, setFilterConstruction] = useState<string>('all');
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
  const [paymentType, setPaymentType] = useState<'salary' | 'meal_allowance' | 'transport_allowance'>('salary');
  const [paymentAmount, setPaymentAmount] = useState('');

  // Debug: Log quando os dados chegam
  console.log('🔄 EmployeesList renderizado com:', {
    employees: employees?.length || 0,
    departments: departments?.length || 0,
    constructions: constructions?.length || 0,
    employeesData: employees
  });

  const handleRefresh = () => {
    console.log('🔄 Botão de refresh clicado');
    if (onRefresh) {
      onRefresh();
    }
  };

  const formatCurrency = (value: string | number) => {
    const numValue = typeof value === 'string' ? parseFloat(value) : value;
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(numValue);
  };

  const formatCPF = (cpf: string) => {
    return cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
  };

  const formatPhone = (phone: string) => {
    return phone.replace(/(\d{2})(\d{4,5})(\d{4})/, '($1) $2-$3');
  };

  const calculateTotalCompensation = (employee: Employee) => {
    const salary = parseFloat(employee.salary) || 0;
    const mealAllowance = parseFloat(employee.meal_allowance) || 0;
    const transportAllowance = parseFloat(employee.transport_allowance) || 0;
    return salary + mealAllowance + transportAllowance;
  };

  const getPaymentStatusBadge = (status: 'pending' | 'paid' | 'partial') => {
    const variants = {
      pending: 'destructive',
      paid: 'default',
      partial: 'secondary',
    } as const;

    const labels = {
      pending: 'Pendente',
      paid: 'Pago',
      partial: 'Parcial',
    };

    return (
      <Badge variant={variants[status]}>
        {labels[status]}
      </Badge>
    );
  };

  const filteredEmployees = Array.isArray(employees) ? employees.filter((employee) => {
    console.log('🔍 Funcionário:', employee.name, {
      department: employee.department,
      department_name: employee.department_name,
      construction: employee.construction,
      construction_name: employee.construction_name,
      filterDepartment,
      filterConstruction
    });
    
    // Corrigir a lógica de filtragem - usar os nomes em vez dos IDs
    const departmentMatch = filterDepartment === 'all' || 
                           employee.department_name === filterDepartment ||
                           employee.department?.toString() === filterDepartment;
    
    const constructionMatch = filterConstruction === 'all' || 
                             employee.construction_name === filterConstruction ||
                             employee.construction?.toString() === filterConstruction;
    
    console.log('🎯 Matches:', { departmentMatch, constructionMatch });
    
    return departmentMatch && constructionMatch;
  }) : [];

  console.log('📋 Funcionários filtrados:', filteredEmployees.length, 'de', employees.length);

  const handlePaymentSubmit = async () => {
    if (!selectedEmployee) return;

    try {
      await onPaymentRegister(selectedEmployee.id!, {
        payment_type: paymentType,
        amount: paymentAmount || undefined,
      });
      setPaymentDialogOpen(false);
      setPaymentAmount('');
    } catch (error) {
      console.error('Error registering payment:', error);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Lista de Funcionários</CardTitle>
              <CardDescription>
                Gerencie funcionários e registre pagamentos
              </CardDescription>
            </div>
            <div className="flex gap-4">
              <Button 
                variant="outline" 
                onClick={onRefresh || handleRefresh}
                className="h-10"
              >
                🔄 Buscar Funcionários
              </Button>
              
              <Select value={filterDepartment} onValueChange={setFilterDepartment}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Filtrar por departamento" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os departamentos</SelectItem>
                  {Array.isArray(departments) ? departments.map((dept) => (
                    <SelectItem key={dept.id} value={dept.name}>
                      {dept.name}
                    </SelectItem>
                  )) : null}
                </SelectContent>
              </Select>

              <Select value={filterConstruction} onValueChange={setFilterConstruction}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Filtrar por obra" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas as obras</SelectItem>
                  {Array.isArray(constructions) ? constructions.map((construction) => (
                    <SelectItem key={construction.id} value={construction.name}>
                      {construction.name}
                    </SelectItem>
                  )) : null}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>CPF</TableHead>
                  <TableHead>Contato</TableHead>
                  <TableHead>Cargo</TableHead>
                  <TableHead>Obra</TableHead>
                  <TableHead>Remuneração</TableHead>
                  <TableHead>Status Pagamento</TableHead>
                  <TableHead>Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredEmployees.map((employee) => (
                  <TableRow key={employee.id}>
                    <TableCell className="font-medium">{employee.name}</TableCell>
                    <TableCell>{formatCPF(employee.cpf)}</TableCell>
                    <TableCell>
                      <div className="flex flex-col space-y-1">
                        <div className="flex items-center gap-1">
                          <Phone className="h-3 w-3" />
                          <span className="text-sm">{formatPhone(employee.phone)}</span>
                        </div>
                        {employee.email && (
                          <div className="flex items-center gap-1">
                            <Mail className="h-3 w-3" />
                            <span className="text-sm">{employee.email}</span>
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">{employee.position}</div>
                        <div className="text-sm text-muted-foreground">
                          {employee.department_name}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">{employee.construction_name}</div>
                        <div className="text-sm text-muted-foreground">
                          {employee.construction_sector_name}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <div className="flex justify-between items-center">
                          <span className="text-xs text-muted-foreground">Salário:</span>
                          <span className="font-medium">{formatCurrency(employee.salary)}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-xs text-muted-foreground">V.R.:</span>
                          <span className="text-sm">{formatCurrency(employee.meal_allowance || '0')}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-xs text-muted-foreground">V.T.:</span>
                          <span className="text-sm">{formatCurrency(employee.transport_allowance || '0')}</span>
                        </div>
                        <div className="flex justify-between items-center border-t pt-1">
                          <span className="text-xs font-medium text-primary">Total:</span>
                          <span className="font-bold text-primary">
                            {formatCurrency(calculateTotalCompensation(employee))}
                          </span>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="text-xs w-14 text-left">Salário:</span>
                          {getPaymentStatusBadge(employee.salary_payment_status)}
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs w-14 text-left">V.R.:</span>
                          {getPaymentStatusBadge(employee.meal_allowance_payment_status)}
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs w-14 text-left">V.T.:</span>
                          {getPaymentStatusBadge(employee.transport_allowance_payment_status)}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Dialog 
                          open={paymentDialogOpen && selectedEmployee?.id === employee.id}
                          onOpenChange={(open) => {
                            setPaymentDialogOpen(open);
                            if (open) setSelectedEmployee(employee);
                          }}
                        >
                          <DialogTrigger asChild>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setSelectedEmployee(employee)}
                            >
                              <DollarSign className="h-4 w-4" />
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Registrar Pagamento</DialogTitle>
                              <DialogDescription>
                                Funcionário: {employee.name}
                              </DialogDescription>
                            </DialogHeader>
                            <div className="space-y-4">
                              <div>
                                <Label htmlFor="payment-type">Tipo de Pagamento</Label>
                                <Select value={paymentType} onValueChange={(value: 'salary' | 'meal_allowance' | 'transport_allowance') => setPaymentType(value)}>
                                  <SelectTrigger>
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="salary">Salário</SelectItem>
                                    <SelectItem value="meal_allowance">Vale Refeição</SelectItem>
                                    <SelectItem value="transport_allowance">Vale Transporte</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                              <div>
                                <Label htmlFor="payment-amount">Valor (opcional)</Label>
                                <Input
                                  id="payment-amount"
                                  placeholder="Deixe vazio para valor total"
                                  value={paymentAmount}
                                  onChange={(e) => setPaymentAmount(e.target.value)}
                                />
                              </div>
                            </div>
                            <DialogFooter>
                              <Button variant="outline" onClick={() => setPaymentDialogOpen(false)}>
                                Cancelar
                              </Button>
                              <Button onClick={handlePaymentSubmit}>
                                Registrar Pagamento
                              </Button>
                            </DialogFooter>
                          </DialogContent>
                        </Dialog>

                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => onEmployeeDelete(employee.id!)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {filteredEmployees.length === 0 && (
            <div className="text-center py-8 space-y-4">
              <div className="text-muted-foreground">
                {employees.length === 0 
                  ? "Nenhum funcionário encontrado. Clique em 'Buscar Funcionários' para atualizar."
                  : "Nenhum funcionário encontrado com os filtros aplicados."
                }
              </div>
              <div className="text-sm text-muted-foreground">
                Total de funcionários carregados: {employees.length || 0}
              </div>
              <div className="text-sm text-muted-foreground">
                Departamentos: {departments.length || 0} | Obras: {constructions.length || 0}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
} 