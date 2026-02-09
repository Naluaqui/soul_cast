import { useState } from 'react';
import { X, Copy, Check, QrCode, Barcode, Clock, CheckCircle, AlertCircle, Loader2, CreditCard, Wallet } from 'lucide-react';

interface Payment {
  id: number;
  case_id: number;
  payment_type: 'pix' | 'boleto';
  amount: number;
  status: 'pending' | 'paid' | 'expired' | 'cancelled';
  due_date: string;
  paid_at?: string;
  pix_code?: string;
  pix_qr_data?: string;
  boleto_barcode?: string;
  boleto_line?: string;
  boleto_bank?: string;
  created_at: string;
}

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  caseId: number;
  customerName: string;
  totalDebt: number;
  onPaymentCreated?: (payment: Payment) => void;
}

export default function PaymentModal({ 
  isOpen, 
  onClose, 
  caseId, 
  customerName, 
  totalDebt,
  onPaymentCreated 
}: PaymentModalProps) {
  const [activeTab, setActiveTab] = useState<'pix' | 'boleto'>('pix');
  const [amount, setAmount] = useState(totalDebt.toString());
  const [dueDate, setDueDate] = useState(() => {
    const date = new Date();
    date.setDate(date.getDate() + 7);
    return date.toISOString().split('T')[0];
  });
  const [isGenerating, setIsGenerating] = useState(false);
  const [payment, setPayment] = useState<Payment | null>(null);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const downloadPdf = (base64Data: string, fileName: string) => {
    const link = document.createElement('a');
    link.href = `data:application/pdf;base64,${base64Data}`;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleGenerate = async () => {
    setIsGenerating(true);
    setError(null);
    
    try {
      // ============================================================
      // 1. LÓGICA DO BOLETO (Chama o Odoo/Beta ERP)
      // ============================================================
      if (activeTab === 'boleto') {
        
        // CONFIGURAÇÃO
        // Em produção, troque 'localhost:8069' pelo IP/Domínio real do seu Odoo
        const ODOO_URL = "http://localhost:8069/api/external/beta/boleto/generate"; 
        const API_KEY = "beta_27DKq51NxnGFbpyCeG9MzvaFBiYho3ig"; 

        // CHAMADA AO ODOO
        const response = await fetch(ODOO_URL, {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'action-boletos': API_KEY 
          },
          body: JSON.stringify({
            // Envia o ID do caso. 
            // Se o caseId do SoulCollect for diferente do ID do Beta, você precisará ajustar aqui.
            // Assumindo que caseId é o ID da fatura no Beta:
            invoice_id: caseId 
          })
        });

        const result = await response.json();
        // O Odoo pode retornar direto ou dentro de { result: ... }
        const payload = result.result || result; 

        if (payload && payload.success) {
          const dados = payload.data;

          // A. Baixa o PDF usando a função downloadPdf que você já tem no código
          downloadPdf(dados.pdf_base64, dados.pdf_name);

          // B. Atualiza a tela do Modal com os dados reais do Boleto
          const newPayment: Payment = {
            id: Date.now(),
            case_id: caseId,
            payment_type: 'boleto',
            amount: dados.valor,
            status: 'pending',
            due_date: dados.vencimento,
            created_at: new Date().toISOString(),
            // Mapeia os campos retornados pelo Odoo
            boleto_line: dados.linha_digitavel,
            boleto_barcode: dados.codigo_barras,
            boleto_bank: 'Itaú (Via ERP Beta)', 
          };

          setPayment(newPayment);
          onPaymentCreated?.(newPayment);
        } else {
          throw new Error(payload?.error || 'O ERP Beta recusou a geração do boleto.');
        }

      } 
      // ============================================================
      // 2. LÓGICA DO PIX (Mantém sua lógica atual ou simulada)
      // ============================================================
      else {
        // Simulação de delay para Pix
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        const newPayment: Payment = {
            id: Date.now(),
            case_id: caseId,
            payment_type: 'pix',
            amount: parseFloat(amount),
            status: 'pending',
            due_date: dueDate,
            created_at: new Date().toISOString(),
            pix_code: "00020126580014BR.GOV.BCB.PIX0136123e4567-e89b-12d3-a456-426614174000520400005303986540510.005802BR5913Soul Collect6008Sao Paulo62070503***6304E2CA",
            pix_qr_data: "https://upload.wikimedia.org/wikipedia/commons/d/d0/QR_code_for_mobile_English_Wikipedia.svg"
        };
        
        setPayment(newPayment);
        onPaymentCreated?.(newPayment);
      }

    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Erro de conexão com o servidor.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  };

  const getStatusBadge = (status: string) => {
    const styles: Record<string, { bg: string; text: string; icon: any }> = {
      pending: { bg: 'bg-amber-500/10', text: 'text-amber-400', icon: Clock },
      paid: { bg: 'bg-emerald-500/10', text: 'text-emerald-400', icon: CheckCircle },
      expired: { bg: 'bg-red-500/10', text: 'text-red-400', icon: AlertCircle },
      cancelled: { bg: 'bg-slate-500/10', text: 'text-slate-400', icon: X }
    };
    const style = styles[status] || styles.pending;
    const Icon = style.icon;
    const labels: Record<string, string> = {
      pending: 'Aguardando',
      paid: 'Pago',
      expired: 'Expirado',
      cancelled: 'Cancelado'
    };

    return (
      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${style.bg} ${style.text}`}>
        <Icon className="w-3.5 h-3.5" />
        {labels[status]}
      </span>
    );
  };

  const resetForm = () => {
    setPayment(null);
    setError(null);
    setCopied(false);
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-slate-900 rounded-2xl w-full max-w-lg border border-slate-700/50 shadow-2xl">
        {/* Header */}
        <div className="p-6 border-b border-slate-700/50">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold text-white">Gerar Pagamento</h2>
              <p className="text-sm text-slate-400 mt-1">{customerName}</p>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-slate-800 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-slate-400" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {!payment ? (
            <>
              {/* Payment Type Tabs */}
              <div className="flex gap-2 p-1 bg-slate-800/50 rounded-xl mb-6">
                <button
                  onClick={() => { setActiveTab('pix'); resetForm(); }}
                  className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-lg font-medium transition-all ${
                    activeTab === 'pix'
                      ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/25'
                      : 'text-slate-400 hover:text-white hover:bg-slate-700/50'
                  }`}
                >
                  <Wallet className="w-4 h-4" />
                  Pix
                </button>
                <button
                  onClick={() => { setActiveTab('boleto'); resetForm(); }}
                  className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-lg font-medium transition-all ${
                    activeTab === 'boleto'
                      ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/25'
                      : 'text-slate-400 hover:text-white hover:bg-slate-700/50'
                  }`}
                >
                  <CreditCard className="w-4 h-4" />
                  Boleto
                </button>
              </div>

              {/* Form */}
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Valor
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">R$</span>
                    <input
                      type="number"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500"
                      step="0.01"
                      min="0.01"
                    />
                  </div>
                  <p className="text-xs text-slate-500 mt-1">
                    Dívida total: {formatCurrency(totalDebt)}
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Vencimento
                  </label>
                  <input
                    type="date"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500"
                  />
                </div>

                {error && (
                  <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm">
                    {error}
                  </div>
                )}

                <button
                  onClick={handleGenerate}
                  disabled={isGenerating || !amount || parseFloat(amount) <= 0}
                  className={`w-full py-3 px-4 rounded-xl font-medium flex items-center justify-center gap-2 transition-all ${
                    activeTab === 'pix'
                      ? 'bg-emerald-600 hover:bg-emerald-500 text-white disabled:bg-emerald-800 disabled:text-emerald-400'
                      : 'bg-blue-600 hover:bg-blue-500 text-white disabled:bg-blue-800 disabled:text-blue-400'
                  } disabled:cursor-not-allowed`}
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Gerando...
                    </>
                  ) : (
                    <>
                      {activeTab === 'pix' ? <QrCode className="w-5 h-5" /> : <Barcode className="w-5 h-5" />}
                      Gerar {activeTab === 'pix' ? 'QR Code Pix' : 'Boleto'}
                    </>
                  )}
                </button>
              </div>
            </>
          ) : (
            /* Payment Generated */
            <div className="space-y-6">
              {/* Status */}
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-400">Status</span>
                {getStatusBadge(payment.status)}
              </div>

              {/* Amount */}
              <div className="text-center py-4 bg-slate-800/50 rounded-xl">
                <p className="text-sm text-slate-400 mb-1">Valor</p>
                <p className="text-3xl font-bold text-white">{formatCurrency(payment.amount)}</p>
                <p className="text-xs text-slate-500 mt-2">
                  Vencimento: {new Date(payment.due_date).toLocaleDateString('pt-BR')}
                </p>
              </div>

              {payment.payment_type === 'pix' ? (
                /* Pix QR Code */
                <div className="space-y-4">
                  {/* QR Code Display */}
                  <div className="bg-white p-6 rounded-xl flex items-center justify-center">
                    <div className="relative">
                      <img 
                        src={payment.pix_qr_data} 
                        alt="QR Code Pix" 
                        className="w-48 h-48"
                      />
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="bg-emerald-500 p-2 rounded-lg">
                          <Wallet className="w-6 h-6 text-white" />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Pix Copy-Paste */}
                  <div>
                    <label className="block text-xs font-medium text-slate-400 mb-2">
                      Pix Copia e Cola
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        value={payment.pix_code || ''}
                        readOnly
                        className="w-full px-4 py-3 pr-12 bg-slate-800 border border-slate-700 rounded-xl text-white text-sm font-mono"
                      />
                      <button
                        onClick={() => handleCopy(payment.pix_code || '')}
                        className="absolute right-2 top-1/2 -translate-y-1/2 p-2 hover:bg-slate-700 rounded-lg transition-colors"
                      >
                        {copied ? (
                          <Check className="w-4 h-4 text-emerald-400" />
                        ) : (
                          <Copy className="w-4 h-4 text-slate-400" />
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                /* Boleto */
                <div className="space-y-4">
                  {/* Bank Info */}
                  <div className="flex items-center gap-3 p-4 bg-slate-800/50 rounded-xl">
                    <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                      <CreditCard className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <p className="font-medium text-white">{payment.boleto_bank}</p>
                      <p className="text-xs text-slate-400">Banco emissor</p>
                    </div>
                  </div>

                  {/* Barcode Display */}
                  <div className="bg-white p-4 rounded-xl">
                    <div className="flex items-center justify-center gap-0.5 h-16">
                      {/* Simulated barcode visual */}
                      {Array.from({ length: 50 }).map((_, i) => (
                        <div
                          key={i}
                          className="h-full bg-black"
                          style={{ width: Math.random() > 0.5 ? '2px' : '1px' }}
                        />
                      ))}
                    </div>
                  </div>

                  {/* Linha Digitável */}
                  <div>
                    <label className="block text-xs font-medium text-slate-400 mb-2">
                      Linha Digitável
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        value={payment.boleto_line || ''}
                        readOnly
                        className="w-full px-4 py-3 pr-12 bg-slate-800 border border-slate-700 rounded-xl text-white text-sm font-mono"
                      />
                      <button
                        onClick={() => handleCopy(payment.boleto_line || '')}
                        className="absolute right-2 top-1/2 -translate-y-1/2 p-2 hover:bg-slate-700 rounded-lg transition-colors"
                      >
                        {copied ? (
                          <Check className="w-4 h-4 text-emerald-400" />
                        ) : (
                          <Copy className="w-4 h-4 text-slate-400" />
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Código de Barras */}
                  <div>
                    <label className="block text-xs font-medium text-slate-400 mb-2">
                      Código de Barras
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        value={payment.boleto_barcode || ''}
                        readOnly
                        className="w-full px-4 py-3 pr-12 bg-slate-800 border border-slate-700 rounded-xl text-white text-sm font-mono text-xs"
                      />
                      <button
                        onClick={() => handleCopy(payment.boleto_barcode || '')}
                        className="absolute right-2 top-1/2 -translate-y-1/2 p-2 hover:bg-slate-700 rounded-lg transition-colors"
                      >
                        {copied ? (
                          <Check className="w-4 h-4 text-emerald-400" />
                        ) : (
                          <Copy className="w-4 h-4 text-slate-400" />
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-3">
                <button
                  onClick={() => { setPayment(null); resetForm(); }}
                  className="flex-1 py-3 px-4 bg-slate-800 hover:bg-slate-700 text-white rounded-xl font-medium transition-colors"
                >
                  Gerar Novo
                </button>
                <button
                  onClick={onClose}
                  className={`flex-1 py-3 px-4 rounded-xl font-medium transition-colors ${
                    payment.payment_type === 'pix'
                      ? 'bg-emerald-600 hover:bg-emerald-500 text-white'
                      : 'bg-blue-600 hover:bg-blue-500 text-white'
                  }`}
                >
                  Concluir
                </button>
              </div>

              {/* Demo Notice */}
              <p className="text-xs text-center text-slate-500">
                ⚠️ Modo demo: pagamentos fictícios para testes
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
