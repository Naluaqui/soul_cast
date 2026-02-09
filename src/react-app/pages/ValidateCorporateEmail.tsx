import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router';
import { useAuth } from '@getmocha/users-service/react';
import { Loader2, Shield, Building2, CheckCircle, AlertCircle, Zap } from 'lucide-react';

export default function ValidateCorporateEmailPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user, fetchUser } = useAuth();
  
  const [corporateEmail, setCorporateEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [validating, setValidating] = useState(true);
  const [error, setError] = useState('');
  const [inviteInfo, setInviteInfo] = useState<{
    name?: string;
    role_name?: string;
    invited_by_name?: string;
    corporate_email_hint?: string;
  } | null>(null);

  const token = searchParams.get('token');

  useEffect(() => {
    const validateInvite = async () => {
      if (!token) {
        navigate('/login');
        return;
      }

      try {
        const res = await fetch(`/api/invite/${token}`);
        if (!res.ok) {
          navigate('/login');
          return;
        }
        const data = await res.json();
        
        if (!data.requires_validation) {
          // No validation required, try to accept directly
          await acceptInvite();
          return;
        }
        
        setInviteInfo({
          name: data.name,
          role_name: data.role_name,
          invited_by_name: data.invited_by_name,
          corporate_email_hint: data.corporate_email?.replace(/(.{2}).*(@.*)/, '$1***$2')
        });
      } catch (err) {
        console.error('Error validating invite:', err);
        navigate('/login');
      } finally {
        setValidating(false);
      }
    };

    validateInvite();
  }, [token, navigate]);

  const acceptInvite = async (emailToValidate?: string) => {
    if (!token) return;
    
    setLoading(true);
    setError('');
    
    try {
      const res = await fetch(`/api/invite/${token}/accept`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ 
          validated_corporate_email: emailToValidate 
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        if (data.requires_validation) {
          setInviteInfo(prev => ({
            ...prev,
            corporate_email_hint: data.corporate_email_hint
          }));
          setValidating(false);
          return;
        }
        throw new Error(data.error || 'Erro ao aceitar convite');
      }

      // Refresh user data and redirect
      await fetchUser();
      navigate('/dashboard');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao validar email');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!corporateEmail.trim()) {
      setError('Digite seu email corporativo');
      return;
    }

    await acceptInvite(corporateEmail.trim());
  };

  if (validating) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Validando convite...</p>
        </div>
      </div>
    );
  }

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
            Validação de<br />Acesso Corporativo
          </h1>
          <p className="text-blue-100 text-lg">
            Para garantir a segurança do sistema, precisamos confirmar seu email corporativo.
          </p>
        </div>

        <div className="space-y-6">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-lg bg-white/20 flex items-center justify-center flex-shrink-0">
              <Shield className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-white font-semibold">Dupla Validação</h3>
              <p className="text-blue-200 text-sm">Sua identidade é verificada em duas etapas</p>
            </div>
          </div>
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-lg bg-white/20 flex items-center justify-center flex-shrink-0">
              <Building2 className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-white font-semibold">Vínculo Corporativo</h3>
              <p className="text-blue-200 text-sm">Acesso vinculado ao seu email da empresa</p>
            </div>
          </div>
        </div>

        <p className="text-blue-200 text-sm">
          © 2024 Soul Collect. Todos os direitos reservados.
        </p>
      </div>

      {/* Right side - Validation Form */}
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
            <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center mx-auto mb-4">
              <Building2 className="w-8 h-8 text-blue-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Validação Corporativa</h2>
            <p className="text-gray-500">
              {user?.email ? (
                <>Você está logado como <strong className="text-gray-700">{user.email}</strong></>
              ) : (
                'Confirme seu email corporativo para continuar'
              )}
            </p>
          </div>

          {inviteInfo && (
            <div className="mb-6 p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl border border-blue-100">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle className="w-5 h-5 text-green-500" />
                <span className="font-medium text-gray-900">Convite válido</span>
              </div>
              {inviteInfo.invited_by_name && (
                <p className="text-sm text-gray-600 mb-1">
                  Convidado por: <strong>{inviteInfo.invited_by_name}</strong>
                </p>
              )}
              {inviteInfo.role_name && (
                <p className="text-sm text-gray-600 mb-1">
                  Papel: <strong>{inviteInfo.role_name}</strong>
                </p>
              )}
              {inviteInfo.name && (
                <p className="text-sm text-gray-600">
                  Nome: <strong>{inviteInfo.name}</strong>
                </p>
              )}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email Corporativo
              </label>
              <input
                type="email"
                value={corporateEmail}
                onChange={(e) => setCorporateEmail(e.target.value)}
                placeholder={inviteInfo?.corporate_email_hint || "seu.email@empresa.com"}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-lg"
                autoFocus
              />
              {inviteInfo?.corporate_email_hint && (
                <p className="text-sm text-gray-500 mt-2">
                  Dica: o email esperado é parecido com <strong>{inviteInfo.corporate_email_hint}</strong>
                </p>
              )}
            </div>

            {error && (
              <div className="p-4 bg-red-50 rounded-xl flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                <p className="text-red-700 text-sm">{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 px-6 py-3.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors disabled:opacity-50 font-medium"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Validando...
                </>
              ) : (
                <>
                  <CheckCircle className="w-5 h-5" />
                  Validar e Acessar
                </>
              )}
            </button>
          </form>

          <p className="text-center text-xs text-gray-400 mt-8">
            Esta validação garante que apenas pessoas autorizadas<br />
            pela sua empresa tenham acesso ao sistema.
          </p>
        </div>
      </div>
    </div>
  );
}
