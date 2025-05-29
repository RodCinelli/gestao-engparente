'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Construction } from '@/lib/types';
import { constructionsAPI } from '@/lib/api';
import { Trash2, Building2, Calendar, MapPin, RefreshCw, Edit3 } from 'lucide-react';

interface ConstructionsListProps {
  constructions: Construction[];
  onConstructionDelete: (constructionId: number) => Promise<void>;
  onConstructionUpdate?: (construction: Construction) => Promise<void>;
  onRefresh: () => void;
}

export function ConstructionsList({
  constructions,
  onConstructionDelete,
  onConstructionUpdate,
  onRefresh,
}: ConstructionsListProps) {
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [editingConstruction, setEditingConstruction] = useState<Construction | null>(null);
  const [editForm, setEditForm] = useState({
    address: '',
    end_date: '',
  });
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const handleDelete = async (constructionId: number) => {
    try {
      setDeletingId(constructionId);
      await onConstructionDelete(constructionId);
    } catch (error) {
      console.error('Error deleting construction:', error);
      // A página principal já cuida de mostrar toasts de erro
    } finally {
      setDeletingId(null);
    }
  };

  const handleEditClick = (construction: Construction) => {
    setEditingConstruction(construction);
    setEditForm({
      address: construction.address || '',
      end_date: construction.end_date || '',
    });
    setIsEditDialogOpen(true);
  };

  const handleEditSave = async () => {
    if (!editingConstruction) return;

    try {
      setIsSaving(true);
      
      const updatedConstruction = await constructionsAPI.update(editingConstruction.id, {
        address: editForm.address,
        end_date: editForm.end_date || null,
      });

      if (onConstructionUpdate) {
        await onConstructionUpdate(updatedConstruction);
      }
      
      setIsEditDialogOpen(false);
      setEditingConstruction(null);
      onRefresh();
    } catch (error) {
      console.error('Error updating construction:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleEditCancel = () => {
    setIsEditDialogOpen(false);
    setEditingConstruction(null);
    setEditForm({ address: '', end_date: '' });
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  const getStatusBadge = (isActive: boolean, endDate: string | null | undefined) => {
    if (!isActive) {
      return <Badge variant="secondary">Inativa</Badge>;
    }
    
    if (endDate && new Date(endDate) < new Date()) {
      return <Badge variant="destructive">Finalizada</Badge>;
    }
    
    return <Badge variant="default" className="bg-green-600">Ativa</Badge>;
  };

  const activeConstructions = constructions.filter(construction => construction.is_active);
  const inactiveConstructions = constructions.filter(construction => !construction.is_active);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-medium">Gerenciar Obras</h3>
          <p className="text-sm text-muted-foreground">
            {activeConstructions.length} obra{activeConstructions.length !== 1 ? 's' : ''} ativa{activeConstructions.length !== 1 ? 's' : ''}
          </p>
        </div>
        <Button variant="outline" onClick={onRefresh} className="gap-2">
          <RefreshCw className="h-4 w-4" />
          Atualizar
        </Button>
      </div>

      {/* Active Constructions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Obras Ativas
          </CardTitle>
          <CardDescription>
            Obras atualmente em andamento
          </CardDescription>
        </CardHeader>
        <CardContent>
          {activeConstructions.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Building2 className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Nenhuma obra ativa encontrada</p>
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome da Obra</TableHead>
                    <TableHead>Endereço</TableHead>
                    <TableHead>Data de Início</TableHead>
                    <TableHead>Data de Término</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="w-[100px]">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {activeConstructions.map((construction) => (
                    <TableRow key={construction.id}>
                      <TableCell className="font-medium">
                        {construction.name}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1 max-w-xs">
                          <MapPin className="h-3 w-3 text-muted-foreground flex-shrink-0" />
                          <span className="truncate text-sm">{construction.address}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3 w-3 text-muted-foreground" />
                          <span className="text-sm">{formatDate(construction.start_date)}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        {construction.end_date ? (
                          <div className="flex items-center gap-1">
                            <Calendar className="h-3 w-3 text-muted-foreground" />
                            <span className="text-sm">{formatDate(construction.end_date)}</span>
                          </div>
                        ) : (
                          <span className="text-sm text-muted-foreground">Não definida</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {getStatusBadge(construction.is_active, construction.end_date)}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEditClick(construction)}
                            className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                          >
                            <Edit3 className="h-4 w-4" />
                          </Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button
                                variant="outline"
                                size="sm"
                                className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                disabled={deletingId === construction.id}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Tem certeza que deseja excluir a obra "{construction.name}"?
                                  <br />
                                  <strong className="text-red-600">
                                    Esta ação não pode ser desfeita e irá afetar todos os funcionários vinculados a esta obra.
                                  </strong>
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => handleDelete(construction.id)}
                                  className="bg-red-600 hover:bg-red-700"
                                >
                                  Excluir Obra
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Inactive Constructions (if any) */}
      {inactiveConstructions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5 opacity-60" />
              Obras Inativas
            </CardTitle>
            <CardDescription>
              Obras que foram finalizadas ou desativadas
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome da Obra</TableHead>
                    <TableHead>Endereço</TableHead>
                    <TableHead>Data de Início</TableHead>
                    <TableHead>Data de Término</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="w-[100px]">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {inactiveConstructions.map((construction) => (
                    <TableRow key={construction.id} className="opacity-60">
                      <TableCell className="font-medium">
                        {construction.name}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1 max-w-xs">
                          <MapPin className="h-3 w-3 text-muted-foreground flex-shrink-0" />
                          <span className="truncate text-sm">{construction.address}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3 w-3 text-muted-foreground" />
                          <span className="text-sm">{formatDate(construction.start_date)}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        {construction.end_date ? (
                          <div className="flex items-center gap-1">
                            <Calendar className="h-3 w-3 text-muted-foreground" />
                            <span className="text-sm">{formatDate(construction.end_date)}</span>
                          </div>
                        ) : (
                          <span className="text-sm text-muted-foreground">Não definida</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {getStatusBadge(construction.is_active, construction.end_date)}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEditClick(construction)}
                            className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                          >
                            <Edit3 className="h-4 w-4" />
                          </Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button
                                variant="outline"
                                size="sm"
                                className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                disabled={deletingId === construction.id}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Tem certeza que deseja excluir a obra "{construction.name}"?
                                  <br />
                                  <strong className="text-red-600">
                                    Esta ação não pode ser desfeita.
                                  </strong>
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => handleDelete(construction.id)}
                                  className="bg-red-600 hover:bg-red-700"
                                >
                                  Excluir Obra
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}
      
      {/* Modal de Edição */}
      <Dialog open={isEditDialogOpen} onOpenChange={(open) => {
        if (!open) handleEditCancel();
      }}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Editar Obra</DialogTitle>
            <DialogDescription>
              Defina o endereço e a data de término da obra "{editingConstruction?.name}".
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="address">Endereço</Label>
              <Textarea
                id="address"
                placeholder="Digite o endereço completo da obra..."
                value={editForm.address}
                onChange={(e) => setEditForm(prev => ({ ...prev, address: e.target.value }))}
                rows={3}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="end_date">Data de Término (Opcional)</Label>
              <Input
                id="end_date"
                type="date"
                value={editForm.end_date}
                onChange={(e) => setEditForm(prev => ({ ...prev, end_date: e.target.value }))}
              />
              <p className="text-xs text-muted-foreground">
                Deixe em branco se a data ainda não foi definida
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={handleEditCancel} disabled={isSaving}>
              Cancelar
            </Button>
            <Button onClick={handleEditSave} disabled={isSaving}>
              {isSaving ? 'Salvando...' : 'Salvar Alterações'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
} 