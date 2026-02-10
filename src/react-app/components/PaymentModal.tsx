import { useState } from 'react';
import { X, Copy, Check, QrCode, Barcode, Clock, CheckCircle, AlertCircle, Loader2, CreditCard, Wallet } from 'lucide-react';
import { toast } from 'react-hot-toast'; 
import { renderToStaticMarkup } from 'react-dom/server';
import html2pdf from 'html2pdf.js';
import BoletoItauLayout from './BoletoItauLayout';

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

  boleto_payload?: any; 
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

  const handleGenerate = async () => {
    setIsGenerating(true);
    setError(null);

    try {
      const response = await fetch("/api/payments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          case_id: caseId,
          payment_type: activeTab,
          amount: parseFloat(amount),
          due_date: dueDate,
        }),
      });

      const text = await response.text();
      let result: any;
      try {
        result = JSON.parse(text);
      } catch {
        result = { success: false, parse_error: true, raw: text };
      }

      if (result.success) {
        const dados = result.data || {};

        const newPayment: Payment = {
          id: Date.now(),
          case_id: caseId,
          payment_type: activeTab,
          amount: dados.valor || parseFloat(amount),
          status: "pending",
          due_date: dados.vencimento || dueDate,
          created_at: new Date().toISOString(),
          boleto_line: dados.linha_digitavel,
          boleto_barcode: dados.codigo_barras,
          boleto_bank: dados.banco || (activeTab === "boleto" ? "ERP Beta" : "PIX"),
          pix_code: dados.pix_code,
          pix_qr_data: dados.pix_qr_data,
          boleto_payload: dados,
        };

        setPayment(newPayment);
        console.log("[FRONT] payment criado:", newPayment);
        onPaymentCreated?.(newPayment);

        // --- LÓGICA DE DOWNLOAD DO PDF ---
        if (activeTab === 'boleto') {

          setTimeout(async () => {
            try {
              console.log("[PDF] Iniciando geração...");
              
              const element = document.createElement('div');
              element.style.padding = '40px';
              element.style.background = 'white';
              element.style.width = '210mm'; 

              const htmlString = renderToStaticMarkup(<BoletoItauLayout data={dados} />);
              element.innerHTML = htmlString;

              const opt = {
                margin: 0,
                filename: `boleto_prospera_${dados.invoice_id || Date.now()}.pdf`,
                image: { type: 'jpeg', quality: 0.98 },
                html2canvas: { 
                  scale: 2, 
                  useCORS: true, 
                  letterRendering: true,
                  backgroundColor: '#ffffff' 
                },
                jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
              };

              // Executa a biblioteca
              await html2pdf().set(opt).from(element).save();
              console.log("[PDF] Download disparado!");
              toast.success("Boleto baixado com sucesso!");
            } catch (pdfError) {
              console.error("❌ Erro ao gerar PDF:", pdfError);
              toast.error("Erro ao gerar o arquivo PDF.");
            }
          }, 500);
        }

      } else {
        throw new Error(result.error || "Erro ao processar sinal");
      }

    } catch (err: any) {
      console.error("❌ Erro na geração:", err.message);
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
        <div className="p-6 border-b border-slate-700/50">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold text-white">Gerar Pagamento</h2>
              <p className="text-sm text-slate-400 mt-1">{customerName}</p>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-slate-800 rounded-lg transition-colors">
              <X className="w-5 h-5 text-slate-400" />
            </button>
          </div>
        </div>

        <div className="p-6">
          {!payment ? (
            <>
              <div className="flex gap-2 p-1 bg-slate-800/50 rounded-xl mb-6">
                <button
                  onClick={() => { setActiveTab('pix'); resetForm(); }}
                  className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-lg font-medium transition-all ${activeTab === 'pix' ? 'bg-emerald-600 text-white' : 'text-slate-400'}`}
                >
                  <Wallet className="w-4 h-4" /> Pix
                </button>
                <button
                  onClick={() => { setActiveTab('boleto'); resetForm(); }}
                  className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-lg font-medium transition-all ${activeTab === 'boleto' ? 'bg-blue-600 text-white' : 'text-slate-400'}`}
                >
                  <CreditCard className="w-4 h-4" /> Boleto
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Valor</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">R$</span>
                    <input
                      type="number"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Vencimento</label>
                  <input
                    type="date"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white focus:ring-2 focus:ring-emerald-500"
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
                  className={`w-full py-3 px-4 rounded-xl font-medium flex items-center justify-center gap-2 transition-all ${activeTab === 'pix' ? 'bg-emerald-600' : 'bg-blue-600'} text-white disabled:opacity-50`}
                >
                  {isGenerating
                    ? <Loader2 className="w-5 h-5 animate-spin" />
                    : activeTab === 'pix'
                      ? <QrCode className="w-5 h-5" />
                      : <Barcode className="w-5 h-5" />
                  }
                  Gerar {activeTab === 'pix' ? 'QR Code Pix' : 'Boleto'}
                </button>
              </div>
            </>
          ) : (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-400">Status</span>
                {getStatusBadge(payment.status)}
              </div>

              <div className="text-center py-4 bg-slate-800/50 rounded-xl">
                <p className="text-sm text-slate-400 mb-1">Valor</p>
                <p className="text-3xl font-bold text-white">{formatCurrency(payment.amount)}</p>
                <p className="text-xs text-slate-500 mt-2">
                  Vencimento: {new Date(payment.due_date).toLocaleDateString('pt-BR')}
                </p>
              </div>

              {payment.payment_type === 'pix' ? (
                <div className="space-y-4">
                  <div className="bg-white p-6 rounded-xl flex items-center justify-center">
                    <img src={payment.pix_qr_data} alt="QR Code Pix" className="w-48 h-48" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-400 mb-2">Pix Copia e Cola</label>
                    <div className="relative">
                      <input
                        type="text"
                        value={payment.pix_code || ''}
                        readOnly
                        className="w-full px-4 py-3 pr-12 bg-slate-800 border border-slate-700 rounded-xl text-white text-sm font-mono"
                      />
                      <button
                        onClick={() => handleCopy(payment.pix_code || '')}
                        className="absolute right-2 top-1/2 -translate-y-1/2 p-2 hover:bg-slate-700 rounded-lg"
                      >
                        {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4 text-slate-400" />}
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center gap-3 p-4 bg-slate-800/50 rounded-xl">
                    <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                      <CreditCard className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <p className="font-medium text-white">{payment.boleto_bank}</p>
                      <p className="text-xs text-slate-400">Banco emissor</p>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-400 mb-2">Linha Digitável</label>
                    <div className="relative">
                      <input
                        type="text"
                        value={payment.boleto_line || ''}
                        readOnly
                        className="w-full px-4 py-3 pr-12 bg-slate-800 border border-slate-700 rounded-xl text-white text-sm font-mono"
                      />
                      <button
                        onClick={() => handleCopy(payment.boleto_line || '')}
                        className="absolute right-2 top-1/2 -translate-y-1/2 p-2 hover:bg-slate-700 rounded-lg"
                      >
                        {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4 text-slate-400" />}
                      </button>
                    </div>
                  </div>

                  {payment.boleto_payload?.invoice_id && ( 
                    <div className="text-xs text-slate-400"> 
                      Invoice ID: {payment.boleto_payload.invoice_id} 
                    </div> 
                  )}
                </div>
              )}

              <div className="flex gap-3">
                <button
                  onClick={() => setPayment(null)}
                  className="flex-1 py-3 px-4 bg-slate-800 hover:bg-slate-700 text-white rounded-xl font-medium transition-colors"
                >
                  Gerar Novo
                </button>
                <button
                  onClick={onClose}
                  className={`flex-1 py-3 px-4 rounded-xl font-medium ${payment.payment_type === 'pix' ? 'bg-emerald-600' : 'bg-blue-600'} text-white`}
                >
                  Concluir
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
