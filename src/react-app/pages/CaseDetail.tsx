import { useState } from 'react';
import { useParams, Link } from 'react-router';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { 
  ArrowLeft, 
  User, 
  FileText, 
  Phone, 
  Mail,
  Calendar,
  AlertTriangle,
  CheckCircle,
  Shield,
  MessageSquare,
  Loader2,
  Plus
} from 'lucide-react';
import QuickActions from '@/react-app/components/QuickActions';
import CopilotSuggestions from '@/react-app/components/CopilotSuggestions';
import PaymentModal from '@/react-app/components/PaymentModal';
import WhatsAppModal from '@/react-app/components/WhatsAppModal';
import { useCaseDetail, caseStatusLabels, caseStatusColors } from '@/react-app/hooks/useCases';
import { toast } from 'react-hot-toast'; // Opcional: Se tiver instalado

export default function CaseDetailPage() {
  const { id } = useParams<{ id: string }>();
  // IMPORTANTE: Verifique se no arquivo useCases.ts o fetch está assim: fetch(`/api/cases/${id}`)
  const { caseData, loading, error, addTimelineEvent, updateStatus } = useCaseDetail(id);
  
  const [activeTab, setActiveTab] = useState<'timeline' | 'installments' | 'notes'>('timeline');
  const [addingNote, setAddingNote] = useState(false);
  const [newNote, setNewNote] = useState('');
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showWhatsAppModal, setShowWhatsAppModal] = useState(false);
  
  const handleAction = async (action: string, data?: any) => {
    if (!caseData) return;
    
    switch (action) {
      case 'whatsapp':
        setShowWhatsAppModal(true);
        return; 
      case 'open_whatsapp':
        setShowWhatsAppModal(true);
        return;
      case 'sms':
        await addTimelineEvent({ event_type: 'contact', title: 'SMS Enviado', description: 'SMS enviado para o cliente', channel: 'sms' });
        alert('SMS enviado!');
        break;
      case 'email':
        await addTimelineEvent({ event_type: 'contact', title: 'E-mail Enviado', description: 'E-mail de cobrança enviado', channel: 'email' });
        alert('E-mail enviado!');
        break;
      case 'make_call':
        await addTimelineEvent({ event_type: 'contact', title: 'Ligação Registrada', description: 'Tentativa de contato telefônico', channel: 'phone' });
        alert('Ligação registrada!');
        break;
      case 'generate_pix':
      case 'generate_boleto':
        setShowPaymentModal(true);
        return; 
      case 'propose_deal':
        await addTimelineEvent({ event_type: 'action', title: 'Proposta de Acordo', description: 'Proposta de acordo enviada ao cliente' });
        alert('Proposta de acordo enviada!');
        break;
      case 'register_promise':
        await addTimelineEvent({ event_type: 'action', title: 'Promessa de Pagamento', description: 'Cliente prometeu realizar pagamento' });
        await updateStatus('promised');
        alert('Promessa de pagamento registrada!');
        break;
      case 'pause_journey':
        await updateStatus('paused');
        await addTimelineEvent({ event_type: 'status', title: 'Régua Pausada', description: 'Comunicações automáticas suspensas' });
        alert('Régua pausada!');
        break;
      case 'resume_journey':
        await updateStatus('contacted');
        await addTimelineEvent({ event_type: 'status', title: 'Régua Retomada', description: 'Comunicações automáticas reativadas' });
        alert('Régua retomada!');
        break;
      case 'escalate':
        await addTimelineEvent({ event_type: 'status', title: 'Escalado para Supervisor', description: 'Caso escalado para revisão humana' });
        alert('Caso escalado para supervisor!');
        break;
      default:
        await addTimelineEvent({ event_type: 'action', title: action, description: data?.description });
        alert(`Ação "${action}" registrada!`);
    }
  };

  const handleCopilotSuggestion = async (suggestion: any) => {
    if (!caseData) return;
    
    switch (suggestion.type) {
      case 'message':
        if (suggestion.template) {
          await addTimelineEvent({ 
            event_type: 'contact', 
            title: 'Mensagem IA Enviada', 
            description: suggestion.template,
            channel: 'whatsapp' 
          });
        }
        break;
      case 'deal':
        await addTimelineEvent({ 
          event_type: 'action', 
          title: 'Proposta de Acordo (Sugestão IA)', 
          description: suggestion.description 
        });
        break;
      case 'warning':
        if (suggestion.id === 'risk-warning') {
          await addTimelineEvent({ 
            event_type: 'status', 
            title: 'Escalado para Supervisor', 
            description: suggestion.reasoning 
          });
        }
        break;
      case 'action':
        await addTimelineEvent({ 
          event_type: 'action', 
          title: suggestion.title, 
          description: suggestion.description 
        });
        break;
    }
    alert(`Sugestão "${suggestion.title}" aplicada com sucesso!`);
  };

  const handleAddNote = async () => {
    if (!newNote.trim()) return;
    await addTimelineEvent({ event_type: 'note', title: 'Anotação', description: newNote });
    setNewNote('');
    setAddingNote(false);
  };

  const getRiskColor = (score: number) => {
    if (score >= 80) return 'text-red-600 bg-red-50 border-red-200';
    if (score >= 60) return 'text-orange-600 bg-orange-50 border-orange-200';
    if (score >= 40) return 'text-yellow-600 bg-yellow-50 border-yellow-200';
    return 'text-green-600 bg-green-50 border-green-200';
  };

  const getInstallmentStatusStyle = (status: string) => {
    switch (status) {
      case 'paid': return 'bg-green-100 text-green-800';
      case 'overdue': return 'bg-red-100 text-red-800';
      case 'partial': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getTimelineIcon = (eventType: string) => {
    switch (eventType) {
      case 'contact': return <MessageSquare className="w-4 h-4" />;
      case 'action': return <FileText className="w-4 h-4" />;
      case 'status': return <AlertTriangle className="w-4 h-4" />;
      case 'note': return <FileText className="w-4 h-4" />;
      case 'payment': return <CheckCircle className="w-4 h-4" />; // Ícone novo para pagamento
      default: return <Calendar className="w-4 h-4" />;
    }
  };

  const getTimelineColor = (eventType: string) => {
    switch (eventType) {
      case 'contact': return 'bg-blue-100 text-blue-600';
      case 'action': return 'bg-purple-100 text-purple-600';
      case 'status': return 'bg-yellow-100 text-yellow-600';
      case 'note': return 'bg-gray-100 text-gray-600';
      case 'payment': return 'bg-emerald-100 text-emerald-600'; // Cor nova para pagamento
      default: return 'bg-gray-100 text-gray-600';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (error || !caseData) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <AlertTriangle className="w-12 h-12 text-red-500 mb-4" />
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Caso não encontrado</h2>
        <p className="text-gray-500 mb-4">{error || 'O caso solicitado não existe.'}</p>
        <Link to="/cases" className="text-blue-600 hover:text-blue-700">
          ← Voltar para a lista
        </Link>
      </div>
    );
  }

  const hasConsent = caseData.has_consent === 1;
  const notes = caseData.timeline.filter(e => e.event_type === 'note');

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link 
                to="/cases" 
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ArrowLeft className="w-5 h-5 text-gray-600" />
              </Link>
              <div>
                <div className="flex items-center gap-3">
                  <h1 className="text-xl font-bold text-gray-900">{caseData.customer_name}</h1>
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${caseStatusColors[caseData.status as keyof typeof caseStatusColors]}`}>
                    {caseStatusLabels[caseData.status as keyof typeof caseStatusLabels]}
                  </span>
                  {hasConsent ? (
                    <span className="flex items-center gap-1 text-xs text-green-600 bg-green-50 px-2 py-1 rounded-full">
                      <Shield className="w-3 h-3" />
                      Consentimento Ativo
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 text-xs text-red-600 bg-red-50 px-2 py-1 rounded-full">
                      <AlertTriangle className="w-3 h-3" />
                      Sem Consentimento
                    </span>
                  )}
                </div>
                <p className="text-sm text-gray-500 mt-0.5">
                  Caso {caseData.case_number} • {caseData.contract_type || 'Não especificado'} • D+{caseData.days_overdue}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className={`px-4 py-2 rounded-lg border ${getRiskColor(caseData.risk_score)}`}>
                <p className="text-xs font-medium opacity-75">Score de Risco</p>
                <p className="text-lg font-bold">{caseData.risk_score}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Info Cards */}
          <div className="lg:col-span-2 space-y-6">
            {/* Customer & Contract Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Customer Info */}
              <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                <div className="px-5 py-4 border-b border-gray-100 bg-gray-50 flex items-center gap-2">
                  <User className="w-4 h-4 text-gray-600" />
                  <h3 className="font-semibold text-gray-900">Dados do Cliente</h3>
                </div>
                <div className="p-5 space-y-3">
                  <div>
                    <p className="text-xs text-gray-500">Nome Completo</p>
                    <p className="font-medium text-gray-900">{caseData.customer_name}</p>
                  </div>
                  {caseData.customer_document && (
                    <div>
                      <p className="text-xs text-gray-500">CPF/CNPJ</p>
                      <p className="font-medium text-gray-900 font-mono">{caseData.customer_document}</p>
                    </div>
                  )}
                  {caseData.customer_phone && (
                    <div className="flex items-center gap-2">
                      <Phone className="w-4 h-4 text-gray-400" />
                      <p className="text-sm text-gray-700">{caseData.customer_phone}</p>
                    </div>
                  )}
                  {caseData.customer_email && (
                    <div className="flex items-center gap-2">
                      <Mail className="w-4 h-4 text-gray-400" />
                      <p className="text-sm text-gray-700">{caseData.customer_email}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Contract Info */}
              <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                <div className="px-5 py-4 border-b border-gray-100 bg-gray-50 flex items-center gap-2">
                  <FileText className="w-4 h-4 text-gray-600" />
                  <h3 className="font-semibold text-gray-900">Dados do Contrato</h3>
                </div>
                <div className="p-5 space-y-3">
                  {caseData.contract_id && (
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="text-xs text-gray-500">Contrato</p>
                        <p className="font-medium text-gray-900 font-mono">{caseData.contract_id}</p>
                      </div>
                      {caseData.contract_type && (
                        <span className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded">
                          {caseData.contract_type}
                        </span>
                      )}
                    </div>
                  )}
                  <div>
                    <p className="text-xs text-gray-500">Dívida Atual</p>
                    <p className="font-bold text-red-600 text-lg">
                      R$ {caseData.total_debt.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Dias em Atraso</p>
                    <p className="font-medium text-gray-900">{caseData.days_overdue} dias</p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-3 mt-2">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs text-gray-500">Parcelas</span>
                      <span className="text-sm font-medium">
                        {caseData.total_installments - caseData.installments_overdue}/{caseData.total_installments} pagas
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-green-500 h-2 rounded-full" 
                        style={{ width: `${((caseData.total_installments - caseData.installments_overdue) / caseData.total_installments) * 100}%` }}
                      />
                    </div>
                    <p className="text-xs text-red-600 mt-1">
                      {caseData.installments_overdue} parcela(s) em atraso
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Tabs */}
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <div className="flex border-b border-gray-200">
                <button
                  onClick={() => setActiveTab('timeline')}
                  className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
                    activeTab === 'timeline' 
                      ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50/50' 
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Timeline ({caseData.timeline.length})
                </button>
                <button
                  onClick={() => setActiveTab('installments')}
                  className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
                    activeTab === 'installments' 
                      ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50/50' 
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Parcelas ({caseData.installments.length})
                </button>
                <button
                  onClick={() => setActiveTab('notes')}
                  className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
                    activeTab === 'notes' 
                      ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50/50' 
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Notas ({notes.length})
                </button>
              </div>

              {activeTab === 'timeline' && (
                <div className="p-4">
                  {caseData.timeline.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      Nenhum evento registrado ainda
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {caseData.timeline.map((event) => (
                        <div key={event.id} className="flex gap-4">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${getTimelineColor(event.event_type)}`}>
                            {getTimelineIcon(event.event_type)}
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <p className="font-medium text-gray-900">{event.title}</p>
                              {event.channel && (
                                <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded">
                                  {event.channel}
                                </span>
                              )}
                            </div>
                            {event.description && (
                              <p className="text-sm text-gray-600 mt-0.5">{event.description}</p>
                            )}
                            <div className="flex items-center gap-3 mt-1">
                              <span className="text-xs text-gray-400">
                                {format(new Date(event.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                              </span>
                              {event.user_name && (
                                <span className="text-xs text-gray-500">por {event.user_name}</span>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'installments' && (
                <div className="p-4">
                  {caseData.installments.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      Nenhuma parcela cadastrada
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="text-left text-xs text-gray-500 border-b border-gray-100">
                            <th className="pb-3 font-medium">#</th>
                            <th className="pb-3 font-medium">Vencimento</th>
                            <th className="pb-3 font-medium">Valor</th>
                            <th className="pb-3 font-medium">Pago</th>
                            <th className="pb-3 font-medium">Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          {caseData.installments.map((installment) => (
                            <tr key={installment.id} className="border-b border-gray-50 last:border-0">
                              <td className="py-3 font-medium text-gray-900">{installment.installment_number}</td>
                              <td className="py-3 text-gray-600">
                                {format(new Date(installment.due_date), 'dd/MM/yyyy')}
                              </td>
                              <td className="py-3 font-medium text-gray-900">
                                R$ {installment.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                              </td>
                              <td className="py-3 text-gray-600">
                                R$ {installment.paid_amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                              </td>
                              <td className="py-3">
                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getInstallmentStatusStyle(installment.status)}`}>
                                  {installment.status === 'paid' ? 'Pago' : 
                                   installment.status === 'overdue' ? 'Em Atraso' : 'Pendente'}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'notes' && (
                <div className="p-4">
                  <div className="space-y-3">
                    {notes.map((note) => (
                      <div key={note.id} className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                        <p className="text-sm text-gray-700">{note.description}</p>
                        <p className="text-xs text-gray-400 mt-2">
                          {format(new Date(note.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                          {note.user_name && ` - ${note.user_name}`}
                        </p>
                      </div>
                    ))}
                    {addingNote ? (
                      <div className="space-y-2">
                        <textarea
                          value={newNote}
                          onChange={(e) => setNewNote(e.target.value)}
                          placeholder="Digite sua nota..."
                          className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 resize-none"
                          rows={3}
                          autoFocus
                        />
                        <div className="flex justify-end gap-2">
                          <button 
                            onClick={() => { setAddingNote(false); setNewNote(''); }}
                            className="px-3 py-1.5 text-gray-600 hover:bg-gray-100 rounded-lg text-sm"
                          >
                            Cancelar
                          </button>
                          <button 
                            onClick={handleAddNote}
                            className="px-3 py-1.5 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700"
                          >
                            Salvar
                          </button>
                        </div>
                      </div>
                    ) : (
                      <button 
                        onClick={() => setAddingNote(true)}
                        className="w-full p-3 border-2 border-dashed border-gray-200 rounded-lg text-gray-500 hover:border-blue-300 hover:text-blue-600 transition-colors flex items-center justify-center gap-2"
                      >
                        <Plus className="w-4 h-4" />
                        Adicionar Nota
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Right Column - Actions */}
          <div className="space-y-6">
            {/* Copilot Suggestions */}
            <CopilotSuggestions 
              caseData={caseData}
              onApplySuggestion={handleCopilotSuggestion}
            />

            <QuickActions 
              hasConsent={hasConsent}
              isPaused={caseData.status === 'paused'}
              onAction={handleAction}
            />

            {/* Consent Info */}
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <div className="px-5 py-4 border-b border-gray-100 bg-gray-50 flex items-center gap-2">
                <Shield className="w-4 h-4 text-gray-600" />
                <h3 className="font-semibold text-gray-900">Consentimento (LGPD)</h3>
              </div>
              <div className="p-5">
                {hasConsent ? (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-green-600">
                      <CheckCircle className="w-5 h-5" />
                      <span className="font-medium">Consentimento Ativo</span>
                    </div>
                    <p className="text-sm text-gray-500">
                      Cliente autorizou contato para cobrança
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-red-600">
                      <AlertTriangle className="w-5 h-5" />
                      <span className="font-medium">Sem Consentimento</span>
                    </div>
                    <p className="text-sm text-gray-500">
                      Cliente não autorizou contato
                    </p>
                    <button className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium">
                      Solicitar Consentimento
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Operator Info */}
            {caseData.assigned_operator_name && (
              <div className="bg-white rounded-xl border border-gray-200 p-5">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white font-semibold">
                    {caseData.assigned_operator_name.split(' ').map(n => n[0]).join('').substring(0, 2)}
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Operador Responsável</p>
                    <p className="font-medium text-gray-900">{caseData.assigned_operator_name}</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Payment Modal - CORRIGIDO: SEM RELOAD */}
      <PaymentModal
        isOpen={showPaymentModal}
        onClose={() => setShowPaymentModal(false)}
        caseId={caseData.id}
        customerName={caseData.customer_name}
        totalDebt={caseData.total_debt}
        onPaymentCreated={async (payment) => {
          setShowPaymentModal(false);
          // Adiciona evento na timeline visualmente para feedback imediato
          await addTimelineEvent({
             event_type: 'payment',
             title: 'Pagamento Gerado',
             description: `Novo pagamento de R$ ${payment.amount} (${payment.payment_type})`,
             channel: 'system'
          });
          // Se tiver sistema de toast/alerta:
          // toast.success("Pagamento gerado com sucesso!");
        }}
      />

      {/* WhatsApp Modal - CORRIGIDO: SEM RELOAD */}
      <WhatsAppModal
        isOpen={showWhatsAppModal}
        onClose={() => setShowWhatsAppModal(false)}
        caseId={caseData.id}
        customerName={caseData.customer_name}
        customerPhone={caseData.customer_phone}
        totalDebt={caseData.total_debt}
        daysOverdue={caseData.days_overdue}
        onMessageSent={async () => {
          setShowWhatsAppModal(false);
          // Adiciona evento na timeline
          await addTimelineEvent({
            event_type: 'contact',
            title: 'WhatsApp Enviado',
            description: 'Mensagem enviada via modal',
            channel: 'whatsapp'
          });
        }}
      />
    </div>
  );
}