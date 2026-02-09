import { AlertTriangle, Info, XCircle, LucideIcon } from 'lucide-react';
import { alerts } from '@/data/dashboard';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

type AlertType = 'warning' | 'error' | 'info';

const alertIcons: Record<AlertType, LucideIcon> = {
  warning: AlertTriangle,
  error: XCircle,
  info: Info
};

const alertColors: Record<AlertType, string> = {
  warning: 'bg-orange-50 border-orange-200 text-orange-800',
  error: 'bg-red-50 border-red-200 text-red-800',
  info: 'bg-blue-50 border-blue-200 text-blue-800'
};

const iconColors: Record<AlertType, string> = {
  warning: 'text-orange-600',
  error: 'text-red-600',
  info: 'text-blue-600'
};

export default function AlertsList() {
  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Alertas</h3>
      <div className="space-y-3">
        {alerts.map((alert) => {
          const Icon = alertIcons[alert.type];
          return (
            <div 
              key={alert.id}
              className={`flex items-start gap-3 p-4 rounded-lg border ${alertColors[alert.type]}`}
            >
              <Icon className={`w-5 h-5 mt-0.5 flex-shrink-0 ${iconColors[alert.type]}`} />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium">{alert.message}</p>
                <p className="text-xs opacity-70 mt-1">
                  {format(alert.timestamp, "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}