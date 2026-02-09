import { useState } from 'react';
import { 
  MessageSquare, 
  Phone, 
  FileText, 
  DollarSign, 
  HandshakeIcon, 
  PauseCircle,
  PlayCircle,
  AlertTriangle,
  QrCode,
  Sparkles,
  Send
} from 'lucide-react';

interface QuickActionsProps {
  hasConsent: boolean;
  isPaused: boolean;
  onAction: (action: string, data?: any) => void;
}

export default function QuickActions({ hasConsent, isPaused, onAction }: QuickActionsProps) {
  const [showMessageModal, setShowMessageModal] = useState(false);
  const [message, setMessage] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState('');

  const templates = [
    { id: 'reminder', name: 'Lembrete de Pagamento', text: 'Olá {nome}! Identificamos uma pendência no valor de {valor}. Podemos ajudar?' },
    { id: 'deal', name: 'Proposta de Acordo', text: 'Olá {nome}! Temos uma condição especial para você regularizar sua situação.' },
    { id: 'urgent', name: 'Urgente', text: 'Atenção {nome}! Sua dívida está prestes a ser negativada. Entre em contato urgente.' },
    { id: 'thanks', name: 'Agradecimento', text: 'Obrigado {nome}! Recebemos seu pagamento. Qualquer dúvida, estamos à disposição.' }
  ];

  const handleSendMessage = () => {
    onAction('send_message', { message, template: selectedTemplate });
    setShowMessageModal(false);
    setMessage('');
    setSelectedTemplate('');
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-100 bg-gray-50">
        <h3 className="font-semibold text-gray-900">Ações Rápidas</h3>
      </div>
      
      <div className="p-4">
        {/* Warning if no consent */}
        {!hasConsent && (
          <div className="flex items-start gap-3 p-3 mb-4 bg-red-50 border border-red-200 rounded-lg">
            <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-red-800">Sem consentimento</p>
              <p className="text-xs text-red-600">O envio de mensagens está bloqueado até obter consentimento.</p>
            </div>
          </div>
        )}

        {/* Paused warning */}
        {isPaused && (
          <div className="flex items-start gap-3 p-3 mb-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <PauseCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-yellow-800">Régua pausada</p>
              <p className="text-xs text-yellow-600">As comunicações automáticas estão suspensas para este caso.</p>
            </div>
          </div>
        )}

        <div className="grid grid-cols-2 gap-3">
          {/* Send Message */}
          <button
            onClick={() => setShowMessageModal(true)}
            disabled={!hasConsent}
            className={`flex items-center gap-3 p-3 rounded-lg border transition-all ${
              hasConsent 
                ? 'border-green-200 bg-green-50 hover:bg-green-100 text-green-700' 
                : 'border-gray-200 bg-gray-50 text-gray-400 cursor-not-allowed'
            }`}
          >
            <MessageSquare className="w-5 h-5" />
            <span className="text-sm font-medium">Enviar Mensagem</span>
          </button>

          {/* Phone Call */}
          <button
            onClick={() => onAction('make_call')}
            className="flex items-center gap-3 p-3 rounded-lg border border-blue-200 bg-blue-50 hover:bg-blue-100 text-blue-700 transition-all"
          >
            <Phone className="w-5 h-5" />
            <span className="text-sm font-medium">Registrar Ligação</span>
          </button>

          {/* Generate Boleto */}
          <button
            onClick={() => onAction('generate_boleto')}
            className="flex items-center gap-3 p-3 rounded-lg border border-purple-200 bg-purple-50 hover:bg-purple-100 text-purple-700 transition-all"
          >
            <FileText className="w-5 h-5" />
            <span className="text-sm font-medium">Gerar Boleto</span>
          </button>

          {/* Generate Pix */}
          <button
            onClick={() => onAction('generate_pix')}
            className="flex items-center gap-3 p-3 rounded-lg border border-purple-200 bg-purple-50 hover:bg-purple-100 text-purple-700 transition-all"
          >
            <QrCode className="w-5 h-5" />
            <span className="text-sm font-medium">Gerar Pix</span>
          </button>

          {/* Propose Deal */}
          <button
            onClick={() => onAction('propose_deal')}
            className="flex items-center gap-3 p-3 rounded-lg border border-orange-200 bg-orange-50 hover:bg-orange-100 text-orange-700 transition-all"
          >
            <HandshakeIcon className="w-5 h-5" />
            <span className="text-sm font-medium">Propor Acordo</span>
          </button>

          {/* Register Promise */}
          <button
            onClick={() => onAction('register_promise')}
            className="flex items-center gap-3 p-3 rounded-lg border border-yellow-200 bg-yellow-50 hover:bg-yellow-100 text-yellow-700 transition-all"
          >
            <DollarSign className="w-5 h-5" />
            <span className="text-sm font-medium">Registrar Promessa</span>
          </button>

          {/* Pause/Resume Journey */}
          <button
            onClick={() => onAction(isPaused ? 'resume_journey' : 'pause_journey')}
            className={`flex items-center gap-3 p-3 rounded-lg border transition-all ${
              isPaused 
                ? 'border-green-200 bg-green-50 hover:bg-green-100 text-green-700'
                : 'border-gray-200 bg-gray-50 hover:bg-gray-100 text-gray-700'
            }`}
          >
            {isPaused ? <PlayCircle className="w-5 h-5" /> : <PauseCircle className="w-5 h-5" />}
            <span className="text-sm font-medium">{isPaused ? 'Retomar Régua' : 'Pausar Régua'}</span>
          </button>

          {/* Escalate */}
          <button
            onClick={() => onAction('escalate')}
            className="flex items-center gap-3 p-3 rounded-lg border border-red-200 bg-red-50 hover:bg-red-100 text-red-700 transition-all"
          >
            <AlertTriangle className="w-5 h-5" />
            <span className="text-sm font-medium">Escalar para Humano</span>
          </button>
        </div>

        {/* AI Copilot Section */}
        <div className="mt-4 pt-4 border-t border-gray-100">
          <div className="flex items-center gap-2 mb-3">
            <Sparkles className="w-4 h-4 text-purple-600" />
            <span className="text-sm font-medium text-gray-700">Copilot IA</span>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => onAction('ai_suggest_message')}
              className="flex items-center justify-center gap-2 p-2 text-xs rounded-lg border border-purple-200 bg-purple-50 hover:bg-purple-100 text-purple-700 transition-all"
            >
              <Sparkles className="w-3.5 h-3.5" />
              Sugerir Mensagem
            </button>
            <button
              onClick={() => onAction('ai_suggest_deal')}
              className="flex items-center justify-center gap-2 p-2 text-xs rounded-lg border border-purple-200 bg-purple-50 hover:bg-purple-100 text-purple-700 transition-all"
            >
              <Sparkles className="w-3.5 h-3.5" />
              Sugerir Acordo
            </button>
            <button
              onClick={() => onAction('ai_summarize')}
              className="flex items-center justify-center gap-2 p-2 text-xs rounded-lg border border-purple-200 bg-purple-50 hover:bg-purple-100 text-purple-700 transition-all"
            >
              <Sparkles className="w-3.5 h-3.5" />
              Resumo do Caso
            </button>
            <button
              onClick={() => onAction('ai_compliance_check')}
              className="flex items-center justify-center gap-2 p-2 text-xs rounded-lg border border-purple-200 bg-purple-50 hover:bg-purple-100 text-purple-700 transition-all"
            >
              <Sparkles className="w-3.5 h-3.5" />
              Check Compliance
            </button>
          </div>
        </div>
      </div>

      {/* Message Modal */}
      {showMessageModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl w-full max-w-lg mx-4 overflow-hidden shadow-2xl">
            <div className="px-6 py-4 border-b border-gray-100 bg-gray-50">
              <h3 className="font-semibold text-gray-900">Enviar Mensagem WhatsApp</h3>
            </div>
            <div className="p-6">
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">Template</label>
                <select
                  value={selectedTemplate}
                  onChange={(e) => {
                    setSelectedTemplate(e.target.value);
                    const template = templates.find(t => t.id === e.target.value);
                    if (template) setMessage(template.text);
                  }}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Selecione um template...</option>
                  {templates.map(t => (
                    <option key={t.id} value={t.id}>{t.name}</option>
                  ))}
                </select>
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">Mensagem</label>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 resize-none"
                  placeholder="Digite sua mensagem..."
                />
              </div>
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setShowMessageModal(false)}
                  className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleSendMessage}
                  disabled={!message.trim()}
                  className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Send className="w-4 h-4" />
                  Enviar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
