import { useState, useRef, useEffect } from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { 
  Send, 
  Sparkles, 
  FileText, 
  User, 
  Bot,
  MessageSquare,
  HandshakeIcon,
  ClipboardCheck,
  FileSearch
} from 'lucide-react';
import { ChatMessage, DocumentSource, mockChatHistory } from '@/data/knowledgeBase';

export default function AIChat() {
  const [messages, setMessages] = useState<ChatMessage[]>(mockChatHistory);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const quickActions = [
    { icon: MessageSquare, label: 'Sugerir Mensagem', prompt: 'Sugira uma mensagem para o cliente' },
    { icon: HandshakeIcon, label: 'Propor Acordo', prompt: 'Qual a melhor proposta de acordo para este caso?' },
    { icon: FileSearch, label: 'Resumo do Caso', prompt: 'Faça um resumo completo deste caso' },
    { icon: ClipboardCheck, label: 'Check Compliance', prompt: 'Verifique se este caso está em conformidade com LGPD e políticas' }
  ];

  const simulateAIResponse = (userMessage: string): ChatMessage => {
    // Simulated AI responses based on keywords
    let content = '';
    let sources: DocumentSource[] = [];

    if (userMessage.toLowerCase().includes('mensagem') || userMessage.toLowerCase().includes('sugerir')) {
      content = `Com base no histórico do caso e nas políticas da empresa, sugiro a seguinte mensagem:

**Mensagem Sugerida:**
"Olá Maria! Aqui é da Soul Collect. Vimos que você demonstrou interesse em regularizar sua situação. Temos uma condição especial: parcelamento das parcelas em atraso em até 3x sem juros adicionais. Posso enviar os detalhes?"

**Por que esta abordagem:**
- Cliente já demonstrou interesse em negociar
- Primeira inadimplência = tom mais suave
- Oferta concreta gera mais conversão`;
      sources = [
        { documentId: 'DOC-002', documentTitle: 'Scripts de Negociação', excerpt: 'Após resposta positiva, oferecer opções claras...', relevance: 0.95 },
        { documentId: 'DOC-001', documentTitle: 'Política de Cobrança', excerpt: 'Toda comunicação deve ser respeitosa...', relevance: 0.87 }
      ];
    } else if (userMessage.toLowerCase().includes('acordo') || userMessage.toLowerCase().includes('proposta')) {
      content = `**Análise do Caso:**
- Dívida atual: R$ 2.030,00 (2 parcelas)
- Dias em atraso: 15
- Perfil: Bom pagador histórico, primeira inadimplência

**Proposta Recomendada:**
1. **Opção à Vista:** R$ 1.826,00 (10% desconto)
2. **Parcelamento:** 3x R$ 720,00 (sem juros adicionais)
3. **Parcelamento Estendido:** 6x R$ 355,00 (5% juros)

**Justificativa:**
Baseado na tabela de descontos, o cliente se qualifica para desconto de 10% (D+8-30) + 3% adicional (primeira inadimplência). Recomendo a opção 2 por equilibrar desconto e prazo.`;
      sources = [
        { documentId: 'DOC-004', documentTitle: 'Tabela de Descontos', excerpt: 'D+8-30: 10% desconto, até 6x...', relevance: 0.98 },
        { documentId: 'DOC-002', documentTitle: 'Scripts de Negociação', excerpt: 'Bom pagador histórico: +3% desconto...', relevance: 0.82 }
      ];
    } else if (userMessage.toLowerCase().includes('resumo')) {
      content = `**Resumo do Caso CASE-001**

📋 **Cliente:** Maria Silva Santos
💳 **Contrato:** Empréstimo Pessoal - CTR-2024-001
💰 **Dívida:** R$ 2.030,00 (2 parcelas em atraso)
📅 **Dias em atraso:** 15 dias

**Histórico de Contato:**
- 4 mensagens WhatsApp enviadas (3 lidas)
- 2 tentativas de ligação (1 atendida)
- Cliente demonstrou interesse em acordo

**Perfil:**
- ✅ Bom pagador histórico (8/10 parcelas pagas em dia)
- ✅ Primeira inadimplência
- ✅ Consentimento ativo
- ⚠️ Relatou dificuldades financeiras temporárias

**Recomendação:** Seguir com proposta de parcelamento. Cliente receptiva.`;
      sources = [
        { documentId: 'DOC-001', documentTitle: 'Política de Cobrança', excerpt: 'Classificação de perfil...', relevance: 0.75 }
      ];
    } else if (userMessage.toLowerCase().includes('compliance') || userMessage.toLowerCase().includes('lgpd')) {
      content = `**Checklist de Compliance - Caso CASE-001**

✅ **Consentimento:** Ativo desde 15/06/2024
✅ **Horário de contato:** Todas mensagens entre 8h-20h
✅ **Frequência:** Dentro do limite (1 contato/dia para D+15)
✅ **Tom das mensagens:** Respeitoso, sem ameaças
✅ **Opções oferecidas:** Sim, alternativas de pagamento
✅ **Opt-out disponível:** Sim, em todas as mensagens

⚠️ **Atenções:**
- Próxima mensagem automática em 2 dias
- Limite de 3 tentativas de ligação/semana atingido em 80%

**Status Geral:** ✅ Em conformidade`;
      sources = [
        { documentId: 'DOC-003', documentTitle: 'LGPD - Guia de Consentimento', excerpt: 'Requisitos de consentimento válido...', relevance: 0.96 },
        { documentId: 'DOC-001', documentTitle: 'Política de Cobrança', excerpt: 'Frequência máxima de contato...', relevance: 0.89 }
      ];
    } else {
      content = `Entendi sua pergunta. Com base na documentação disponível, posso ajudar com:

1. **Sugestões de mensagem** - textos personalizados para o cliente
2. **Propostas de acordo** - cálculo de descontos e parcelamentos
3. **Resumo do caso** - visão geral do histórico e perfil
4. **Verificação de compliance** - checklist LGPD e políticas

Sobre o que você gostaria de saber mais?`;
      sources = [];
    }

    return {
      id: `MSG-${Date.now()}`,
      role: 'assistant',
      content,
      timestamp: new Date(),
      sources
    };
  };

  const handleSend = () => {
    if (!input.trim()) return;

    const userMessage: ChatMessage = {
      id: `MSG-${Date.now()}`,
      role: 'user',
      content: input,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsTyping(true);

    // Simulate AI response delay
    setTimeout(() => {
      const aiResponse = simulateAIResponse(input);
      setMessages(prev => [...prev, aiResponse]);
      setIsTyping(false);
    }, 1500);
  };

  const handleQuickAction = (prompt: string) => {
    setInput(prompt);
    setTimeout(() => handleSend(), 100);
  };

  return (
    <div className="flex flex-col h-full bg-white rounded-xl border border-gray-200 overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-100 bg-gradient-to-r from-purple-50 to-blue-50">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">Copilot Soul Collect</h3>
            <p className="text-xs text-gray-500">Assistente IA com RAG para cobrança</p>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="px-4 py-3 border-b border-gray-100 bg-gray-50">
        <div className="flex gap-2 overflow-x-auto pb-1">
          {quickActions.map((action, index) => (
            <button
              key={index}
              onClick={() => handleQuickAction(action.prompt)}
              className="flex items-center gap-2 px-3 py-2 bg-white border border-gray-200 rounded-lg hover:border-purple-300 hover:bg-purple-50 transition-all text-sm whitespace-nowrap"
            >
              <action.icon className="w-4 h-4 text-purple-600" />
              <span className="text-gray-700">{action.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex gap-3 ${message.role === 'user' ? 'flex-row-reverse' : ''}`}
          >
            <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
              message.role === 'user' 
                ? 'bg-blue-100' 
                : message.role === 'assistant' 
                ? 'bg-gradient-to-br from-purple-500 to-blue-500' 
                : 'bg-gray-100'
            }`}>
              {message.role === 'user' ? (
                <User className="w-4 h-4 text-blue-600" />
              ) : (
                <Bot className="w-4 h-4 text-white" />
              )}
            </div>
            <div className={`flex-1 max-w-[80%] ${message.role === 'user' ? 'text-right' : ''}`}>
              <div className={`inline-block px-4 py-3 rounded-2xl ${
                message.role === 'user'
                  ? 'bg-blue-600 text-white rounded-br-md'
                  : 'bg-gray-100 text-gray-800 rounded-bl-md'
              }`}>
                <div className={`text-sm whitespace-pre-wrap ${message.role === 'user' ? '' : 'prose prose-sm max-w-none'}`}>
                  {message.content.split('\n').map((line, i) => {
                    if (line.startsWith('**') && line.endsWith('**')) {
                      return <p key={i} className="font-semibold my-1">{line.replace(/\*\*/g, '')}</p>;
                    }
                    if (line.startsWith('- ') || line.startsWith('✅') || line.startsWith('⚠️')) {
                      return <p key={i} className="my-0.5">{line}</p>;
                    }
                    return <p key={i} className="my-1">{line || '\u00A0'}</p>;
                  })}
                </div>
              </div>
              
              {/* Sources */}
              {message.sources && message.sources.length > 0 && (
                <div className="mt-2 space-y-1">
                  <p className="text-xs text-gray-500 font-medium">Fontes consultadas:</p>
                  {message.sources.map((source, i) => (
                    <div key={i} className="flex items-center gap-2 text-xs bg-purple-50 text-purple-700 px-3 py-1.5 rounded-lg">
                      <FileText className="w-3.5 h-3.5" />
                      <span className="font-medium">{source.documentTitle}</span>
                      <span className="text-purple-500">({Math.round(source.relevance * 100)}% relevância)</span>
                    </div>
                  ))}
                </div>
              )}
              
              <p className={`text-xs mt-1 ${message.role === 'user' ? 'text-gray-400' : 'text-gray-400'}`}>
                {format(message.timestamp, "HH:mm", { locale: ptBR })}
              </p>
            </div>
          </div>
        ))}
        
        {isTyping && (
          <div className="flex gap-3">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center">
              <Bot className="w-4 h-4 text-white" />
            </div>
            <div className="bg-gray-100 px-4 py-3 rounded-2xl rounded-bl-md">
              <div className="flex gap-1">
                <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
              </div>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="px-4 py-3 border-t border-gray-100 bg-gray-50">
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Pergunte ao Copilot..."
            className="flex-1 px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || isTyping}
            className="px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-xl hover:from-purple-700 hover:to-blue-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
}
