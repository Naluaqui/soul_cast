import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import { useAuth } from '@getmocha/users-service/react';
import { Loader2, AlertTriangle, MessageCircle, ShieldX } from 'lucide-react';

export default function AuthCallbackPage() {
  const navigate = useNavigate();
  const { exchangeCodeForSessionToken, fetchUser, logout } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const [unauthorized, setUnauthorized] = useState(false);
  const [status, setStatus] = useState('Autenticando...');

  const whatsappNumber = '+5511992536266';
  const whatsappMessage = encodeURIComponent('Olá! Gostaria de solicitar acesso ao sistema Soul Collect.');

  useEffect(() => {
    const handleCallback = async () => {
      try {
        setStatus('Autenticando com Google...');
        await exchangeCodeForSessionToken();
        
        // Check if there's a pending invite token
        const pendingInviteToken = localStorage.getItem('pendingInviteToken');
        
        if (pendingInviteToken) {
          setStatus('Processando convite...');
          
          // Try to accept the invite
          const acceptRes = await fetch(`/api/invite/${pendingInviteToken}/accept`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({})
          });
          
          const acceptData = await acceptRes.json();
          
          if (!acceptRes.ok) {
            if (acceptData.requires_validation) {
              // Redirect to corporate email validation page
              navigate(`/validate-corporate-email?token=${pendingInviteToken}`);
              return;
            }
            // Convite inválido ou erro - limpa token
            console.error('Invite accept error:', acceptData.error);
            localStorage.removeItem('pendingInviteToken');
            // Continua para verificar se o usuário está autorizado de outra forma
          } else {
            // Invite accepted successfully
            localStorage.removeItem('pendingInviteToken');
          }
        }
        
        // SEMPRE verificar se o usuário está autorizado no banco de dados
        // Isso é crítico para segurança - não podemos deixar passar
        setStatus('Verificando autorização...');
        const userRes = await fetch('/api/users/me', {
          credentials: 'include'
        });
        
        if (!userRes.ok) {
          const userData = await userRes.json();
          
          // Qualquer erro de autorização deve bloquear o acesso
          if (userRes.status === 403 || userData.unauthorized) {
            // Fazer logout da sessão do Mocha para limpar cookies
            try {
              await fetch('/api/logout', { credentials: 'include' });
            } catch (e) {
              console.error('Logout error:', e);
            }
            
            setUnauthorized(true);
            setError(userData.error || 'Seu email não está autorizado a acessar este sistema.');
            return;
          }
          
          // Outros erros
          throw new Error(userData.error || 'Falha ao verificar autorização');
        }
        
        // Verificar se realmente temos um appUser válido
        const userData = await userRes.json();
        if (!userData.appUser) {
          // Usuário autenticado no Google mas não tem registro em app_users
          try {
            await fetch('/api/logout', { credentials: 'include' });
          } catch (e) {
            console.error('Logout error:', e);
          }
          
          setUnauthorized(true);
          setError('Seu email não está cadastrado no sistema. Solicite acesso ao administrador.');
          return;
        }
        
        setStatus('Carregando dados do usuário...');
        await fetchUser();
        navigate('/dashboard');
      } catch (err: any) {
        console.error('Auth callback error:', err);
        
        // Tentar fazer logout em caso de erro
        try {
          await fetch('/api/logout', { credentials: 'include' });
        } catch (e) {
          console.error('Logout error:', e);
        }
        
        if (err.message?.includes('403') || err.message?.includes('unauthorized') || err.message?.includes('não autorizado')) {
          setUnauthorized(true);
          setError('Seu email não está autorizado a acessar este sistema.');
        } else {
          setError('Falha na autenticação. Por favor, tente novamente.');
          setTimeout(() => navigate('/login'), 3000);
        }
      }
    };

    handleCallback();
  }, [exchangeCodeForSessionToken, fetchUser, navigate, logout]);

  if (error) {
    if (unauthorized) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 p-4">
          <div className="text-center max-w-md bg-white rounded-2xl shadow-xl p-8">
            <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-br from-red-100 to-amber-100 flex items-center justify-center">
              <ShieldX className="w-10 h-10 text-red-500" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-3">Acesso Negado</h2>
            <p className="text-gray-600 mb-6">{error}</p>
            
            <div className="p-4 bg-amber-50 rounded-xl mb-6 text-left">
              <p className="text-sm text-amber-800 font-medium mb-2">
                Para obter acesso ao sistema:
              </p>
              <ol className="text-sm text-amber-700 list-decimal list-inside space-y-1">
                <li>Entre em contato com o administrador</li>
                <li>Informe seu email Google</li>
                <li>Aguarde o cadastro do seu acesso</li>
                <li>Tente fazer login novamente</li>
              </ol>
            </div>
            
            <a
              href={`https://wa.me/${whatsappNumber}?text=${whatsappMessage}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 w-full px-6 py-3.5 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-xl hover:shadow-lg transition-all font-medium mb-3"
            >
              <MessageCircle className="w-5 h-5" />
              Solicitar Acesso via WhatsApp
            </a>
            
            <button
              onClick={() => navigate('/login')}
              className="block w-full py-3 text-gray-500 hover:text-gray-700 text-sm font-medium"
            >
              Voltar para o login
            </button>
          </div>
        </div>
      );
    }
    
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-100 flex items-center justify-center">
            <AlertTriangle className="w-8 h-8 text-red-500" />
          </div>
          <p className="text-red-600 font-medium mb-2">{error}</p>
          <p className="text-gray-500 text-sm">Redirecionando para login...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-purple-50">
      <div className="text-center">
        <div className="relative">
          <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center mx-auto mb-6 animate-pulse">
            <Loader2 className="w-10 h-10 animate-spin text-white" />
          </div>
        </div>
        <p className="text-gray-700 font-medium">{status}</p>
        <p className="text-gray-400 text-sm mt-2">Por favor, aguarde...</p>
      </div>
    </div>
  );
}
