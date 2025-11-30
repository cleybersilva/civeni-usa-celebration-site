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
    <Card className="border-l-4 border-l-blue-500 bg-gradient-to-br from-blue-50/50 to-cyan-50/50 dark:from-blue-950/10 dark:to-cyan-950/10 w-full">
      <CardContent className="pt-4 sm:pt-6 px-3 sm:px-4 md:px-6">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-3 sm:gap-4">
          {/* Período */}
          <div className="space-y-1.5 sm:space-y-2">
            <Label className="text-blue-700 dark:text-blue-300 font-semibold text-xs sm:text-sm">Período</Label>
            <Select value={filters.range} onValueChange={(v) => onFilterChange('range', v)}>
              <SelectTrigger className="border-blue-300 dark:border-blue-700 focus:ring-blue-500 text-xs sm:text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="7d">Últimos 7 dias</SelectItem>
                <SelectItem value="30d">Últimos 30 dias</SelectItem>
                <SelectItem value="90d">Últimos 90 dias</SelectItem>
                <SelectItem value="custom">Personalizado</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Data início (custom) */}
          {filters.range === 'custom' && (
            <div className="space-y-1.5 sm:space-y-2">
              <Label className="text-purple-700 dark:text-purple-300 font-semibold text-xs sm:text-sm">De</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start text-left font-normal border-purple-300 dark:border-purple-700 hover:bg-purple-50 dark:hover:bg-purple-950/30 text-xs sm:text-sm">
                    <CalendarIcon className="mr-1 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4 text-purple-600 dark:text-purple-400" />
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
            <div className="space-y-1.5 sm:space-y-2">
              <Label className="text-purple-700 dark:text-purple-300 font-semibold text-xs sm:text-sm">Até</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start text-left font-normal border-purple-300 dark:border-purple-700 hover:bg-purple-50 dark:hover:bg-purple-950/30 text-xs sm:text-sm">
                    <CalendarIcon className="mr-1 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4 text-purple-600 dark:text-purple-400" />
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
          <div className="space-y-1.5 sm:space-y-2">
            <Label className="text-green-700 dark:text-green-300 font-semibold text-xs sm:text-sm">Status</Label>
            <Select value={filters.status} onValueChange={(v) => onFilterChange('status', v)}>
              <SelectTrigger className="border-green-300 dark:border-green-700 focus:ring-green-500 text-xs sm:text-sm">
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
          <div className="space-y-1.5 sm:space-y-2">
            <Label className="text-orange-700 dark:text-orange-300 font-semibold text-xs sm:text-sm">Lote</Label>
            <Input
              placeholder="Filtrar por lote"
              value={filters.lote}
              onChange={(e) => onFilterChange('lote', e.target.value)}
              className="border-orange-300 dark:border-orange-700 focus:ring-orange-500 text-xs sm:text-sm"
            />
          </div>

          {/* Cupom */}
          <div className="space-y-1.5 sm:space-y-2">
            <Label className="text-pink-700 dark:text-pink-300 font-semibold text-xs sm:text-sm">Cupom</Label>
            <Input
              placeholder="Filtrar por cupom"
              value={filters.cupom}
              onChange={(e) => onFilterChange('cupom', e.target.value)}
              className="border-pink-300 dark:border-pink-700 focus:ring-pink-500 text-xs sm:text-sm"
            />
          </div>

          {/* Bandeira */}
          <div className="space-y-1.5 sm:space-y-2 col-span-2 sm:col-span-1 flex flex-col items-center sm:items-stretch">
            <Label className="text-indigo-700 dark:text-indigo-300 font-semibold text-xs sm:text-sm text-center sm:text-left">Bandeira</Label>
            <Select value={filters.brand} onValueChange={(v) => onFilterChange('brand', v)}>
              <SelectTrigger className="border-indigo-300 dark:border-indigo-700 focus:ring-indigo-500 text-xs sm:text-sm w-full max-w-[200px] sm:max-w-none">
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
          <div className="flex items-end col-span-2 md:col-span-1">
            <Button 
              onClick={onClearFilters} 
              className="w-full text-white border-0 text-xs sm:text-sm"
              style={{ background: 'linear-gradient(to right, #021b3a, #731b4c, #c51d3b)' }}
            >
              <X className="mr-1 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4" />
              Limpar
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
