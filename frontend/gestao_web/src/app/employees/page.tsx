'use client';

import { useState, useEffect } from 'react';
import { useWebSocket } from '@/hooks/useWebSocket';
import { Employee, Department, Construction, ConstructionSector, WebSocketMessage } from '@/lib/types';
import { employeesAPI, departmentsAPI, constructionsAPI, constructionSectorsAPI } from '@/lib/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { EmployeesList } from '@/components/employees/EmployeesList';
import { EmployeeForm } from '@/components/employees/EmployeeForm';
import { EmployeeDashboard } from '@/components/employees/EmployeeDashboard';
import { ConstructionsList } from '@/components/employees/ConstructionsList';
import { toast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';

export default function EmployeesPage() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [constructions, setConstructions] = useState<Construction[]>([]);
  const [constructionSectors, setConstructionSectors] = useState<ConstructionSector[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTab, setSelectedTab] = useState('dashboard');

  const WS_URL = process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:8000/ws/employees/';

  const { isConnected, sendMessage } = useWebSocket({
    url: WS_URL,
    onMessage: handleWebSocketMessage,
    onOpen: () => {
      console.log('Connected to WebSocket');
      // Request initial data
      sendMessage({ type: 'get_dashboard' });
      sendMessage({ type: 'get_employees' });
    },
    onClose: () => {
      console.log('Disconnected from WebSocket');
    },
  });

  function handleWebSocketMessage(message: WebSocketMessage) {
    console.log('📡 WebSocket message received:', message);

    switch (message.type) {
      case 'initial_data':
        console.log('🏗️ Dados iniciais via WebSocket:', message.data);
        if (message.data) {
          setConstructions(message.data.constructions || []);
          setDepartments(message.data.departments || []);
        }
        break;

      case 'employees_update':
        console.log('👥 Atualização de funcionários via WebSocket:', message.data);
        if (message.data) {
          console.log('📝 Atualizando estado com', message.data.length, 'funcionários');
          setEmployees(message.data);
        }
        break;

      case 'update':
        console.log('🔄 Atualização geral:', message.action);
        // Handle specific actions
        if (message.action) {
          switch (message.action) {
            case 'employee_created':
              console.log('✅ Funcionário criado via WebSocket');
              toast({
                title: 'Funcionário criado',
                description: 'Um novo funcionário foi cadastrado com sucesso.',
              });
              break;
            case 'employee_updated':
              toast({
                title: 'Funcionário atualizado',
                description: 'Os dados do funcionário foram atualizados.',
              });
              break;
            case 'employee_deleted':
              toast({
                title: 'Funcionário removido',
                description: 'O funcionário foi removido do sistema.',
              });
              break;
            case 'payment_registered':
              toast({
                title: 'Pagamento registrado',
                description: 'O pagamento foi registrado com sucesso.',
              });
              break;
          }
        }
        break;
    }
  }

  // Load initial data
  useEffect(() => {
    loadInitialData();
  }, []);

  // Debug: Monitor employees state changes
  useEffect(() => {
    console.log('🔍 Estado atual dos funcionários:', employees.length, 'funcionários');
    if (employees.length > 0) {
      console.log('📋 Lista de funcionários:', employees.map(emp => ({ id: emp.id, name: emp.name, cpf: emp.cpf })));
    }
  }, [employees]);

  async function loadInitialData() {
    try {
      setLoading(true);
      console.log('🔄 Carregando dados iniciais...');
      
      // Teste direto com fetch para evitar problemas de autenticação
      const employeesResponse = await fetch('http://localhost:8000/api/employees/employees/');
      const departmentsResponse = await fetch('http://localhost:8000/api/employees/departments/');
      const constructionsResponse = await fetch('http://localhost:8000/api/employees/constructions/');
      
      console.log('📡 Respostas das APIs:', {
        employees: employeesResponse.status,
        departments: departmentsResponse.status,
        constructions: constructionsResponse.status
      });

      const employeesData = employeesResponse.ok ? await employeesResponse.json() : { results: [] };
      const departmentsData = departmentsResponse.ok ? await departmentsResponse.json() : { results: [] };
      const constructionsData = constructionsResponse.ok ? await constructionsResponse.json() : { results: [] };

      console.log('📊 Dados carregados:', {
        funcionarios: employeesData.results?.length || employeesData.length || 0,
        departamentos: departmentsData.results?.length || departmentsData.length || 0,
        obras: constructionsData.results?.length || constructionsData.length || 0
      });
      console.log('👥 Funcionários recebidos:', employeesData);

      // As APIs do Django REST podem retornar dados paginados com "results"
      setEmployees(employeesData.results || employeesData);
      setDepartments(departmentsData.results || departmentsData);
      setConstructions(constructionsData.results || constructionsData);
    } catch (error) {
      console.error('❌ Error loading initial data:', error);
      toast({
        title: 'Erro',
        description: 'Falha ao carregar dados iniciais',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }

  // Load construction sectors when a construction is selected
  async function loadConstructionSectors(constructionId: number) {
    try {
      const sectors = await constructionSectorsAPI.getAll(constructionId);
      setConstructionSectors(sectors);
    } catch (error) {
      console.error('Error loading construction sectors:', error);
    }
  }

  // Handle construction deletion
  async function handleConstructionDelete(constructionId: number) {
    try {
      await constructionsAPI.delete(constructionId);
      
      // Aguardar um pouco para o WebSocket processar a atualização
      setTimeout(() => {
        // Verificar se a construção ainda existe antes de mostrar sucesso
        const stillExists = constructions.find(c => c.id === constructionId);
        if (!stillExists) {
          toast({
            title: 'Sucesso',
            description: 'Obra removida com sucesso',
          });
        }
      }, 1000);
      
      // Reload data after deletion
      await loadInitialData();
    } catch (error) {
      console.error('Error deleting construction:', error);
      
      // Aguardar um pouco antes de mostrar erro para verificar se a operação funcionou
      setTimeout(async () => {
        await loadInitialData();
        const stillExists = constructions.find(c => c.id === constructionId);
        
        if (stillExists) {
          // Se ainda existe, mostrar erro
          toast({
            title: 'Erro',
            description: 'Falha ao remover obra. Verifique se não há funcionários vinculados a esta obra.',
            variant: 'destructive',
          });
        } else {
          // Se não existe mais, a operação funcionou
          toast({
            title: 'Sucesso',
            description: 'Obra removida com sucesso',
          });
        }
      }, 1500);
    }
  }

  // Handle construction update
  async function handleConstructionUpdate(updatedConstruction: Construction) {
    try {
      // Update the constructions state with the updated construction
      setConstructions(prev => prev.map(construction => 
        construction.id === updatedConstruction.id ? updatedConstruction : construction
      ));
      
      toast({
        title: 'Sucesso',
        description: 'Obra atualizada com sucesso',
      });
    } catch (error) {
      console.error('Error updating construction:', error);
      toast({
        title: 'Erro',
        description: 'Falha ao atualizar obra',
        variant: 'destructive',
      });
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Gestão de Funcionários</h1>
          <p className="text-muted-foreground">
            Gerencie funcionários, pagamentos e acompanhe o dashboard em tempo real
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className={`h-3 w-3 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`} />
          <span className="text-sm text-muted-foreground">
            {isConnected ? 'Conectado' : 'Desconectado'}
          </span>
        </div>
      </div>

      <Tabs defaultValue="dashboard" value={selectedTab} onValueChange={setSelectedTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
          <TabsTrigger value="employees">Funcionários</TabsTrigger>
          <TabsTrigger value="add">Adicionar</TabsTrigger>
          <TabsTrigger value="constructions">Obras</TabsTrigger>
        </TabsList>

        <TabsContent value="dashboard" className="space-y-4">
          <EmployeeDashboard />
        </TabsContent>

        <TabsContent value="employees" className="space-y-4">
          <EmployeesList 
            employees={employees}
            departments={departments}
            constructions={constructions}
            onRefresh={loadInitialData}
            onPaymentRegister={async (employeeId, paymentData) => {
              try {
                await employeesAPI.registerPayment(employeeId, paymentData);
                toast({
                  title: 'Sucesso',
                  description: 'Pagamento registrado com sucesso',
                });
              } catch (_error) {
                toast({
                  title: 'Erro',
                  description: 'Falha ao registrar pagamento',
                  variant: 'destructive',
                });
              }
            }}
            onEmployeeDelete={async (employeeId) => {
              try {
                await employeesAPI.delete(employeeId);
                
                // Aguardar um pouco para o WebSocket processar a atualização
                setTimeout(() => {
                  // Verificar se o funcionário ainda existe antes de mostrar sucesso
                  const stillExists = employees.find(e => e.id === employeeId);
                  if (!stillExists) {
                    toast({
                      title: 'Sucesso',
                      description: 'Funcionário removido com sucesso',
                    });
                  }
                }, 1000);
                
                // Reload data after deletion
                await loadInitialData();
              } catch (error) {
                console.error('Error deleting employee:', error);
                
                // Aguardar um pouco antes de mostrar erro para verificar se a operação funcionou
                setTimeout(async () => {
                  await loadInitialData();
                  const stillExists = employees.find(e => e.id === employeeId);
                  
                  if (stillExists) {
                    // Se ainda existe, mostrar erro
                    toast({
                      title: 'Erro',
                      description: 'Falha ao remover funcionário',
                      variant: 'destructive',
                    });
                  } else {
                    // Se não existe mais, a operação funcionou
                    toast({
                      title: 'Sucesso',
                      description: 'Funcionário removido com sucesso',
                    });
                  }
                }, 1500);
              }
            }}
          />
        </TabsContent>

        <TabsContent value="add" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Cadastrar Novo Funcionário</CardTitle>
              <CardDescription>
                Preencha os dados abaixo para cadastrar um novo funcionário
              </CardDescription>
            </CardHeader>
            <CardContent>
              <EmployeeForm
                onSubmit={async (data) => {
                  try {
                    await employeesAPI.create(data);
                    toast({
                      title: 'Sucesso',
                      description: 'Funcionário cadastrado com sucesso',
                    });
                    setSelectedTab('employees');
                  } catch (_error) {
                    toast({
                      title: 'Erro',
                      description: 'Falha ao cadastrar funcionário',
                      variant: 'destructive',
                    });
                  }
                }}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="constructions" className="space-y-4">
          <ConstructionsList
            constructions={constructions}
            onConstructionDelete={handleConstructionDelete}
            onConstructionUpdate={handleConstructionUpdate}
            onRefresh={loadInitialData}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
} 