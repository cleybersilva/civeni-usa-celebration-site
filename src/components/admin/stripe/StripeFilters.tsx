import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, X } from 'lucide-react';
import { format } from 'date-fns';

// Stripe Filters Component - v2.0
interface StripeFiltersProps {
  filters: {
    range: string;
    status: string;
    lote: string;
    cupom: string;
    brand: string;
    customFrom?: Date;
    customTo?: Date;
  };
  onFilterChange: (key: string, value: any) => void;
  onClearFilters: () => void;
}

export const StripeFilters: React.FC<StripeFiltersProps> = ({ filters, onFilterChange, onClearFilters }) => {
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {/* Período */}
          <div className="space-y-2">
            <Label>Período</Label>
            <Select value={filters.range} onValueChange={(v) => onFilterChange('range', v)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7d">Últimos 7 dias</SelectItem>
                <SelectItem value="30d">Últimos 30 dias</SelectItem>
                <SelectItem value="90d">Últimos 90 dias</SelectItem>
                <SelectItem value="custom">Personalizado</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Data início (custom) */}
          {filters.range === 'custom' && (
            <div className="space-y-2">
              <Label>De</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start text-left font-normal">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {filters.customFrom ? format(filters.customFrom, 'dd/MM/yyyy') : 'Selecione'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={filters.customFrom}
                    onSelect={(date) => onFilterChange('customFrom', date)}
                    className="pointer-events-auto"
                  />
                </PopoverContent>
              </Popover>
            </div>
          )}

          {/* Data fim (custom) */}
          {filters.range === 'custom' && (
            <div className="space-y-2">
              <Label>Até</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start text-left font-normal">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {filters.customTo ? format(filters.customTo, 'dd/MM/yyyy') : 'Selecione'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={filters.customTo}
                    onSelect={(date) => onFilterChange('customTo', date)}
                    className="pointer-events-auto"
                  />
                </PopoverContent>
              </Popover>
            </div>
          )}

          {/* Status */}
          <div className="space-y-2">
            <Label>Status</Label>
            <Select value={filters.status} onValueChange={(v) => onFilterChange('status', v)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="succeeded">Confirmado</SelectItem>
                <SelectItem value="processing">Processando</SelectItem>
                <SelectItem value="failed">Falhou</SelectItem>
                <SelectItem value="refunded">Reembolsado</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Lote */}
          <div className="space-y-2">
            <Label>Lote</Label>
            <Input
              placeholder="Filtrar por lote"
              value={filters.lote}
              onChange={(e) => onFilterChange('lote', e.target.value)}
            />
          </div>

          {/* Cupom */}
          <div className="space-y-2">
            <Label>Cupom</Label>
            <Input
              placeholder="Filtrar por cupom"
              value={filters.cupom}
              onChange={(e) => onFilterChange('cupom', e.target.value)}
            />
          </div>

          {/* Bandeira */}
          <div className="space-y-2">
            <Label>Bandeira</Label>
            <Select value={filters.brand} onValueChange={(v) => onFilterChange('brand', v)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas</SelectItem>
                <SelectItem value="visa">Visa</SelectItem>
                <SelectItem value="mastercard">Mastercard</SelectItem>
                <SelectItem value="amex">American Express</SelectItem>
                <SelectItem value="elo">Elo</SelectItem>
                <SelectItem value="hipercard">Hipercard</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Limpar filtros */}
          <div className="flex items-end">
            <Button variant="outline" onClick={onClearFilters} className="w-full">
              <X className="mr-2 h-4 w-4" />
              Limpar
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
