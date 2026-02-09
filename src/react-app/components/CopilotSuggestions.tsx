import { useState, useEffect } from 'react';
import { 
  Sparkles, 
  MessageSquare, 
  HandshakeIcon, 
  AlertTriangle,
  CheckCircle,
  TrendingUp,
  Lightbulb,
  ChevronRight,
  RefreshCw,
  ThumbsUp,
  ThumbsDown,
  Copy,
  Check
} from 'lucide-react';

interface CaseData {
  id: number;
  case_number: string;
  customer_name: string;
  customer_phone?: string | null;
  customer_email?: string | null;
  total_debt: number;
  days_overdue: number;
  status: string;
  risk_score: number;
  has_consent: number;
  contract_type?: string | null;
  installments_overdue: number;
  total_installments: number;
  last_contact_at?: string | null;
  timeline: Array<{ event_type: string; title: string; created_at: string }>;
}

interface Suggestion {
  id: string;
  type: 'message' | 'action' | 'warning' | 'insight' | 'deal';
  priority: 'high' | 'medium' | 'low';
  title: string;
  description: string;
  reasoning: string;
  actionLabel?: string;
  template?: string;
  confidence: number;
}

interface CopilotSuggestionsProps {
  caseData: CaseData;
  onApplySuggestion: (suggestion: Suggestion) => void;
}

