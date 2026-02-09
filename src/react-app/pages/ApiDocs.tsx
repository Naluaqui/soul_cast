import { useState } from 'react';
import { 
  ArrowLeft, Download, Copy, Check, FileText, 
  Key, Globe, Database, Shield, Code, ChevronRight
} from 'lucide-react';
import { useNavigate } from 'react-router';

export default function ApiDocsPage() {
  const navigate = useNavigate();
  const [copied, setCopied] = useState<string | null>(null);
  const baseUrl = window.location.origin;

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  };

  const handlePrint = () => {
    window.print();
  };

  const CodeBlock = ({ children, id }: { children: string; id: string }) => (
    <div className="relative group">
      <pre className="bg-gray-900 text-gray-100 rounded-lg p-4 overflow-x-auto text-sm font-mono">
        {children}
      </pre>
      <button
        onClick={() => handleCopy(children, id)}
        className="absolute top-2 right-2 p-2 bg-gray-700 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity print:hidden"
      >
        {copied === id ? (
          <Check className="w-4 h-4 text-green-400" />
        ) : (
          <Copy className="w-4 h-4 text-gray-300" />
        )}
      </button>
    </div>
  );

  const Endpoint = ({ method, path, description }: { method: string; path: string; description: string }) => (
    <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
      <span className={`px-2 py-1 text-xs font-bold rounded ${
        method === 'GET' ? 'bg-blue-100 text-blue-700' :
        method === 'POST' ? 'bg-green-100 text-green-700' :
        method === 'PUT' ? 'bg-yellow-100 text-yellow-700' :
        'bg-red-100 text-red-700'
      }`}>
        {method}
      </span>
      <div className="flex-1">
        <code className="text-sm font-mono text-gray-800">{path}</code>
        <p className="text-sm text-gray-600 mt-1">{description}</p>
      </div>
      <button
        onClick={() => handleCopy(`${baseUrl}${path}`, path)}
        className="p-1.5 text-gray-400 hover:text-gray-600 print:hidden"
      >
        {copied === path ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
      </button>
    </div>
  );

  return (
    <div className="min-h-screen bg-white">
      {/* Header - hidden in print */}
      <div className="print:hidden sticky top-0 bg-white border-b border-gray-200 z-10">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft className="w-5 h-5" />
            Voltar
          </button>
          <button
            onClick={handlePrint}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <Download className="w-4 h-4" />
            Baixar PDF
          </button>
        </div>
      </div>

      {/* Document Content */}
      <div className="max-w-4xl mx-auto px-6 py-8 print:py-0 print:px-0">
        {/* Title */}
        <div className="text-center mb-12 print:mb-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-600 to-purple-600 rounded-2xl flex items-center justify-center print:w-12 print:h-12">
              <FileText className="w-8 h-8 text-white print:w-6 print:h-6" />
            </div>
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-2 print:text-3xl">Soul Collect API</h1>
          <p className="text-xl text-gray-500 print:text-lg">Documentação de Integração Externa</p>
          <p className="text-sm text-gray-400 mt-2">Versão 1.0 • Atualizado em {new Date().toLocaleDateString('pt-BR')}</p>
        </div>

        {/* Table of Contents */}
        <div className="bg-gray-50 rounded-xl p-6 mb-8 print:bg-white print:border print:border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Índice</h2>
          <div className="space-y-2">
            <a href="#auth" className="flex items-center gap-2 text-blue-600 hover:text-blue-700">
              <ChevronRight className="w-4 h-4" /> 1. Autenticação
            </a>
            <a href="#sap" className="flex items-center gap-2 text-blue-600 hover:text-blue-700">
              <ChevronRight className="w-4 h-4" /> 2. Integração SAP Business One
            </a>
            <a href="#beta" className="flex items-center gap-2 text-blue-600 hover:text-blue-700">
              <ChevronRight className="w-4 h-4" /> 3. Integração ERP Beta
            </a>
            <a href="#webhooks" className="flex items-center gap-2 text-blue-600 hover:text-blue-700">
              <ChevronRight className="w-4 h-4" /> 4. Webhooks
            </a>
            <a href="#errors" className="flex items-center gap-2 text-blue-600 hover:text-blue-700">
              <ChevronRight className="w-4 h-4" /> 5. Códigos de Erro
            </a>
          </div>
        </div>

        {/* Section 1: Authentication */}
        <section id="auth" className="mb-12 print:break-inside-avoid">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center">
              <Key className="w-5 h-5 text-purple-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900">1. Autenticação</h2>
          </div>
          
          <div className="prose prose-gray max-w-none">
            <p className="text-gray-600 mb-4">
              Todas as requisições à API devem incluir uma chave de autenticação no header HTTP. 
              A API Key é gerada na configuração de cada integração no Soul Collect.
            </p>

            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6">
              <p className="text-amber-800 text-sm">
                <strong>Importante:</strong> Mantenha sua API Key segura. Não compartilhe em repositórios públicos ou código client-side.
              </p>
            </div>

            <h3 className="text-lg font-semibold text-gray-900 mt-6 mb-3">Header de Autenticação</h3>
            <CodeBlock id="auth-header">
{`X-API-Key: sua_api_key_aqui`}
            </CodeBlock>

            <h3 className="text-lg font-semibold text-gray-900 mt-6 mb-3">Exemplo de Requisição (cURL)</h3>
            <CodeBlock id="auth-curl">
{`curl -X POST "${baseUrl}/api/external/sap/invoices" \\
  -H "Content-Type: application/json" \\
  -H "X-API-Key: sua_api_key_aqui" \\
  -d '{"invoices": [...]}'`}
            </CodeBlock>
          </div>
        </section>

        {/* Section 2: SAP B1 */}
        <section id="sap" className="mb-12 print:break-before-page">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
              <Database className="w-5 h-5 text-blue-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900">2. Integração SAP Business One</h2>
          </div>

          <p className="text-gray-600 mb-6">
            Endpoints para sincronização bidirecional com SAP Business One. Permite enviar títulos/notas fiscais 
            e consultar pagamentos confirmados.
          </p>

          <h3 className="text-lg font-semibold text-gray-900 mb-4">Endpoints Disponíveis</h3>
          <div className="space-y-3 mb-6">
            <Endpoint 
              method="POST" 
              path="/api/external/sap/invoices" 
              description="Enviar títulos/notas fiscais do SAP para o Soul Collect"
            />
            <Endpoint 
              method="GET" 
              path="/api/external/sap/payments" 
              description="Consultar pagamentos confirmados para baixa no SAP"
            />
          </div>

          <h3 className="text-lg font-semibold text-gray-900 mt-8 mb-4">POST /api/external/sap/invoices</h3>
          <p className="text-gray-600 mb-4">
            Envia uma lista de títulos/notas fiscais do SAP B1 para criar ou atualizar casos no Soul Collect.
          </p>

          <h4 className="font-medium text-gray-900 mb-2">Corpo da Requisição</h4>
          <CodeBlock id="sap-invoices-body">
{`{
  "invoices": [
    {
      "doc_entry": 12345,           // ID do documento no SAP (obrigatório)
      "card_name": "Cliente Ltda",   // Nome do cliente
      "tax_id": "12.345.678/0001-90", // CNPJ ou CPF
      "doc_total": 15000.00,         // Valor total da dívida
      "days_overdue": 45,            // Dias em atraso
      "doc_type": "invoice",         // Tipo: invoice, boleto, etc
      "phone": "(11) 99999-9999",    // Telefone (opcional)
      "email": "cliente@email.com"   // Email (opcional)
    }
  ]
}`}
          </CodeBlock>

          <h4 className="font-medium text-gray-900 mt-6 mb-2">Resposta de Sucesso (200)</h4>
          <CodeBlock id="sap-invoices-response">
{`{
  "success": true,
  "created": 5,    // Novos casos criados
  "updated": 3,    // Casos existentes atualizados
  "errors": []     // Lista de erros, se houver
}`}
          </CodeBlock>

          <h3 className="text-lg font-semibold text-gray-900 mt-8 mb-4">GET /api/external/sap/payments</h3>
          <p className="text-gray-600 mb-4">
            Retorna lista de pagamentos confirmados para registro de baixa no SAP.
          </p>

          <h4 className="font-medium text-gray-900 mb-2">Parâmetros de Query</h4>
          <div className="overflow-x-auto">
            <table className="w-full text-sm border border-gray-200 rounded-lg overflow-hidden">
              <thead className="bg-gray-50">
                <tr>
                  <th className="text-left px-4 py-2 font-medium">Parâmetro</th>
                  <th className="text-left px-4 py-2 font-medium">Tipo</th>
                  <th className="text-left px-4 py-2 font-medium">Descrição</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-t border-gray-100">
                  <td className="px-4 py-2 font-mono text-blue-600">status</td>
                  <td className="px-4 py-2">string</td>
                  <td className="px-4 py-2">Filtrar por status (default: "paid")</td>
                </tr>
                <tr className="border-t border-gray-100">
                  <td className="px-4 py-2 font-mono text-blue-600">since</td>
                  <td className="px-4 py-2">ISO date</td>
                  <td className="px-4 py-2">Retornar pagamentos após esta data</td>
                </tr>
              </tbody>
            </table>
          </div>

          <h4 className="font-medium text-gray-900 mt-6 mb-2">Resposta de Sucesso (200)</h4>
          <CodeBlock id="sap-payments-response">
{`{
  "payments": [
    {
      "doc_entry": "12345",
      "payment_date": "2024-01-15T14:30:00Z",
      "payment_amount": 5000.00,
      "payment_type": "PIX",
      "external_reference": "DEMO-abc123",
      "customer_name": "Cliente Ltda",
      "customer_document": "12.345.678/0001-90"
    }
  ],
  "total": 1
}`}
          </CodeBlock>
        </section>

        {/* Section 3: Beta ERP */}
        <section id="beta" className="mb-12 print:break-before-page">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center">
              <Globe className="w-5 h-5 text-purple-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900">3. Integração ERP Beta</h2>
          </div>

          <p className="text-gray-600 mb-6">
            Endpoints para integração com o ERP Beta (CRM interno da Prospera). Permite sincronização 
            de clientes, casos e pagamentos em tempo real.
          </p>

          <h3 className="text-lg font-semibold text-gray-900 mb-4">Endpoints Disponíveis</h3>
          <div className="space-y-3 mb-6">
            <Endpoint 
              method="POST" 
              path="/api/external/beta/customers" 
              description="Enviar clientes/devedores do Beta para o Soul Collect"
            />
            <Endpoint 
              method="GET" 
              path="/api/external/beta/cases" 
              description="Consultar status dos casos para atualizar no Beta"
            />
            <Endpoint 
              method="POST" 
              path="/api/external/beta/payments" 
              description="Notificar pagamentos recebidos pelo Beta"
            />
            <Endpoint 
              method="POST" 
              path="/api/external/beta/webhook" 
              description="Webhook para eventos em tempo real"
            />
          </div>

          <h3 className="text-lg font-semibold text-gray-900 mt-8 mb-4">POST /api/external/beta/customers</h3>
          <p className="text-gray-600 mb-4">
            Envia uma lista de clientes/devedores do Beta para criar ou atualizar casos.
          </p>

          <h4 className="font-medium text-gray-900 mb-2">Corpo da Requisição</h4>
          <CodeBlock id="beta-customers-body">
{`{
  "customers": [
    {
      "id_beta": "CL-12345",           // ID único no Beta (obrigatório)
      "nome": "João da Silva",          // Nome do cliente
      "cpf": "123.456.789-00",          // CPF ou CNPJ
      "telefone": "(11) 99999-9999",    // Telefone
      "email": "joao@email.com",        // Email
      "valor_divida": 5000.00,          // Valor total da dívida
      "dias_atraso": 30,                // Dias em atraso
      "score_risco": 75                 // Score de risco (0-100)
    }
  ]
}`}
          </CodeBlock>

          <h3 className="text-lg font-semibold text-gray-900 mt-8 mb-4">GET /api/external/beta/cases</h3>
          <p className="text-gray-600 mb-4">
            Retorna lista de casos com seus status atualizados para sincronização com o Beta.
          </p>

          <h4 className="font-medium text-gray-900 mb-2">Parâmetros de Query</h4>
          <div className="overflow-x-auto">
            <table className="w-full text-sm border border-gray-200 rounded-lg overflow-hidden">
              <thead className="bg-gray-50">
                <tr>
                  <th className="text-left px-4 py-2 font-medium">Parâmetro</th>
                  <th className="text-left px-4 py-2 font-medium">Tipo</th>
                  <th className="text-left px-4 py-2 font-medium">Descrição</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-t border-gray-100">
                  <td className="px-4 py-2 font-mono text-blue-600">updated_since</td>
                  <td className="px-4 py-2">ISO date</td>
                  <td className="px-4 py-2">Retornar casos atualizados após esta data</td>
                </tr>
                <tr className="border-t border-gray-100">
                  <td className="px-4 py-2 font-mono text-blue-600">status</td>
                  <td className="px-4 py-2">string</td>
                  <td className="px-4 py-2">Filtrar por status específico</td>
                </tr>
              </tbody>
            </table>
          </div>

          <h4 className="font-medium text-gray-900 mt-6 mb-2">Resposta de Sucesso (200)</h4>
          <CodeBlock id="beta-cases-response">
{`{
  "cases": [
    {
      "id_soul_collect": 1,
      "case_number": "CASE-001",
      "id_beta": "CL-12345",
      "cpf_cnpj": "123.456.789-00",
      "nome_cliente": "João da Silva",
      "valor_divida": 5000.00,
      "dias_atraso": 30,
      "status_cobranca": "negotiating",
      "ultimo_contato": "2024-01-15T10:00:00Z",
      "canal_contato": "whatsapp",
      "score_risco": 75,
      "tem_consentimento": true,
      "atualizado_em": "2024-01-15T14:30:00Z"
    }
  ],
  "total": 1
}`}
          </CodeBlock>

          <h3 className="text-lg font-semibold text-gray-900 mt-8 mb-4">POST /api/external/beta/payments</h3>
          <p className="text-gray-600 mb-4">
            Notifica o Soul Collect sobre pagamentos recebidos no sistema Beta.
          </p>

          <h4 className="font-medium text-gray-900 mb-2">Corpo da Requisição</h4>
          <CodeBlock id="beta-payments-body">
{`{
  "payments": [
    {
      "id_beta": "CL-12345",            // ID do cliente no Beta
      "cpf": "123.456.789-00",           // CPF (alternativa ao id_beta)
      "valor": 2500.00,                  // Valor pago
      "data_pagamento": "2024-01-15",    // Data do pagamento
      "id_transacao": "TRX-789",         // ID da transação
      "quitado": false                   // Se a dívida foi totalmente quitada
    }
  ]
}`}
          </CodeBlock>
        </section>

        {/* Section 4: Webhooks */}
        <section id="webhooks" className="mb-12 print:break-before-page">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
              <Code className="w-5 h-5 text-green-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900">4. Webhooks</h2>
          </div>

          <p className="text-gray-600 mb-6">
            Configure webhooks para receber eventos em tempo real do ERP Beta.
          </p>

          <h3 className="text-lg font-semibold text-gray-900 mb-4">POST /api/external/beta/webhook</h3>
          <p className="text-gray-600 mb-4">
            Endpoint para receber eventos do Beta. O Soul Collect processa automaticamente os eventos recebidos.
          </p>

          <h4 className="font-medium text-gray-900 mb-2">Eventos Suportados</h4>
          <div className="overflow-x-auto mb-6">
            <table className="w-full text-sm border border-gray-200 rounded-lg overflow-hidden">
              <thead className="bg-gray-50">
                <tr>
                  <th className="text-left px-4 py-2 font-medium">Evento</th>
                  <th className="text-left px-4 py-2 font-medium">Descrição</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-t border-gray-100">
                  <td className="px-4 py-2 font-mono text-green-600">customer.created</td>
                  <td className="px-4 py-2">Novo cliente cadastrado no Beta</td>
                </tr>
                <tr className="border-t border-gray-100">
                  <td className="px-4 py-2 font-mono text-green-600">customer.updated</td>
                  <td className="px-4 py-2">Dados de cliente atualizados</td>
                </tr>
                <tr className="border-t border-gray-100">
                  <td className="px-4 py-2 font-mono text-green-600">payment.received</td>
                  <td className="px-4 py-2">Pagamento recebido</td>
                </tr>
                <tr className="border-t border-gray-100">
                  <td className="px-4 py-2 font-mono text-green-600">contract.cancelled</td>
                  <td className="px-4 py-2">Contrato cancelado</td>
                </tr>
              </tbody>
            </table>
          </div>

          <h4 className="font-medium text-gray-900 mb-2">Formato do Webhook</h4>
          <CodeBlock id="webhook-format">
{`{
  "event": "payment.received",
  "timestamp": "2024-01-15T14:30:00Z",
  "data": {
    // Dados específicos do evento
  }
}`}
          </CodeBlock>
        </section>

        {/* Section 5: Error Codes */}
        <section id="errors" className="mb-12 print:break-before-page">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-lg bg-red-100 flex items-center justify-center">
              <Shield className="w-5 h-5 text-red-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900">5. Códigos de Erro</h2>
          </div>

          <p className="text-gray-600 mb-6">
            A API retorna códigos HTTP padrão para indicar sucesso ou falha das requisições.
          </p>

          <div className="overflow-x-auto">
            <table className="w-full text-sm border border-gray-200 rounded-lg overflow-hidden">
              <thead className="bg-gray-50">
                <tr>
                  <th className="text-left px-4 py-2 font-medium">Código</th>
                  <th className="text-left px-4 py-2 font-medium">Status</th>
                  <th className="text-left px-4 py-2 font-medium">Descrição</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-t border-gray-100">
                  <td className="px-4 py-2 font-mono text-green-600">200</td>
                  <td className="px-4 py-2">OK</td>
                  <td className="px-4 py-2">Requisição processada com sucesso</td>
                </tr>
                <tr className="border-t border-gray-100">
                  <td className="px-4 py-2 font-mono text-yellow-600">400</td>
                  <td className="px-4 py-2">Bad Request</td>
                  <td className="px-4 py-2">Dados inválidos ou faltantes na requisição</td>
                </tr>
                <tr className="border-t border-gray-100">
                  <td className="px-4 py-2 font-mono text-red-600">401</td>
                  <td className="px-4 py-2">Unauthorized</td>
                  <td className="px-4 py-2">API Key inválida ou não fornecida</td>
                </tr>
                <tr className="border-t border-gray-100">
                  <td className="px-4 py-2 font-mono text-red-600">403</td>
                  <td className="px-4 py-2">Forbidden</td>
                  <td className="px-4 py-2">Integração não configurada ou inativa</td>
                </tr>
                <tr className="border-t border-gray-100">
                  <td className="px-4 py-2 font-mono text-red-600">404</td>
                  <td className="px-4 py-2">Not Found</td>
                  <td className="px-4 py-2">Recurso não encontrado</td>
                </tr>
                <tr className="border-t border-gray-100">
                  <td className="px-4 py-2 font-mono text-red-600">500</td>
                  <td className="px-4 py-2">Server Error</td>
                  <td className="px-4 py-2">Erro interno do servidor</td>
                </tr>
              </tbody>
            </table>
          </div>

          <h4 className="font-medium text-gray-900 mt-6 mb-2">Formato de Erro</h4>
          <CodeBlock id="error-format">
{`{
  "error": "Descrição do erro",
  "code": "ERROR_CODE"  // Opcional
}`}
          </CodeBlock>
        </section>

        {/* Footer */}
        <footer className="border-t border-gray-200 pt-8 mt-12 text-center print:mt-8">
          <p className="text-sm text-gray-500">
            Soul Collect API • Versão 1.0
          </p>
          <p className="text-xs text-gray-400 mt-1">
            Dúvidas? Entre em contato com a equipe de desenvolvimento.
          </p>
          <p className="text-xs text-gray-400 mt-4">
            Base URL: <code className="bg-gray-100 px-2 py-0.5 rounded">{baseUrl}</code>
          </p>
        </footer>
      </div>

      {/* Print Styles */}
      <style>{`
        @media print {
          body { 
            font-size: 11pt;
            line-height: 1.4;
          }
          pre {
            font-size: 9pt;
            white-space: pre-wrap;
            word-wrap: break-word;
          }
          .print\\:hidden { display: none !important; }
          .print\\:break-before-page { page-break-before: always; }
          .print\\:break-inside-avoid { page-break-inside: avoid; }
        }
      `}</style>
    </div>
  );
}
