import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { 
  MessageSquare, 
  Phone, 
  DollarSign, 
  FileText, 
  AlertCircle,
  Clock,
  User
} from 'lucide-react';
import { TimelineEvent, eventTypeLabels } from '@/data/caseDetails';

interface CaseTimelineProps {
  events: TimelineEvent[];
}

export default function CaseTimeline({ events }: CaseTimelineProps) {
  const getEventIcon = (event: TimelineEvent) => {
    const iconClass = "w-4 h-4";
    
    switch (event.type) {
      case 'message_sent':
      case 'message_delivered':
      case 'message_read':
      case 'message_failed':
        return <MessageSquare className={iconClass} />;
      case 'call_made':
      case 'call_answered':
      case 'call_missed':
        return <Phone className={iconClass} />;
      case 'payment_received':
        return <DollarSign className={iconClass} />;
      case 'promise_registered':
      case 'deal_proposed':
      case 'deal_accepted':
      case 'deal_rejected':
        return <FileText className={iconClass} />;
      case 'note_added':
        return <FileText className={iconClass} />;
      default:
        return <AlertCircle className={iconClass} />;
    }
  };

  const getEventColor = (event: TimelineEvent) => {
    if (event.status === 'failed') return 'bg-red-100 text-red-600 border-red-200';
    
    switch (event.type) {
      case 'payment_received':
      case 'deal_accepted':
      case 'consent_given':
        return 'bg-green-100 text-green-600 border-green-200';
      case 'message_failed':
      case 'call_missed':
      case 'deal_rejected':
      case 'consent_revoked':
        return 'bg-red-100 text-red-600 border-red-200';
      case 'deal_proposed':
      case 'promise_registered':
        return 'bg-purple-100 text-purple-600 border-purple-200';
      case 'message_sent':
      case 'message_delivered':
      case 'message_read':
        return 'bg-blue-100 text-blue-600 border-blue-200';
      case 'call_made':
      case 'call_answered':
        return 'bg-yellow-100 text-yellow-600 border-yellow-200';
      case 'case_paused':
        return 'bg-gray-100 text-gray-600 border-gray-200';
      default:
        return 'bg-gray-100 text-gray-600 border-gray-200';
    }
  };

  const getChannelBadge = (channel?: string) => {
    if (!channel) return null;
    
    const badges: Record<string, { bg: string; text: string }> = {
      whatsapp: { bg: 'bg-green-50', text: 'text-green-700' },
      sms: { bg: 'bg-blue-50', text: 'text-blue-700' },
      email: { bg: 'bg-purple-50', text: 'text-purple-700' },
      phone: { bg: 'bg-yellow-50', text: 'text-yellow-700' },
      system: { bg: 'bg-gray-50', text: 'text-gray-700' }
    };
    
    const style = badges[channel] || badges.system;
    
    return (
      <span className={`text-xs px-2 py-0.5 rounded-full ${style.bg} ${style.text}`}>
        {channel === 'whatsapp' ? 'WhatsApp' : 
         channel === 'sms' ? 'SMS' :
         channel === 'email' ? 'E-mail' :
         channel === 'phone' ? 'Telefone' : 'Sistema'}
      </span>
    );
  };

  const sortedEvents = [...events].sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-100 bg-gray-50">
        <h3 className="font-semibold text-gray-900">Timeline de Eventos</h3>
        <p className="text-sm text-gray-500">{events.length} eventos registrados</p>
      </div>
      
      <div className="max-h-[600px] overflow-y-auto">
        <div className="p-6">
          <div className="relative">
            {/* Timeline line */}
            <div className="absolute left-[19px] top-0 bottom-0 w-0.5 bg-gray-200" />
            
            <div className="space-y-6">
              {sortedEvents.map((event) => (
                <div key={event.id} className="relative flex gap-4">
                  {/* Icon */}
                  <div className={`relative z-10 w-10 h-10 rounded-full border-2 flex items-center justify-center ${getEventColor(event)}`}>
                    {getEventIcon(event)}
                  </div>
                  
                  {/* Content */}
                  <div className="flex-1 min-w-0 pb-6">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span className="font-medium text-gray-900">
                        {eventTypeLabels[event.type]}
                      </span>
                      {getChannelBadge(event.channel)}
                      {event.status === 'failed' && (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-red-100 text-red-700">
                          Falhou
                        </span>
                      )}
                    </div>
                    
                    <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
                      <Clock className="w-3.5 h-3.5" />
                      <span>{format(event.timestamp, "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}</span>
                      {event.operator && (
                        <>
                          <span>•</span>
                          <User className="w-3.5 h-3.5" />
                          <span>{event.operator}</span>
                        </>
                      )}
                    </div>
                    
                    {event.content && (
                      <div className="bg-gray-50 rounded-lg p-3 text-sm text-gray-700 border border-gray-100">
                        {event.content}
                      </div>
                    )}
                    
                    {event.metadata && Object.keys(event.metadata).length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-2">
                        {Object.entries(event.metadata).map(([key, value]) => (
                          <span key={key} className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">
                            {key}: {String(value)}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
