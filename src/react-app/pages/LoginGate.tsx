import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router';
import { Zap, Lock, Shield, BarChart3, Eye, EyeOff, MessageCircle, UserPlus, ArrowLeft, Send, CheckCircle, Gift, Loader2 } from 'lucide-react';

// Senha de acesso - verificação no frontend (primeira camada)
const ACCESS_PASSWORD = 'Soul2026@';

export default function LoginGate() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [showFirstAccess, setShowFirstAccess] = useState(false);
  const [firstName, setFirstName] = useState('');
  const [firstAccessMessage, setFirstAccessMessage] = useState('');
  const [messageSent, setMessageSent] = useState(false);
  
  // Invite token handling
  const [inviteToken, setInviteToken] = useState<string | null>(null);
  const [inviteInfo, setInviteInfo] = useState<any>(null);
  const [loadingInvite, setLoadingInvite] = useState(false);

  const whatsappNumber = '+5511992536266';
  
  // Check for invite token in URL on mount
  useEffect(() => {
    const token = searchParams.get('invite');
    if (token) {
      setInviteToken(token);
      // Save token to localStorage for after Google auth
      localStorage.setItem('pendingInviteToken', token);
      
      // Fetch invite info
      setLoadingInvite(true);
      fetch(`/api/invite/${token}`)
        .then(res => res.json())
        .then(data => {
          if (data.valid) {
            setInviteInfo(data);
          } else {
            setError('Este convite é inválido ou já expirou.');
          }
        })
        .catch(() => {
          setError('Erro ao verificar convite.');
        })
        .finally(() => setLoadingInvite(false));
    }
  }, [searchParams]);

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password === ACCESS_PASSWORD) {
      // Senha correta - vai para login com Google
      navigate('/login/google');
    } else {
      setError('Senha incorreta. Entre em contato com o administrador.');
    }
  };
  
  // If user has a valid invite, they can go directly to Google login
  const handleInviteLogin = () => {
    navigate('/login/google');
  };
  
  // Show loading while checking invite
  if (loadingInvite) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-purple-50">
        <div className="text-center">
          <Loader2 className="w-10 h-10 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Verificando convite...</p>
        </div>
      </div>
    );
  }
  
  // If user has a valid invite, show special invite screen
  if (inviteToken && inviteInfo) {
    return (
      <div className="min-h-screen flex">
        {/* Left side - Branding */}
        <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-green-600 via-emerald-600 to-teal-700 p-12 flex-col justify-between">
          <div>
            <div className="flex items-center gap-3 mb-8">
              <div className="w-12 h-12 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                <Zap className="w-7 h-7 text-white" />
              </div>
              <span className="text-2xl font-bold text-white">Soul Collect</span>
            </div>
            <h1 className="text-4xl font-bold text-white mb-4">
              Você foi<br />Convidado!
            </h1>
            <p className="text-green-100 text-lg">
              {inviteInfo.invited_by_name} te convidou para acessar o Soul Collect como {inviteInfo.role_name}.
            </p>
          </div>

          <div className="space-y-6">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-lg bg-white/20 flex items-center justify-center flex-shrink-0">
                <Gift className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="text-white font-semibold">Acesso Liberado</h3>
                <p className="text-green-200 text-sm">Seu convite está válido e pronto para uso</p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-lg bg-white/20 flex items-center justify-center flex-shrink-0">
                <Shield className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="text-white font-semibold">Papel: {inviteInfo.role_name}</h3>
                <p className="text-green-200 text-sm">Suas permissões já estão configuradas</p>
              </div>
            </div>
          </div>

          <p className="text-green-200 text-sm">
            © 2024 Soul Collect. Todos os direitos reservados.
          </p>
        </div>

        {/* Right side - Accept Invite */}
        <div className="flex-1 flex items-center justify-center p-8">
          <div className="w-full max-w-md">
            {/* Mobile logo */}
            <div className="lg:hidden flex items-center gap-3 mb-8 justify-center">
              <div className="w-12 h-12 rounded-xl bg-green-600 flex items-center justify-center">
                <Zap className="w-7 h-7 text-white" />
              </div>
              <span className="text-2xl font-bold text-gray-900">Soul Collect</span>
            </div>

            <div className="text-center mb-8">
              <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-gradient-to-br from-green-100 to-emerald-100 flex items-center justify-center">
                <Gift className="w-10 h-10 text-green-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                Olá{inviteInfo.name ? `, ${inviteInfo.name}` : ''}!
              </h2>
              <p className="text-gray-500">
                Você foi convidado para acessar o Soul Collect
              </p>
            </div>

            <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-4 mb-6 border border-green-200">
              <div className="flex items-center gap-3 mb-3">
                <Shield className="w-5 h-5 text-green-600" />
                <span className="font-semibold text-green-800">Detalhes do Convite</span>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Convidado por:</span>
                  <span className="font-medium text-gray-900">{inviteInfo.invited_by_name || 'Administrador'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Papel:</span>
                  <span className="font-medium text-gray-900">{inviteInfo.role_name}</span>
                </div>
                {inviteInfo.corporate_email && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Email corporativo:</span>
                    <span className="font-medium text-gray-900">{inviteInfo.corporate_email}</span>
                  </div>
                )}
              </div>
            </div>

            <button
              onClick={handleInviteLogin}
              className="w-full flex items-center justify-center gap-3 px-6 py-4 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl hover:shadow-lg transition-all font-medium text-lg"
            >
              <svg className="w-6 h-6" viewBox="0 0 24 24">
                <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              Aceitar Convite com Google
            </button>

            <p className="text-center text-xs text-gray-400 mt-6">
              Ao continuar, você concorda com nossos<br />
              <a href="#" className="text-blue-600 hover:underline">Termos de Uso</a> e <a href="#" className="text-blue-600 hover:underline">Política de Privacidade</a>
            </p>
          </div>
        </div>
      </div>
    );
  }

  const handleFirstAccessSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!firstName.trim()) {
      return;
    }

    // Monta a mensagem para WhatsApp
    const message = encodeURIComponent(
      `🔐 *Solicitação de Acesso - Soul Collect*\n\n` +
      `Nome: ${firstName}\n` +
      `Mensagem: ${firstAccessMessage || 'Gostaria de solicitar acesso ao sistema.'}\n\n` +
      `_Enviado pelo formulário de primeiro acesso_`
    );

    // Abre WhatsApp
    window.open(`https://wa.me/${whatsappNumber}?text=${message}`, '_blank');
    setMessageSent(true);
  };

  // Tela de primeiro acesso
  if (showFirstAccess) {
    return (
      <div className="min-h-screen flex">
        {/* Left side - Branding */}
        <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-blue-600 via-blue-700 to-purple-700 p-12 flex-col justify-between">
          <div>
            <div className="flex items-center gap-3 mb-8">
              <div className="w-12 h-12 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                <Zap className="w-7 h-7 text-white" />
              </div>
              <span className="text-2xl font-bold text-white">Soul Collect</span>
            </div>
            <h1 className="text-4xl font-bold text-white mb-4">
              Solicite seu<br />Acesso
            </h1>
            <p className="text-blue-100 text-lg">
              Preencha o formulário para solicitar seu acesso ao sistema Soul Collect.
            </p>
          </div>

          <div className="space-y-6">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-lg bg-white/20 flex items-center justify-center flex-shrink-0">
                <UserPlus className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="text-white font-semibold">1. Preencha o Formulário</h3>
                <p className="text-blue-200 text-sm">Informe seu nome e uma mensagem</p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-lg bg-white/20 flex items-center justify-center flex-shrink-0">
                <MessageCircle className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="text-white font-semibold">2. Envie pelo WhatsApp</h3>
                <p className="text-blue-200 text-sm">Sua solicitação vai direto para o admin</p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-lg bg-white/20 flex items-center justify-center flex-shrink-0">
                <CheckCircle className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="text-white font-semibold">3. Receba seu Acesso</h3>
                <p className="text-blue-200 text-sm">O admin cadastra seu email e envia a senha</p>
              </div>
            </div>
          </div>

          <p className="text-blue-200 text-sm">
            © 2024 Soul Collect. Todos os direitos reservados.
          </p>
        </div>

        {/* Right side - Form */}
        <div className="flex-1 flex items-center justify-center p-8">
          <div className="w-full max-w-md">
            {/* Mobile logo */}
            <div className="lg:hidden flex items-center gap-3 mb-8 justify-center">
              <div className="w-12 h-12 rounded-xl bg-blue-600 flex items-center justify-center">
                <Zap className="w-7 h-7 text-white" />
              </div>
              <span className="text-2xl font-bold text-gray-900">Soul Collect</span>
            </div>

            {messageSent ? (
              <div className="text-center">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-green-100 flex items-center justify-center">
                  <CheckCircle className="w-8 h-8 text-green-600" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Solicitação Enviada!</h2>
                <p className="text-gray-500 mb-6">
                  Sua solicitação foi enviada via WhatsApp. Aguarde o administrador cadastrar seu acesso.
                </p>
                <div className="p-4 bg-blue-50 rounded-xl mb-6">
                  <p className="text-sm text-blue-800">
                    <strong>Próximos passos:</strong><br />
                    1. O administrador irá receber sua mensagem<br />
                    2. Ele cadastrará seu email Google no sistema<br />
                    3. Você receberá a senha de acesso<br />
                    4. Use a senha para entrar e depois faça login com Google
                  </p>
                </div>
                <button
                  onClick={() => {
                    setShowFirstAccess(false);
                    setMessageSent(false);
                    setFirstName('');
                    setFirstAccessMessage('');
                  }}
                  className="flex items-center justify-center gap-2 w-full px-6 py-3 text-gray-600 hover:text-gray-900 transition-colors"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Voltar para o login
                </button>
              </div>
            ) : (
              <>
                <div className="text-center mb-8">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-blue-100 flex items-center justify-center">
                    <UserPlus className="w-8 h-8 text-blue-600" />
                  </div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">Primeiro Acesso</h2>
                  <p className="text-gray-500">Preencha seus dados para solicitar acesso</p>
                </div>

                <form onSubmit={handleFirstAccessSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Seu Nome *
                    </label>
                    <input
                      type="text"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      placeholder="Digite seu nome completo"
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Mensagem (opcional)
                    </label>
                    <textarea
                      value={firstAccessMessage}
                      onChange={(e) => setFirstAccessMessage(e.target.value)}
                      placeholder="Conte um pouco sobre você ou seu interesse no sistema..."
                      rows={3}
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all resize-none"
                    />
                  </div>

                  <button
                    type="submit"
                    className="flex items-center justify-center gap-3 w-full px-6 py-3.5 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-xl hover:shadow-lg transition-all font-medium"
                  >
                    <Send className="w-5 h-5" />
                    Enviar via WhatsApp
                  </button>
                </form>

                <button
                  onClick={() => setShowFirstAccess(false)}
                  className="flex items-center justify-center gap-2 w-full mt-4 px-6 py-3 text-gray-600 hover:text-gray-900 transition-colors"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Voltar para o login
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Tela principal de login com senha
  return (
    <div className="min-h-screen flex">
      {/* Left side - Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-blue-600 via-blue-700 to-purple-700 p-12 flex-col justify-between">
        <div>
          <div className="flex items-center gap-3 mb-8">
            <div className="w-12 h-12 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
              <Zap className="w-7 h-7 text-white" />
            </div>
            <span className="text-2xl font-bold text-white">Soul Collect</span>
          </div>
          <h1 className="text-4xl font-bold text-white mb-4">
            Plataforma Inteligente de<br />Recuperação de Crédito
          </h1>
          <p className="text-blue-100 text-lg">
            Automatize sua operação de cobrança com IA, aumente a recuperação e mantenha conformidade total com a LGPD.
          </p>
        </div>

        <div className="space-y-6">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-lg bg-white/20 flex items-center justify-center flex-shrink-0">
              <BarChart3 className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-white font-semibold">Dashboard Inteligente</h3>
              <p className="text-blue-200 text-sm">KPIs em tempo real e análises preditivas</p>
            </div>
          </div>
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-lg bg-white/20 flex items-center justify-center flex-shrink-0">
              <Zap className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-white font-semibold">Agentes de IA</h3>
              <p className="text-blue-200 text-sm">Copiloto e supervisor com RAG integrado</p>
            </div>
          </div>
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-lg bg-white/20 flex items-center justify-center flex-shrink-0">
              <Shield className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-white font-semibold">LGPD Compliance</h3>
              <p className="text-blue-200 text-sm">Gestão de consentimento e auditoria completa</p>
            </div>
          </div>
        </div>

        <p className="text-blue-200 text-sm">
          © 2024 Soul Collect. Todos os direitos reservados.
        </p>
      </div>

      {/* Right side - Login */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <div className="lg:hidden flex items-center gap-3 mb-8 justify-center">
            <div className="w-12 h-12 rounded-xl bg-blue-600 flex items-center justify-center">
              <Zap className="w-7 h-7 text-white" />
            </div>
            <span className="text-2xl font-bold text-gray-900">Soul Collect</span>
          </div>

          <div className="text-center mb-8">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-blue-100 flex items-center justify-center">
              <Lock className="w-8 h-8 text-blue-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Acesso ao Sistema</h2>
            <p className="text-gray-500">Digite a senha de acesso fornecida pelo administrador</p>
          </div>

          <form onSubmit={handlePasswordSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Senha de Acesso
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    setError('');
                  }}
                  placeholder="Digite a senha..."
                  className={`w-full px-4 py-3 pr-12 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${
                    error ? 'border-red-300 bg-red-50' : 'border-gray-200'
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              {error && (
                <p className="mt-2 text-sm text-red-600">{error}</p>
              )}
            </div>

            <button
              type="submit"
              className="w-full px-6 py-3.5 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl hover:shadow-lg transition-all font-medium"
            >
              Entrar
            </button>
          </form>

          <div className="mt-6 pt-6 border-t border-gray-200">
            <p className="text-center text-sm text-gray-500 mb-4">
              Não tem acesso ainda?
            </p>
            <button
              onClick={() => setShowFirstAccess(true)}
              className="flex items-center justify-center gap-2 w-full px-6 py-3 border-2 border-gray-200 rounded-xl hover:border-green-500 hover:bg-green-50 transition-all text-gray-700 hover:text-green-700 font-medium"
            >
              <UserPlus className="w-5 h-5" />
              Solicitar Primeiro Acesso
            </button>
          </div>

          <button
            onClick={() => navigate('/')}
            className="flex items-center justify-center gap-2 w-full mt-4 px-6 py-3 text-gray-600 hover:text-gray-900 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Voltar para a página inicial
          </button>
        </div>
      </div>
    </div>
  );
}
