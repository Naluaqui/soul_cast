import { useState, useEffect } from 'react';
import { X, Send, MessageSquare, Clock, CheckCheck, Check, AlertCircle, RefreshCw, ChevronDown, User } from 'lucide-react';
import { format } from 'date-fns';

interface WhatsAppTemplate {
  id: number;
  name: string;
  category: string;
  content: string;
  variables: string | null;
  status: string;
}

interface WhatsAppMessage {
  id: number;
  case_id: number;
  direction: 'inbound' | 'outbound';
  phone_number: string;
  message_type: string;
  template_name: string | null;
  content: string;
  status: string;
  whatsapp_message_id: string;
  sent_at: string | null;
  delivered_at: string | null;
  read_at: string | null;
  created_at: string;
}

interface WhatsAppModalProps {
  isOpen: boolean;
  onClose: () => void;
  caseId: number;
  customerName: string;
  customerPhone: string | null;
  totalDebt: number;
  daysOverdue: number;
  onMessageSent?: () => void;
}

export default function WhatsAppModal({
  isOpen,
  onClose,
  caseId,
  customerName,
  customerPhone,
  totalDebt,
  daysOverdue,
  onMessageSent
}: WhatsAppModalProps) {
  const [activeTab, setActiveTab] = useState<'send' | 'history'>('send');
  const [templates, setTemplates] = useState<WhatsAppTemplate[]>([]);
  const [messages, setMessages] = useState<WhatsAppMessage[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<WhatsAppTemplate | null>(null);
  const [customMessage, setCustomMessage] = useState('');
  const [useTemplate, setUseTemplate] = useState(true);
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      fetchTemplates();
      fetchMessages();
    }
  }, [isOpen, caseId]);

  const fetchTemplates = async () => {
    try {
      const res = await fetch('/api/whatsapp/templates', { credentials: 'include' });
      if (res.ok) {
        const data = await res.json();
        setTemplates(data);
        if (data.length > 0 && !selectedTemplate) {
          setSelectedTemplate(data[0]);
        }
      }
    } catch (err) {
      console.error('Error fetching templates:', err);
    }
  };

  const fetchMessages = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/cases/${caseId}/whatsapp`, { credentials: 'include' });
      if (res.ok) {
        const data = await res.json();
        setMessages(data);
      }
    } catch (err) {
      console.error('Error fetching messages:', err);
    } finally {
      setLoading(false);
    }
  };

  const getPreviewMessage = () => {
    if (!useTemplate || !selectedTemplate) return customMessage;
    
    let message = selectedTemplate.content;
    const firstName = customerName.split(' ')[0];
    
    // Replace common variables
    message = message.replace('{{1}}', firstName);
    message = message.replace('{{2}}', totalDebt.toLocaleString('pt-BR', { minimumFractionDigits: 2 }));
    message = message.replace('{{3}}', daysOverdue.toString());
    
    // Calculate discount offer (example: 15%)
    const discountRate = 15;
    const discountedAmount = totalDebt * (1 - discountRate / 100);
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + 7);
    
    message = message.replace('{{4}}', discountedAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 }));
    message = message.replace('{{5}}', format(dueDate, 'dd/MM/yyyy'));
    
    return message;
  };

  const handleSend = async () => {
    if (!customerPhone) {
      setError('Cliente não possui telefone cadastrado');
      return;
    }

    const messageContent = useTemplate ? getPreviewMessage() : customMessage;
    if (!messageContent.trim()) {
      setError('Digite uma mensagem para enviar');
      return;
    }

    setSending(true);
    setError(null);
    setSuccess(null);

    try {
      const res = await fetch('/api/whatsapp/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          case_id: caseId,
          phone_number: customerPhone,
          message_type: 'text',
          template_name: useTemplate && selectedTemplate ? selectedTemplate.name : null,
          content: messageContent,
          variables: useTemplate && selectedTemplate ? [
            customerName.split(' ')[0],
            totalDebt.toLocaleString('pt-BR', { minimumFractionDigits: 2 }),
            daysOverdue.toString()
          ] : null
        })
      });

      if (res.ok) {
        setSuccess('Mensagem enviada com sucesso!');
        setCustomMessage('');
        fetchMessages();
        onMessageSent?.();
        setTimeout(() => {
          setSuccess(null);
        }, 3000);
      } else {
        const data = await res.json();
        setError(data.error || 'Erro ao enviar mensagem');
      }
    } catch (err) {
      setError('Erro de conexão');
    } finally {
      setSending(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'sent':
        return <Check className="w-3 h-3 text-gray-400" />;
      case 'delivered':
        return <CheckCheck className="w-3 h-3 text-gray-400" />;
      case 'read':
        return <CheckCheck className="w-3 h-3 text-blue-500" />;
      case 'failed':
        return <AlertCircle className="w-3 h-3 text-red-500" />;
      default:
        return <Clock className="w-3 h-3 text-gray-400" />;
    }
  };

  const getCategoryLabel = (category: string) => {
    const labels: Record<string, string> = {
      UTILITY: 'Utilidade',
      MARKETING: 'Marketing',
      AUTHENTICATION: 'Autenticação'
    };
    return labels[category] || category;
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'UTILITY':
        return 'bg-blue-100 text-blue-700';
      case 'MARKETING':
        return 'bg-purple-100 text-purple-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="bg-gradient-to-r from-green-500 to-green-600 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
              <MessageSquare className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">WhatsApp</h2>
              <p className="text-sm text-white/80">{customerName}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-white/80 hover:text-white transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-200">
          <button
            onClick={() => setActiveTab('send')}
            className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
              activeTab === 'send'
                ? 'text-green-600 border-b-2 border-green-600 bg-green-50/50'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Enviar Mensagem
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
              activeTab === 'history'
                ? 'text-green-600 border-b-2 border-green-600 bg-green-50/50'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Histórico ({messages.length})
          </button>
        </div>

        {/* Content */}
        <div className="p-6 max-h-[60vh] overflow-y-auto">
          {activeTab === 'send' ? (
            <div className="space-y-5">
              {/* Phone Number */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Telefone do Cliente
                </label>
                <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg border border-gray-200">
                  <MessageSquare className="w-4 h-4 text-green-500" />
                  <span className="font-mono text-gray-900">
                    {customerPhone || 'Não cadastrado'}
                  </span>
                  {!customerPhone && (
                    <span className="text-xs text-red-500 ml-auto">Cadastre um telefone</span>
                  )}
                </div>
              </div>

              {/* Message Type Toggle */}
              <div className="flex gap-2">
                <button
                  onClick={() => setUseTemplate(true)}
                  className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-colors ${
                    useTemplate
                      ? 'bg-green-100 text-green-700 border-2 border-green-500'
                      : 'bg-gray-100 text-gray-600 border-2 border-transparent hover:bg-gray-200'
                  }`}
                >
                  Usar Template
                </button>
                <button
                  onClick={() => setUseTemplate(false)}
                  className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-colors ${
                    !useTemplate
                      ? 'bg-green-100 text-green-700 border-2 border-green-500'
                      : 'bg-gray-100 text-gray-600 border-2 border-transparent hover:bg-gray-200'
                  }`}
                >
                  Mensagem Livre
                </button>
              </div>

              {useTemplate ? (
                <>
                  {/* Template Selection */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Template de Mensagem
                    </label>
                    <div className="relative">
                      <select
                        value={selectedTemplate?.id || ''}
                        onChange={(e) => {
                          const t = templates.find(t => t.id === parseInt(e.target.value));
                          setSelectedTemplate(t || null);
                        }}
                        className="w-full p-3 pr-10 border border-gray-200 rounded-lg appearance-none bg-white focus:ring-2 focus:ring-green-500 focus:border-green-500"
                      >
                        {templates.map((template) => (
                          <option key={template.id} value={template.id}>
                            {template.name.replace(/_/g, ' ')} ({getCategoryLabel(template.category)})
                          </option>
                        ))}
                      </select>
                      <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
                    </div>
                    {selectedTemplate && (
                      <span className={`inline-block mt-2 px-2 py-1 text-xs rounded ${getCategoryColor(selectedTemplate.category)}`}>
                        {getCategoryLabel(selectedTemplate.category)}
                      </span>
                    )}
                  </div>

                  {/* Preview */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Preview da Mensagem
                    </label>
                    <div className="bg-[#e5ddd5] rounded-lg p-4">
                      <div className="bg-[#dcf8c6] rounded-lg p-3 max-w-[85%] ml-auto shadow-sm">
                        <p className="text-sm text-gray-800 whitespace-pre-wrap">{getPreviewMessage()}</p>
                        <div className="flex items-center justify-end gap-1 mt-1">
                          <span className="text-xs text-gray-500">
                            {format(new Date(), 'HH:mm')}
                          </span>
                          <CheckCheck className="w-3 h-3 text-blue-500" />
                        </div>
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Mensagem
                  </label>
                  <textarea
                    value={customMessage}
                    onChange={(e) => setCustomMessage(e.target.value)}
                    placeholder="Digite sua mensagem aqui..."
                    rows={5}
                    className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 resize-none"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    {customMessage.length}/1000 caracteres
                  </p>
                </div>
              )}

              {/* Alerts */}
              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-red-700">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <p className="text-sm">{error}</p>
                </div>
              )}
              {success && (
                <div className="p-3 bg-green-50 border border-green-200 rounded-lg flex items-center gap-2 text-green-700">
                  <CheckCheck className="w-4 h-4 flex-shrink-0" />
                  <p className="text-sm">{success}</p>
                </div>
              )}

              {/* Demo Notice */}
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
                <p className="text-xs text-amber-700">
                  <strong>Modo Demo:</strong> As mensagens são simuladas e não são enviadas para o WhatsApp real.
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {/* Refresh Button */}
              <div className="flex justify-end">
                <button
                  onClick={fetchMessages}
                  disabled={loading}
                  className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900"
                >
                  <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                  Atualizar
                </button>
              </div>

              {/* Messages */}
              {messages.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <MessageSquare className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                  <p>Nenhuma mensagem WhatsApp ainda</p>
                </div>
              ) : (
                <div className="bg-[#e5ddd5] rounded-lg p-4 space-y-3">
                  {messages.map((msg) => (
                    <div
                      key={msg.id}
                      className={`flex ${msg.direction === 'outbound' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-[85%] rounded-lg p-3 shadow-sm ${
                          msg.direction === 'outbound'
                            ? 'bg-[#dcf8c6]'
                            : 'bg-white'
                        }`}
                      >
                        {msg.direction === 'inbound' && (
                          <div className="flex items-center gap-1 mb-1">
                            <User className="w-3 h-3 text-gray-500" />
                            <span className="text-xs font-medium text-gray-600">Cliente</span>
                          </div>
                        )}
                        <p className="text-sm text-gray-800 whitespace-pre-wrap">{msg.content}</p>
                        <div className="flex items-center justify-end gap-1 mt-1">
                          <span className="text-xs text-gray-500">
                            {format(new Date(msg.created_at), 'dd/MM HH:mm')}
                          </span>
                          {msg.direction === 'outbound' && getStatusIcon(msg.status)}
                        </div>
                        {msg.template_name && (
                          <span className="text-xs text-gray-400 block mt-1">
                            Template: {msg.template_name.replace(/_/g, ' ')}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 hover:bg-gray-200 rounded-lg transition-colors"
          >
            Fechar
          </button>
          {activeTab === 'send' && (
            <button
              onClick={handleSend}
              disabled={sending || !customerPhone}
              className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {sending ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  Enviando...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  Enviar WhatsApp
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