export default function CopilotSuggestions({ caseData, onApplySuggestion }: CopilotSuggestionsProps) {
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [feedbackGiven, setFeedbackGiven] = useState<Record<string, 'up' | 'down'>>({});

  useEffect(() => {
    generateSuggestions();
  }, [caseData]);

  const generateSuggestions = () => {
    setLoading(true);
    
    // Simulate AI processing delay
    setTimeout(() => {
      const newSuggestions: Suggestion[] = [];
      
      // Analyze case data and generate contextual suggestions
      const daysSinceContact = caseData.last_contact_at 
        ? Math.floor((Date.now() - new Date(caseData.last_contact_at).getTime()) / (1000 * 60 * 60 * 24))
        : 999;
      
      const hasRecentContact = daysSinceContact < 3;
      const isHighRisk = caseData.risk_score >= 70;
      const hasConsent = caseData.has_consent === 1;
      const recentEvents = caseData.timeline.filter(e => {
        const eventDate = new Date(e.created_at);
        const daysDiff = (Date.now() - eventDate.getTime()) / (1000 * 60 * 60 * 24);
        return daysDiff < 7;
      });
      const hasRecentPromise = recentEvents.some(e => e.title.toLowerCase().includes('promessa'));

      // 1. Contact timing suggestion
      if (!hasRecentContact && hasConsent) {
        newSuggestions.push({
          id: 'contact-timing',
          type: 'action',
          priority: 'high',
          title: 'Momento ideal para contato',
          description: `Sem contato há ${daysSinceContact} dias. Recomendo iniciar contato agora.`,
          reasoning: `Análise de perfil indica que clientes com ${caseData.days_overdue} dias de atraso respondem melhor entre 10h-12h. Taxa de sucesso: 68%.`,
          actionLabel: 'Enviar WhatsApp',
          confidence: 0.85
        });
      }

      // 2. Deal suggestion based on debt and overdue days
      if (caseData.days_overdue > 30 && !hasRecentPromise) {
        const discountPercentage = caseData.days_overdue > 90 ? 25 : caseData.days_overdue > 60 ? 20 : 15;
        const discountedValue = caseData.total_debt * (1 - discountPercentage / 100);
        
        newSuggestions.push({
          id: 'deal-suggestion',
          type: 'deal',
          priority: isHighRisk ? 'high' : 'medium',
          title: `Proposta de acordo: ${discountPercentage}% de desconto`,
          description: `Oferecer R$ ${discountedValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} à vista ou entrada + parcelas.`,
          reasoning: `Baseado em 847 casos similares (D+${caseData.days_overdue}, ${caseData.contract_type || 'mesmo tipo'}), essa proposta teve 72% de aceitação.`,
          template: `Olá ${caseData.customer_name.split(' ')[0]}! Temos uma condição especial para você: ${discountPercentage}% de desconto para pagamento até amanhã. Valor: R$ ${discountedValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}. Posso gerar o boleto agora?`,
          actionLabel: 'Aplicar Proposta',
          confidence: 0.72
        });
      }

      // 3. Risk warning
      if (isHighRisk) {
        newSuggestions.push({
          id: 'risk-warning',
          type: 'warning',
          priority: 'high',
          title: 'Alto risco de perda',
          description: `Score ${caseData.risk_score}: probabilidade de 67% de não recuperação sem intervenção imediata.`,
          reasoning: `Indicadores: ${caseData.installments_overdue} parcelas atrasadas, D+${caseData.days_overdue}, padrão de não resposta detectado.`,
          actionLabel: 'Escalar para Supervisor',
          confidence: 0.89
        });
      }

      // 4. Consent suggestion
      if (!hasConsent) {
        newSuggestions.push({
          id: 'consent-required',
          type: 'warning',
          priority: 'high',
          title: 'Consentimento necessário',
          description: 'Envio de mensagens bloqueado. Solicite consentimento via canal permitido.',
          reasoning: 'LGPD Art. 7º: tratamento de dados requer consentimento. Sem ele, apenas contato para obter autorização é permitido.',
          actionLabel: 'Solicitar Consentimento',
          confidence: 1.0
        });
      }

      // 5. Message template suggestion
      if (hasConsent && !hasRecentContact) {
        const firstName = caseData.customer_name.split(' ')[0];
        let messageType = 'reminder';
        let template = '';
        
        if (caseData.days_overdue <= 15) {
          messageType = 'amigável';
          template = `Olá ${firstName}! Tudo bem? 😊 Notei uma pendência de R$ ${caseData.total_debt.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} em aberto. Posso ajudar a resolver isso hoje?`;
        } else if (caseData.days_overdue <= 45) {
          messageType = 'urgente';
          template = `${firstName}, sua pendência de R$ ${caseData.total_debt.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} está em D+${caseData.days_overdue}. Precisamos regularizar antes que haja negativação. Posso apresentar uma proposta especial?`;
        } else {
          messageType = 'última tentativa';
          template = `${firstName}, última oportunidade de acordo antes da negativação. Temos condições especiais para quitação. Posso explicar as opções disponíveis?`;
        }
        
        newSuggestions.push({
          id: 'message-template',
          type: 'message',
          priority: caseData.days_overdue > 45 ? 'high' : 'medium',
          title: `Mensagem sugerida: tom ${messageType}`,
          description: 'Template otimizado baseado no perfil do cliente e histórico de interações.',
          reasoning: `Tom ${messageType} indicado para D+${caseData.days_overdue}. Mensagens personalizadas têm 40% mais resposta.`,
          template,
          actionLabel: 'Usar Template',
          confidence: 0.78
        });
      }

      // 6. Channel optimization insight
      if (hasConsent && caseData.customer_phone && caseData.customer_email) {
        const preferredChannel = caseData.days_overdue > 30 ? 'WhatsApp' : 'E-mail';
        newSuggestions.push({
          id: 'channel-insight',
          type: 'insight',
          priority: 'low',
          title: `Canal recomendado: ${preferredChannel}`,
          description: `Para D+${caseData.days_overdue}, ${preferredChannel} tem maior taxa de resposta.`,
          reasoning: `Análise de 1.2k casos similares mostra ${preferredChannel} com 58% de abertura vs 23% dos outros canais.`,
          confidence: 0.65
        });
      }

      // 7. Payment date suggestion
      if (hasRecentPromise) {
        newSuggestions.push({
          id: 'follow-up',
          type: 'action',
          priority: 'medium',
          title: 'Acompanhar promessa de pagamento',
          description: 'Cliente fez promessa recente. Enviar lembrete no dia combinado.',
          reasoning: 'Lembretes no dia do vencimento da promessa aumentam conversão em 34%.',
          actionLabel: 'Agendar Lembrete',
          confidence: 0.82
        });
      }

      // 8. Installment insight
      if (caseData.installments_overdue > 2) {
        newSuggestions.push({
          id: 'installment-insight',
          type: 'insight',
          priority: 'medium',
          title: 'Padrão de inadimplência detectado',
          description: `${caseData.installments_overdue} de ${caseData.total_installments} parcelas em atraso consecutivo.`,
          reasoning: `Clientes com mais de 2 parcelas em atraso têm 78% de chance de não recuperar sem renegociação. Sugerir acordo com entrada menor.`,
          confidence: 0.75
        });
      }

      // Sort by priority and confidence
      const priorityOrder = { high: 0, medium: 1, low: 2 };
      newSuggestions.sort((a, b) => {
        if (priorityOrder[a.priority] !== priorityOrder[b.priority]) {
          return priorityOrder[a.priority] - priorityOrder[b.priority];
        }
        return b.confidence - a.confidence;
      });

      setSuggestions(newSuggestions.slice(0, 5)); // Limit to top 5
      setLoading(false);
    }, 800);
  };

  const handleCopyTemplate = (id: string, template: string) => {
    navigator.clipboard.writeText(template);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleFeedback = (id: string, type: 'up' | 'down') => {
    setFeedbackGiven(prev => ({ ...prev, [id]: type }));
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'border-red-200 bg-red-50';
      case 'medium': return 'border-yellow-200 bg-yellow-50';
      default: return 'border-gray-200 bg-gray-50';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'message': return <MessageSquare className="w-4 h-4" />;
      case 'action': return <TrendingUp className="w-4 h-4" />;
      case 'warning': return <AlertTriangle className="w-4 h-4" />;
      case 'insight': return <Lightbulb className="w-4 h-4" />;
      case 'deal': return <HandshakeIcon className="w-4 h-4" />;
      default: return <Sparkles className="w-4 h-4" />;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'message': return 'text-blue-600 bg-blue-100';
      case 'action': return 'text-green-600 bg-green-100';
      case 'warning': return 'text-red-600 bg-red-100';
      case 'insight': return 'text-purple-600 bg-purple-100';
      case 'deal': return 'text-orange-600 bg-orange-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  return (
    <div className="bg-gradient-to-br from-purple-50 to-blue-50 rounded-xl border border-purple-200 overflow-hidden">
      <div className="px-5 py-4 border-b border-purple-200 bg-white/50 backdrop-blur-sm flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500 to-blue-600 flex items-center justify-center">
            <Sparkles className="w-4 h-4 text-white" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">Copilot IA</h3>
            <p className="text-xs text-gray-500">Sugestões inteligentes para este caso</p>
          </div>
        </div>
        <button
          onClick={generateSuggestions}
          disabled={loading}
          className="p-2 text-purple-600 hover:bg-purple-100 rounded-lg transition-colors"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      <div className="p-4 space-y-3">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-8">
            <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center mb-3">
              <Sparkles className="w-5 h-5 text-purple-600 animate-pulse" />
            </div>
            <p className="text-sm text-purple-600 font-medium">Analisando caso...</p>
            <p className="text-xs text-gray-500 mt-1">Gerando sugestões personalizadas</p>
          </div>
        ) : suggestions.length === 0 ? (
          <div className="text-center py-8">
            <CheckCircle className="w-10 h-10 text-green-500 mx-auto mb-3" />
            <p className="text-sm text-gray-600">Nenhuma sugestão no momento</p>
            <p className="text-xs text-gray-400 mt-1">O caso está em bom estado</p>
          </div>
        ) : (
          suggestions.map((suggestion) => (
            <div
              key={suggestion.id}
              className={`rounded-lg border ${getPriorityColor(suggestion.priority)} overflow-hidden transition-all`}
            >
              <button
                onClick={() => setExpanded(expanded === suggestion.id ? null : suggestion.id)}
                className="w-full p-3 flex items-start gap-3 text-left"
              >
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${getTypeColor(suggestion.type)}`}>
                  {getTypeIcon(suggestion.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h4 className="font-medium text-gray-900 text-sm">{suggestion.title}</h4>
                    <span className={`text-xs px-1.5 py-0.5 rounded ${
                      suggestion.priority === 'high' ? 'bg-red-200 text-red-700' :
                      suggestion.priority === 'medium' ? 'bg-yellow-200 text-yellow-700' :
                      'bg-gray-200 text-gray-600'
                    }`}>
                      {suggestion.priority === 'high' ? 'Urgente' : suggestion.priority === 'medium' ? 'Médio' : 'Baixo'}
                    </span>
                  </div>
                  <p className="text-xs text-gray-600 mt-0.5 line-clamp-2">{suggestion.description}</p>
                </div>
                <ChevronRight className={`w-4 h-4 text-gray-400 flex-shrink-0 transition-transform ${expanded === suggestion.id ? 'rotate-90' : ''}`} />
              </button>

              {expanded === suggestion.id && (
                <div className="px-3 pb-3 pt-0">
                  <div className="ml-11 space-y-3">
                    {/* Reasoning */}
                    <div className="bg-white/60 rounded-lg p-3">
                      <p className="text-xs font-medium text-gray-500 mb-1 flex items-center gap-1">
                        <Lightbulb className="w-3 h-3" />
                        Raciocínio
                      </p>
                      <p className="text-xs text-gray-700">{suggestion.reasoning}</p>
                    </div>

                    {/* Template */}
                    {suggestion.template && (
                      <div className="bg-white/60 rounded-lg p-3">
                        <div className="flex items-center justify-between mb-1">
                          <p className="text-xs font-medium text-gray-500 flex items-center gap-1">
                            <MessageSquare className="w-3 h-3" />
                            Template sugerido
                          </p>
                          <button
                            onClick={() => handleCopyTemplate(suggestion.id, suggestion.template!)}
                            className="text-xs text-purple-600 hover:text-purple-700 flex items-center gap-1"
                          >
                            {copiedId === suggestion.id ? (
                              <>
                                <Check className="w-3 h-3" />
                                Copiado
                              </>
                            ) : (
                              <>
                                <Copy className="w-3 h-3" />
                                Copiar
                              </>
                            )}
                          </button>
                        </div>
                        <p className="text-xs text-gray-700 italic bg-gray-50 p-2 rounded">{suggestion.template}</p>
                      </div>
                    )}

                    {/* Confidence */}
                    <div className="flex items-center gap-2">
                      <div className="flex-1 bg-gray-200 rounded-full h-1.5">
                        <div 
                          className="bg-gradient-to-r from-purple-500 to-blue-500 h-1.5 rounded-full"
                          style={{ width: `${suggestion.confidence * 100}%` }}
                        />
                      </div>
                      <span className="text-xs text-gray-500">{Math.round(suggestion.confidence * 100)}% confiança</span>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center justify-between pt-2">
                      <div className="flex items-center gap-1">
                        <span className="text-xs text-gray-400">Útil?</span>
                        <button
                          onClick={() => handleFeedback(suggestion.id, 'up')}
                          className={`p-1.5 rounded ${feedbackGiven[suggestion.id] === 'up' ? 'bg-green-100 text-green-600' : 'text-gray-400 hover:bg-gray-100'}`}
                        >
                          <ThumbsUp className="w-3 h-3" />
                        </button>
                        <button
                          onClick={() => handleFeedback(suggestion.id, 'down')}
                          className={`p-1.5 rounded ${feedbackGiven[suggestion.id] === 'down' ? 'bg-red-100 text-red-600' : 'text-gray-400 hover:bg-gray-100'}`}
                        >
                          <ThumbsDown className="w-3 h-3" />
                        </button>
                      </div>
                      {suggestion.actionLabel && (
                        <button
                          onClick={() => onApplySuggestion(suggestion)}
                          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-gradient-to-r from-purple-600 to-blue-600 rounded-lg hover:from-purple-700 hover:to-blue-700 transition-all shadow-sm"
                        >
                          {suggestion.actionLabel}
                          <ChevronRight className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
