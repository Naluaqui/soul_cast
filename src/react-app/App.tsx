import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router";
import { AuthProvider, useAuth } from "@getmocha/users-service/react";
import { CurrentUserProvider, useCurrentUser } from "@/react-app/hooks/useCurrentUser.tsx";
import LandingPage from "@/react-app/pages/LandingPage";
import HomePage from "@/react-app/pages/Home";
import CasesPage from "@/react-app/pages/Cases";
import CaseDetailPage from "@/react-app/pages/CaseDetail";
import AgentsPage from "@/react-app/pages/Agents";
import IntegrationsPage from "@/react-app/pages/Integrations";
import UsersPage from "@/react-app/pages/Users";
import LogsPage from "@/react-app/pages/Logs";
import SettingsPage from "@/react-app/pages/Settings";
import JourneyPage from "@/react-app/pages/Journey";
import SupervisorPage from "@/react-app/pages/Supervisor";
import ConsentPage from "@/react-app/pages/Consent";
import ApiDocsPage from "@/react-app/pages/ApiDocs";
import AdminDatabasePage from "@/react-app/pages/AdminDatabase";
import LoginGatePage from "@/react-app/pages/LoginGate";
import LoginGooglePage from "@/react-app/pages/LoginGoogle";
import AuthCallbackPage from "@/react-app/pages/AuthCallback";
import ValidateCorporateEmailPage from "@/react-app/pages/ValidateCorporateEmail";
import Sidebar from "@/react-app/components/Sidebar";
import { Loader2, ShieldX, MessageCircle } from "lucide-react";

// Verifica se há sessão Mocha (Google) e se o usuário está autorizado em app_users
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, isPending: authPending } = useAuth();
  const { appUser, loading: appUserLoading, error } = useCurrentUser();

  // Ainda carregando autenticação
  if (authPending) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-2" />
          <p className="text-gray-500 text-sm">Verificando sessão...</p>
        </div>
      </div>
    );
  }

  // Sem sessão Google - redireciona para login
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Carregando dados do app_users
  if (appUserLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-2" />
          <p className="text-gray-500 text-sm">Carregando permissões...</p>
        </div>
      </div>
    );
  }

  // Usuário tem sessão Google mas não está autorizado em app_users
  if (!appUser || error) {
    const whatsappNumber = '+5511992536266';
    const whatsappMessage = encodeURIComponent('Olá! Gostaria de solicitar acesso ao sistema Soul Collect.');
    
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 p-4">
        <div className="text-center max-w-md bg-white rounded-2xl shadow-xl p-8">
          <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-br from-red-100 to-amber-100 flex items-center justify-center">
            <ShieldX className="w-10 h-10 text-red-500" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-3">Acesso Negado</h2>
          <p className="text-gray-600 mb-6">
            {error || 'Seu email não está cadastrado no sistema. Solicite acesso ao administrador.'}
          </p>
          
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
            onClick={async () => {
              // Fazer logout e redirecionar
              try {
                await fetch('/api/logout', { credentials: 'include' });
              } catch (e) {
                console.error('Logout error:', e);
              }
              window.location.href = '/login';
            }}
            className="block w-full py-3 text-gray-500 hover:text-gray-700 text-sm font-medium"
          >
            Voltar para o login
          </button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}

function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />
      <main className="flex-1 overflow-y-auto">
        {children}
      </main>
    </div>
  );
}

function PublicRoute({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  
  if (user) {
    return <Navigate to="/dashboard" replace />;
  }
  
  return <>{children}</>;
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<PublicRoute><LandingPage /></PublicRoute>} />
      <Route path="/login" element={<LoginGatePage />} />
      <Route path="/login/google" element={<LoginGooglePage />} />
      <Route path="/auth/callback" element={<AuthCallbackPage />} />
      <Route path="/validate-corporate-email" element={<ValidateCorporateEmailPage />} />
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <AppLayout>
              <HomePage />
            </AppLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/cases"
        element={
          <ProtectedRoute>
            <AppLayout>
              <CasesPage />
            </AppLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/cases/:id"
        element={
          <ProtectedRoute>
            <AppLayout>
              <CaseDetailPage />
            </AppLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/agents"
        element={
          <ProtectedRoute>
            <AppLayout>
              <AgentsPage />
            </AppLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/integrations"
        element={
          <ProtectedRoute>
            <AppLayout>
              <IntegrationsPage />
            </AppLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/users"
        element={
          <ProtectedRoute>
            <AppLayout>
              <UsersPage />
            </AppLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/logs"
        element={
          <ProtectedRoute>
            <AppLayout>
              <LogsPage />
            </AppLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/settings"
        element={
          <ProtectedRoute>
            <AppLayout>
              <SettingsPage />
            </AppLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/journey"
        element={
          <ProtectedRoute>
            <AppLayout>
              <JourneyPage />
            </AppLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/supervisor"
        element={
          <ProtectedRoute>
            <AppLayout>
              <SupervisorPage />
            </AppLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/consent"
        element={
          <ProtectedRoute>
            <AppLayout>
              <ConsentPage />
            </AppLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/api-docs"
        element={
          <ProtectedRoute>
            <ApiDocsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/database"
        element={
          <ProtectedRoute>
            <AppLayout>
              <AdminDatabasePage />
            </AppLayout>
          </ProtectedRoute>
        }
      />
    </Routes>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <CurrentUserProvider>
        <Router>
          <AppRoutes />
        </Router>
      </CurrentUserProvider>
    </AuthProvider>
  );
}
