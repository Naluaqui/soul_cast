import { 
  MessageSquare, 
  Phone, 
  Mail, 
  Clock, 
  ChevronRight,
  Ban,
  User
} from 'lucide-react';
import { CaseItem, caseStatusLabels, caseStatusColors, channelLabels } from '@/data/cases';
import { format, formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Link } from 'react-router';

interface CaseCardProps {
  caseItem: CaseItem;
}

export default function CaseCard({ caseItem }: CaseCardProps) {
  const getRiskColor = (score: number) => {
    if (score >= 80) return 'text-red-600 bg-red-50';
    if (score >= 60) return 'text-orange-600 bg-orange-50';
    if (score >= 40) return 'text-yellow-600 bg-yellow-50';
    return 'text-green-600 bg-green-50';
  };

  const getChannelIcon = (channel: string) => {
    switch (channel) {
      case 'whatsapp': return <MessageSquare className="w-4 h-4 text-green-600" />;
      case 'phone': return <Phone className="w-4 h-4 text-blue-600" />;
      case 'email': return <Mail className="w-4 h-4 text-purple-600" />;
      case 'sms': return <MessageSquare className="w-4 h-4 text-gray-600" />;
      default: return null;
    }
  };

  return (
    <Link 
      to={`/cases/${caseItem.id}`}
      className="block bg-white rounded-xl border border-gray-200 p-5 hover:shadow-lg hover:border-blue-300 transition-all duration-200 group"
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-1">
            <h3 className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
              {caseItem.customerName}
            </h3>
            {!caseItem.hasConsent && (
              <span className="flex items-center gap-1 text-xs text-red-600 bg-red-50 px-2 py-0.5 rounded-full">
                <Ban className="w-3 h-3" />
                Sem Consentimento
              </span>
            )}
          </div>
          <div className="flex items-center gap-4 text-sm text-gray-500">
            <span>{caseItem.customerDocument}</span>
            <span>•</span>
            <span>{caseItem.contractType}</span>
            <span>•</span>
            <span className="font-mono text-xs">{caseItem.id}</span>
          </div>
        </div>
        <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-blue-500 transition-colors" />
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
        <div>
          <p className="text-xs text-gray-500 mb-1">Valor Total</p>
          <p className="font-bold text-lg text-gray-900">
            R$ {caseItem.totalDebt.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </p>
        </div>
        <div>
          <p className="text-xs text-gray-500 mb-1">Dias em Atraso</p>
          <p className={`font-bold text-lg ${caseItem.daysOverdue > 30 ? 'text-red-600' : caseItem.daysOverdue > 15 ? 'text-orange-600' : 'text-gray-900'}`}>
            D+{caseItem.daysOverdue}
          </p>
        </div>
        <div>
          <p className="text-xs text-gray-500 mb-1">Parcelas</p>
          <p className="font-semibold text-gray-900">
            {caseItem.installmentsOverdue}/{caseItem.totalInstallments}
            <span className="text-xs text-gray-500 font-normal ml-1">em atraso</span>
          </p>
        </div>
        <div>
          <p className="text-xs text-gray-500 mb-1">Score de Risco</p>
          <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-sm font-semibold ${getRiskColor(caseItem.riskScore)}`}>
            {caseItem.riskScore}
          </span>
        </div>
      </div>

      <div className="flex items-center justify-between pt-4 border-t border-gray-100">
        <div className="flex items-center gap-4">
          <span className={`px-3 py-1 rounded-full text-xs font-medium ${caseStatusColors[caseItem.status]}`}>
            {caseStatusLabels[caseItem.status]}
          </span>
          
          {caseItem.lastContactDate && (
            <div className="flex items-center gap-2 text-sm text-gray-500">
              {getChannelIcon(caseItem.lastContactChannel)}
              <span>
                {channelLabels[caseItem.lastContactChannel]} • {formatDistanceToNow(caseItem.lastContactDate, { addSuffix: true, locale: ptBR })}
              </span>
            </div>
          )}
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1 text-sm text-gray-500">
            <User className="w-4 h-4" />
            <span>{caseItem.assignedOperator}</span>
          </div>
          
          <div className="flex items-center gap-1 text-sm text-gray-500">
            <Clock className="w-4 h-4" />
            <span>Próx: {format(caseItem.nextActionDate, 'dd/MM HH:mm')}</span>
          </div>
        </div>
      </div>
    </Link>
  );
}
