
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, DollarSign, AlertTriangle, TrendingUp } from 'lucide-react';

interface AlertLog {
  id: string;
  alert_type: string;
  recipient_type: string;
  recipient: string;
  message: string;
  status: string;
  created_at: string;
}

interface AlertsLogProps {
  alerts: AlertLog[];
}

const AlertsLog: React.FC<AlertsLogProps> = ({ alerts }) => {
  const getAlertIcon = (alertType: string) => {
    switch (alertType) {
      case 'new_registration':
        return <Users className="w-4 h-4" />;
      case 'payment_completed':
        return <DollarSign className="w-4 h-4" />;
      case 'daily_report':
        return <TrendingUp className="w-4 h-4" />;
      default:
        return <AlertTriangle className="w-4 h-4" />;
    }
  };

  const getAlertTypeLabel = (alertType: string) => {
    const labels = {
      'new_registration': 'Nova Inscrição',
      'payment_completed': 'Pagamento Confirmado',
      'daily_report': 'Relatório Diário',
      'batch_started': 'Lote Iniciado',
      'batch_ended': 'Lote Encerrado'
    };
    return labels[alertType as keyof typeof labels] || alertType;
  };

  return (
    <Card className="bg-gradient-to-br from-gray-50 to-white border-gray-200 shadow-lg">
      <CardHeader className="bg-gradient-to-r from-gray-100 to-gray-50 border-b border-gray-200 rounded-t-lg">
        <CardTitle className="text-gray-800">Últimos Alertas</CardTitle>
      </CardHeader>
      <CardContent className="p-6">
        <div className="space-y-4">
          {alerts.length === 0 ? (
            <p className="text-muted-foreground bg-gray-100 p-4 rounded-lg text-center">Nenhum alerta encontrado</p>
          ) : (
            alerts.map((alert) => (
              <div key={alert.id} className="flex items-start space-x-3 p-4 border rounded-lg bg-gradient-to-r from-white to-gray-50 hover:from-gray-50 hover:to-gray-100 transition-all duration-300 shadow-sm hover:shadow-md">
                <div className="mt-0.5 p-2 rounded-full bg-blue-100">
                  {getAlertIcon(alert.alert_type)}
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-sm text-gray-800">
                      {getAlertTypeLabel(alert.alert_type)}
                    </span>
                    <span className="text-xs text-muted-foreground bg-gray-200 px-2 py-1 rounded-full">
                      {new Date(alert.created_at).toLocaleString('pt-BR')}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">
                    {alert.message}
                  </p>
                  <div className="flex items-center gap-2 mt-2">
                    <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full font-medium">
                      {alert.recipient_type.toUpperCase()}
                    </span>
                    <span className="text-xs text-muted-foreground bg-gray-100 px-2 py-1 rounded-full">
                      {alert.recipient}
                    </span>
                    <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                      alert.status === 'sent' ? 'bg-green-100 text-green-700' :
                      alert.status === 'failed' ? 'bg-red-100 text-red-700' :
                      'bg-yellow-100 text-yellow-700'
                    }`}>
                      {alert.status}
                    </span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default AlertsLog;
