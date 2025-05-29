'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Department, Construction, ConstructionSector, EmployeeFormData } from '@/lib/types';
import { Loader2 } from 'lucide-react';

const formSchema = z.object({
  name: z.string().min(3, 'Nome deve ter pelo menos 3 caracteres'),
  cpf: z.string().regex(/^\d{3}\.\d{3}\.\d{3}-\d{2}$/, 'CPF inválido (formato: 000.000.000-00)'),
  phone: z.string().regex(/^\(\d{2}\) \d{4,5}-\d{4}$/, 'Telefone inválido (formato: (00) 00000-0000)'),
  email: z.string().email('Email inválido').optional().or(z.literal('')),
  department: z.string().min(2, 'Departamento deve ter pelo menos 2 caracteres'),
  position: z.string().min(2, 'Cargo deve ter pelo menos 2 caracteres'),
  construction: z.string().min(2, 'Obra deve ter pelo menos 2 caracteres'),
  construction_sector: z.string().min(2, 'Setor deve ter pelo menos 2 caracteres'),
  salary: z.string().regex(/^\d+(\.\d{1,2})?$/, 'Salário inválido'),
  payment_day: z.string().transform(Number).refine((val) => val >= 1 && val <= 31, {
    message: 'Dia deve ser entre 1 e 31',
  }),
  meal_allowance: z.string().regex(/^\d+(\.\d{1,2})?$/, 'Valor inválido').default('0.00'),
  transport_allowance: z.string().regex(/^\d+(\.\d{1,2})?$/, 'Valor inválido').default('0.00'),
});

interface EmployeeFormProps {
  onSubmit: (data: EmployeeFormData) => Promise<void>;
  initialData?: Partial<EmployeeFormData>;
}

export function EmployeeForm({
  onSubmit,
  initialData,
}: EmployeeFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: initialData?.name || '',
      cpf: initialData?.cpf || '',
      phone: initialData?.phone || '',
      email: initialData?.email || '',
      department: initialData?.department || '',
      position: initialData?.position || '',
      construction: initialData?.construction || '',
      construction_sector: initialData?.construction_sector || '',
      salary: initialData?.salary || '',
      payment_day: initialData?.payment_day?.toString() || '',
      meal_allowance: initialData?.meal_allowance || '0.00',
      transport_allowance: initialData?.transport_allowance || '0.00',
    },
  });

  async function handleSubmit(values: z.infer<typeof formSchema>) {
    try {
      setIsSubmitting(true);
      await onSubmit(values as EmployeeFormData);
      form.reset();
    } catch (error) {
      console.error('Error submitting form:', error);
    } finally {
      setIsSubmitting(false);
    }
  }

  // Format CPF as user types
  const formatCPF = (value: string) => {
    const numbers = value.replace(/\D/g, '');
    if (numbers.length <= 11) {
      return numbers
        .replace(/(\d{3})(\d)/, '$1.$2')
        .replace(/(\d{3})(\d)/, '$1.$2')
        .replace(/(\d{3})(\d{1,2})/, '$1-$2')
        .replace(/(-\d{2})\d+?$/, '$1');
    }
    return value;
  };

  // Format phone as user types
  const formatPhone = (value: string) => {
    const numbers = value.replace(/\D/g, '');
    if (numbers.length <= 11) {
      return numbers
        .replace(/(\d{2})(\d)/, '($1) $2')
        .replace(/(\d{5})(\d)/, '$1-$2')
        .replace(/(-\d{4})\d+?$/, '$1');
    }
    return value;
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2">
          {/* Personal Information */}
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Nome Completo</FormLabel>
                <FormControl>
                  <Input placeholder="João da Silva" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="cpf"
            render={({ field }) => (
              <FormItem>
                <FormLabel>CPF</FormLabel>
                <FormControl>
                  <Input
                    placeholder="000.000.000-00"
                    {...field}
                    onChange={(e) => field.onChange(formatCPF(e.target.value))}
                    maxLength={14}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="phone"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Telefone</FormLabel>
                <FormControl>
                  <Input
                    placeholder="(00) 00000-0000"
                    {...field}
                    onChange={(e) => field.onChange(formatPhone(e.target.value))}
                    maxLength={15}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email (opcional)</FormLabel>
                <FormControl>
                  <Input placeholder="joao@exemplo.com" type="email" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Work Information */}
          <FormField
            control={form.control}
            name="department"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Departamento</FormLabel>
                <FormControl>
                  <Input placeholder="Ex: Engenharia, Construção, Administrativo" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="position"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Cargo</FormLabel>
                <FormControl>
                  <Input placeholder="Ex: Pedreiro, Eletricista" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="construction"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Obra</FormLabel>
                <FormControl>
                  <Input placeholder="Ex: Residencial Vila Real, Edifício Comercial Centro" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="construction_sector"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Setor da Obra</FormLabel>
                <FormControl>
                  <Input placeholder="Ex: Estrutura, Acabamento, Elétrica, Hidráulica" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Payment Information */}
          <FormField
            control={form.control}
            name="salary"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Salário (R$)</FormLabel>
                <FormControl>
                  <Input placeholder="0000.00" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="payment_day"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Dia do Pagamento</FormLabel>
                <FormControl>
                  <Input placeholder="15" type="number" min="1" max="31" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="meal_allowance"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Vale Refeição (R$)</FormLabel>
                <FormControl>
                  <Input placeholder="0.00" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="transport_allowance"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Vale Transporte (R$)</FormLabel>
                <FormControl>
                  <Input placeholder="0.00" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="flex justify-end gap-4">
          <Button type="button" variant="outline" onClick={() => form.reset()}>
            Limpar
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {initialData ? 'Atualizar' : 'Cadastrar'}
          </Button>
        </div>
      </form>
    </Form>
  );
} 