import React from 'react';
import { useTranslation } from 'react-i18next';
import { DollarSign, Calendar, Clock } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Lote } from '@/hooks/useLotes';

interface LoteInfoProps {
  lote: Lote;
}

const LoteInfo = ({ lote }: LoteInfoProps) => {
  const { t, i18n } = useTranslation();

  const formatPrice = (cents: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(cents / 100);
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr + 'T00:00:00').toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      timeZone: 'America/Fortaleza'
    });
  };

  const getDaysRemaining = () => {
    const hoje = new Date();
    const fim = new Date(lote.dt_fim + 'T23:59:59-03:00'); // Timezone Fortaleza
    const diffTime = fim.getTime() - hoje.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return Math.max(0, diffDays);
  };

  const daysRemaining = getDaysRemaining();

  return (
    <Card className="border-primary/20 bg-gradient-to-r from-primary/5 to-primary/10">
      <CardHeader>
        <CardTitle className="flex items-center justify-center gap-2 text-primary">
          <div className="w-3 h-3 rounded-full bg-green-500 animate-pulse"></div>
          <DollarSign className="w-5 h-5" />
          {lote.nome}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Preço */}
        <div className="text-center">
          <div className="text-3xl font-bold text-primary">
            {formatPrice(lote.price_cents)}
          </div>
          <Badge variant="secondary" className="mt-1">
            Preço atual da inscrição
          </Badge>
        </div>

        {/* Período */}
        <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
          <Calendar className="w-4 h-4" />
          <span>
            Válido de {formatDate(lote.dt_inicio)} a {formatDate(lote.dt_fim)}
          </span>
        </div>

        {/* Dias restantes */}
        {daysRemaining > 0 && (
          <div className="flex items-center justify-center gap-2">
            <Clock className="w-4 h-4 text-orange-500" />
            <span className="text-sm font-medium text-orange-600">
              {daysRemaining === 1 
                ? 'Último dia!' 
                : `${daysRemaining} dias restantes`
              }
            </span>
          </div>
        )}

        <div className="text-xs text-center text-muted-foreground">
          * Horário de Fortaleza (GMT-3)
        </div>
      </CardContent>
    </Card>
  );
};

export default LoteInfo;