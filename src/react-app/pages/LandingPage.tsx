import { Zap, Shield, BarChart3, Users, TrendingUp, MessageSquare, Brain, CheckCircle, Menu, X, MessageCircle, Lock, LogIn } from 'lucide-react';
import { useState } from 'react';
import { Link } from 'react-router';

export default function LandingPage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const whatsappNumber = '+5511992536266';
  const whatsappMessage = encodeURIComponent('Olá! Gostaria de solicitar acesso ao sistema Soul Collect.');

  const features = [
    {
      icon: Brain,
      title: 'IA Generativa Avançada',
      description: 'Copiloto inteligente com RAG para análise preditiva e recomendações estratégicas em tempo real.'
    },
    {
      icon: MessageSquare,
      title: 'WhatsApp Integrado',
      description: 'Comunicação automatizada via WhatsApp Business API com templates personalizados e tracking completo.'
    },
    {
      icon: BarChart3,
      title: 'Dashboard Inteligente',
      description: 'KPIs em tempo real, funil de cobrança, análise de performance e métricas de recuperação.'
    },
    {
      icon: TrendingUp,
      title: 'Jornadas Automatizadas',
      description: 'Crie fluxos de cobrança personalizados com gatilhos automáticos e follow-ups programados.'
    },
    {
      icon: Shield,
      title: 'LGPD Compliance',
      description: 'Gestão completa de consentimento, auditoria de ações e conformidade total com LGPD.'
    },
    {
      icon: Users,
      title: 'Multi-nível de Acesso',
      description: 'Controle granular de permissões: Admin, Product Manager e Analista com audit logs completos.'
    }
  ];

  const benefits = [
    { text: 'Aumente a taxa de recuperação em até 45%' },
    { text: 'Reduza tempo de operação em 60%' },
    { text: 'Mantenha compliance total com LGPD' },
    { text: 'Integração nativa com SAP e Beta ERP' },
    { text: 'Supervisor de riscos com IA' },
    { text: 'APIs e Webhooks para integrações' }
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="fixed top-0 w-full bg-white/95 backdrop-blur-sm border-b border-gray-100 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16 sm:h-20">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center shadow-lg">
                <Zap className="w-6 h-6 sm:w-7 sm:h-7 text-white" />
              </div>
              <span className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Soul Collect
              </span>
            </div>

            {/* Desktop Menu */}
            <div className="hidden md:flex items-center gap-6">
              <a href="#features" className="text-gray-600 hover:text-gray-900 transition-colors">Recursos</a>
              <a href="#benefits" className="text-gray-600 hover:text-gray-900 transition-colors">Benefícios</a>
              <Link
                to="/login"
                className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl hover:shadow-lg transition-all font-medium"
              >
                <LogIn className="w-5 h-5" />
                Entrar
              </Link>
            </div>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 text-gray-600 hover:text-gray-900"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-gray-100 bg-white">
            <div className="px-4 py-4 space-y-3">
              <a
                href="#features"
                onClick={() => setMobileMenuOpen(false)}
                className="block px-4 py-2 text-gray-600 hover:bg-gray-50 rounded-lg transition-colors"
              >
                Recursos
              </a>
              <a
                href="#benefits"
                onClick={() => setMobileMenuOpen(false)}
                className="block px-4 py-2 text-gray-600 hover:bg-gray-50 rounded-lg transition-colors"
              >
                Benefícios
              </a>
              <Link
                to="/login"
                className="flex items-center justify-center gap-2 w-full px-4 py-2.5 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl font-medium"
              >
                <LogIn className="w-5 h-5" />
                Entrar
              </Link>
            </div>
          </div>
        )}
      </header>

      {/* Hero Section */}
      <section className="pt-24 sm:pt-32 pb-12 sm:pb-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-center">
            <div className="text-center lg:text-left">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 rounded-full mb-6 sm:mb-8">
                <span className="w-2 h-2 bg-blue-600 rounded-full animate-pulse"></span>
                <span className="text-sm font-medium text-blue-700">Sistema Inteligente com IA</span>
              </div>
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 mb-4 sm:mb-6 leading-tight">
                Gestão de Cobranças
                <span className="block bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  Potencializada por IA
                </span>
              </h1>
              <p className="text-lg sm:text-xl text-gray-600 mb-6 sm:mb-8 max-w-2xl mx-auto lg:mx-0">
                Automatize sua operação de cobrança com inteligência artificial, aumente a recuperação e mantenha conformidade total com a LGPD.
              </p>
              
              {/* Access info box */}
              <div className="mb-6 p-4 bg-gradient-to-r from-amber-50 to-orange-50 rounded-xl border border-amber-200">
                <div className="flex items-start gap-3">
                  <Lock className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                  <div className="text-sm text-left">
                    <p className="text-amber-800 font-medium">Acesso Restrito</p>
                    <p className="text-amber-700">Este sistema é exclusivo para usuários autorizados. Solicite seu acesso via WhatsApp e receba um link de convite.</p>
                  </div>
                </div>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                <a
                  href={`https://wa.me/${whatsappNumber}?text=${whatsappMessage}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 px-6 sm:px-8 py-3 sm:py-4 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-xl hover:shadow-xl transition-all font-semibold text-base sm:text-lg"
                >
                  <MessageCircle className="w-5 h-5" />
                  Solicitar Acesso via WhatsApp
                </a>
              </div>
            </div>

            <div className="relative mt-8 lg:mt-0">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-400/20 to-purple-400/20 rounded-3xl blur-3xl"></div>
              <div className="relative bg-gradient-to-br from-blue-50 to-purple-50 rounded-3xl p-6 sm:p-8 border border-gray-200 shadow-2xl">
                <div className="space-y-4">
                  <div className="flex items-center gap-3 p-4 bg-white rounded-xl shadow-sm">
                    <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-green-400 to-emerald-500 flex items-center justify-center">
                      <CheckCircle className="w-6 h-6 text-white" />
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold text-gray-900">Taxa de Recuperação</p>
                      <p className="text-2xl font-bold text-green-600">+45%</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-4 bg-white rounded-xl shadow-sm">
                    <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center">
                      <TrendingUp className="w-6 h-6 text-white" />
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold text-gray-900">Eficiência Operacional</p>
                      <p className="text-2xl font-bold text-blue-600">+60%</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-4 bg-white rounded-xl shadow-sm">
                    <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-purple-400 to-purple-600 flex items-center justify-center">
                      <Shield className="w-6 h-6 text-white" />
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold text-gray-900">Conformidade LGPD</p>
                      <p className="text-2xl font-bold text-purple-600">100%</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-12 sm:py-20 px-4 sm:px-6 lg:px-8 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12 sm:mb-16">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 mb-4">
              Recursos Poderosos
            </h2>
            <p className="text-lg sm:text-xl text-gray-600 max-w-3xl mx-auto">
              Tudo que você precisa para otimizar sua operação de cobrança em uma única plataforma
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
            {features.map((feature, idx) => (
              <div
                key={idx}
                className="bg-white p-6 sm:p-8 rounded-2xl border border-gray-200 hover:shadow-xl transition-all hover:border-blue-200 group"
              >
                <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center mb-4 sm:mb-6 group-hover:scale-110 transition-transform">
                  <feature.icon className="w-6 h-6 sm:w-7 sm:h-7 text-blue-600" />
                </div>
                <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-2 sm:mb-3">{feature.title}</h3>
                <p className="text-sm sm:text-base text-gray-600">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section id="benefits" className="py-12 sm:py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-center">
            <div>
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 mb-6 sm:mb-8">
                Por que escolher o
                <span className="block bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  Soul Collect?
                </span>
              </h2>
              <div className="space-y-3 sm:space-y-4">
                {benefits.map((benefit, idx) => (
                  <div key={idx} className="flex items-center gap-3 sm:gap-4">
                    <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-gradient-to-br from-green-400 to-emerald-500 flex items-center justify-center flex-shrink-0">
                      <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                    </div>
                    <p className="text-base sm:text-lg text-gray-700">{benefit.text}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-gradient-to-br from-blue-600 to-purple-700 p-6 sm:p-8 lg:p-12 rounded-3xl text-white shadow-2xl mt-8 lg:mt-0">
              <h3 className="text-2xl sm:text-3xl font-bold mb-4 sm:mb-6">Integrações Nativas</h3>
              <div className="space-y-3 sm:space-y-4 mb-6 sm:mb-8">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-white/20 backdrop-blur-sm flex items-center justify-center">
                    <span className="text-lg sm:text-xl font-bold">S</span>
                  </div>
                  <div>
                    <p className="font-semibold">SAP Business One</p>
                    <p className="text-sm text-blue-100">Sincronização automática de títulos</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-white/20 backdrop-blur-sm flex items-center justify-center">
                    <span className="text-lg sm:text-xl font-bold">β</span>
                  </div>
                  <div>
                    <p className="font-semibold">ERP Beta (Prospera)</p>
                    <p className="text-sm text-blue-100">Integração bi-direcional completa</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-white/20 backdrop-blur-sm flex items-center justify-center">
                    <MessageSquare className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="font-semibold">WhatsApp Business API</p>
                    <p className="text-sm text-blue-100">Comunicação automatizada oficial</p>
                  </div>
                </div>
              </div>
              <a
                href={`https://wa.me/${whatsappNumber}?text=${whatsappMessage}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 w-full px-6 py-3 sm:py-4 bg-white text-blue-700 rounded-xl hover:bg-blue-50 transition-colors font-semibold"
              >
                <MessageCircle className="w-5 h-5" />
                Falar com Especialista
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-12 sm:py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-blue-600 via-blue-700 to-purple-700">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-4 sm:mb-6">
            Pronto para transformar sua cobrança?
          </h2>
          <p className="text-lg sm:text-xl text-blue-100 mb-6 sm:mb-8">
            Junte-se às empresas que já recuperam mais com inteligência artificial
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href={`https://wa.me/${whatsappNumber}?text=${whatsappMessage}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 px-6 sm:px-8 py-3 sm:py-4 bg-white text-blue-700 rounded-xl hover:bg-blue-50 transition-all font-semibold text-base sm:text-lg shadow-xl"
            >
              <MessageCircle className="w-5 h-5" />
              Solicitar Acesso
            </a>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 py-8 sm:py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto text-center">
          <div className="flex items-center justify-center gap-2 sm:gap-3 mb-4 sm:mb-6">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center">
              <Zap className="w-6 h-6 sm:w-7 sm:h-7 text-white" />
            </div>
            <span className="text-xl sm:text-2xl font-bold text-white">Soul Collect</span>
          </div>
          <p className="text-sm sm:text-base text-gray-400 mb-4 sm:mb-6">
            Plataforma inteligente de gestão de cobrança com IA
          </p>
          <div className="pt-6 sm:pt-8 border-t border-gray-800">
            <p className="text-sm text-gray-500">
              © 2024 Soul Collect. Ecossistema Soul by Prospera. Todos os direitos reservados.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
