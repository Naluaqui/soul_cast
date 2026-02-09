import { useState, useEffect } from 'react';
import { Save, Building, Bell, Shield, Clock, Palette, Mail, MessageSquare, Loader2, Check } from 'lucide-react';

interface Settings {
  general: {
    company_name: string;
    cnpj: string;
    language: string;
    timezone: string;
    logo_url: string;
  };
  notifications: {
    email_notifications: string;
    push_notifications: string;
    case_alerts: string;
    security_alerts: string;
  };
  security: {
    session_timeout: string;
    login_attempts: string;
    require_2fa: string;
    audit_logging: string;
  };
  schedule: {
    operation_start: string;
    operation_end: string;
    operation_days: string;
  };
  appearance: {
    theme: string;
    primary_color: string;
    compact_mode: string;
  };
}

const defaultSettings: Settings = {
  general: {
    company_name: 'Soul Collect Cobrança',
    cnpj: '12.345.678/0001-90',
    language: 'pt-BR',
    timezone: 'America/Sao_Paulo',
    logo_url: ''
  },
  notifications: {
    email_notifications: 'true',
    push_notifications: 'true',
    case_alerts: 'true',
    security_alerts: 'true'
  },
  security: {
    session_timeout: '30',
    login_attempts: '5',
    require_2fa: 'false',
    audit_logging: 'true'
  },
  schedule: {
    operation_start: '08:00',
    operation_end: '20:00',
    operation_days: 'mon,tue,wed,thu,fri'
  },
  appearance: {
    theme: 'light',
    primary_color: '#3B82F6',
    compact_mode: 'false'
  }
};

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState('general');
  const [settings, setSettings] = useState<Settings>(defaultSettings);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const tabs = [
    { id: 'general', label: 'Geral', icon: Building },
    { id: 'notifications', label: 'Notificações', icon: Bell },
    { id: 'security', label: 'Segurança', icon: Shield },
    { id: 'schedule', label: 'Horários', icon: Clock },
    { id: 'appearance', label: 'Aparência', icon: Palette },
  ];

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const res = await fetch('/api/settings', { credentials: 'include' });
      if (res.ok) {
        const data = await res.json();
        setSettings({
          general: { ...defaultSettings.general, ...data.general },
          notifications: { ...defaultSettings.notifications, ...data.notifications },
          security: { ...defaultSettings.security, ...data.security },
          schedule: { ...defaultSettings.schedule, ...data.schedule },
          appearance: { ...defaultSettings.appearance, ...data.appearance }
        });
      }
    } catch (err) {
      console.error('Error fetching settings:', err);
    } finally {
      setLoading(false);
    }
  };

  const saveSettings = async (group: keyof Settings) => {
    setSaving(true);
    setSaved(false);
    try {
      const res = await fetch(`/api/settings/${group}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(settings[group])
      });
      
      if (res.ok) {
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
      } else {
        alert('Erro ao salvar configurações');
      }
    } catch (err) {
      console.error('Error saving settings:', err);
      alert('Erro ao salvar configurações');
    } finally {
      setSaving(false);
    }
  };

  const updateSetting = (group: keyof Settings, key: string, value: string) => {
    setSettings(prev => ({
      ...prev,
      [group]: {
        ...prev[group],
        [key]: value
      }
    }));
  };

  const toggleBooleanSetting = (group: keyof Settings, key: string) => {
    const currentValue = (settings[group] as any)[key];
    updateSetting(group, key, currentValue === 'true' ? 'false' : 'true');
  };

  const toggleDay = (day: string) => {
    const days = settings.schedule.operation_days.split(',').filter(d => d);
    if (days.includes(day)) {
      updateSetting('schedule', 'operation_days', days.filter(d => d !== day).join(','));
    } else {
      updateSetting('schedule', 'operation_days', [...days, day].join(','));
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-8 max-w-5xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Configurações</h1>
        <p className="text-gray-500 mt-1">Gerencie as configurações do sistema</p>
      </div>

      <div className="flex gap-8">
        {/* Sidebar */}
        <div className="w-56 flex-shrink-0">
          <nav className="space-y-1">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                    activeTab === tab.id
                      ? 'bg-blue-50 text-blue-700'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  {tab.label}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Content */}
        <div className="flex-1">
          {activeTab === 'general' && (
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-6">Configurações Gerais</h2>
              
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Nome da Empresa</label>
                  <input
                    type="text"
                    value={settings.general.company_name}
                    onChange={(e) => updateSetting('general', 'company_name', e.target.value)}
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">CNPJ</label>
                  <input
                    type="text"
                    value={settings.general.cnpj}
                    onChange={(e) => updateSetting('general', 'cnpj', e.target.value)}
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Idioma Padrão</label>
                  <select 
                    value={settings.general.language}
                    onChange={(e) => updateSetting('general', 'language', e.target.value)}
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="pt-BR">Português (Brasil)</option>
                    <option value="en">English</option>
                    <option value="es">Español</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Fuso Horário</label>
                  <select 
                    value={settings.general.timezone}
                    onChange={(e) => updateSetting('general', 'timezone', e.target.value)}
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="America/Sao_Paulo">America/Sao_Paulo (GMT-3)</option>
                    <option value="America/Manaus">America/Manaus (GMT-4)</option>
                    <option value="America/Fortaleza">America/Fortaleza (GMT-3)</option>
                    <option value="America/Belem">America/Belem (GMT-3)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Logo da Empresa</label>
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                      <span className="text-white font-bold text-2xl">S</span>
                    </div>
                    <button className="px-4 py-2 text-sm text-blue-600 border border-blue-200 rounded-lg hover:bg-blue-50">
                      Alterar Logo
                    </button>
                  </div>
                </div>
              </div>

              <div className="mt-8 pt-6 border-t border-gray-200 flex justify-end items-center gap-3">
                {saved && (
                  <span className="flex items-center gap-1 text-green-600 text-sm">
                    <Check className="w-4 h-4" />
                    Salvo com sucesso!
                  </span>
                )}
                <button 
                  onClick={() => saveSettings('general')}
                  disabled={saving}
                  className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                >
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  Salvar Alterações
                </button>
              </div>
            </div>
          )}

          {activeTab === 'notifications' && (
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-6">Preferências de Notificação</h2>
              
              <div className="space-y-4">
                {[
                  { key: 'email_notifications', icon: Mail, title: 'Notificações por Email', desc: 'Receber resumos diários e alertas críticos' },
                  { key: 'push_notifications', icon: MessageSquare, title: 'Notificações Push', desc: 'Alertas em tempo real no navegador' },
                  { key: 'case_alerts', icon: Bell, title: 'Alertas de Casos', desc: 'Novos casos, pagamentos e vencimentos' },
                  { key: 'security_alerts', icon: Shield, title: 'Alertas de Segurança', desc: 'Tentativas de login e acessos suspeitos' },
                ].map((item) => (
                  <div key={item.key} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <item.icon className="w-5 h-5 text-gray-500" />
                      <div>
                        <p className="font-medium text-gray-900">{item.title}</p>
                        <p className="text-sm text-gray-500">{item.desc}</p>
                      </div>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input 
                        type="checkbox" 
                        checked={(settings.notifications as any)[item.key] === 'true'}
                        onChange={() => toggleBooleanSetting('notifications', item.key)}
                        className="sr-only peer" 
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-100 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>
                ))}
              </div>

              <div className="mt-8 pt-6 border-t border-gray-200 flex justify-end items-center gap-3">
                {saved && (
                  <span className="flex items-center gap-1 text-green-600 text-sm">
                    <Check className="w-4 h-4" />
                    Salvo com sucesso!
                  </span>
                )}
                <button 
                  onClick={() => saveSettings('notifications')}
                  disabled={saving}
                  className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                >
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  Salvar Preferências
                </button>
              </div>
            </div>
          )}

          {activeTab === 'security' && (
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-6">Configurações de Segurança</h2>
              
              <div className="space-y-6">
                <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Shield className="w-5 h-5 text-green-600" />
                    <span className="font-medium text-green-800">LGPD Compliance Ativo</span>
                  </div>
                  <p className="text-sm text-green-700">Todas as comunicações seguem as diretrizes da LGPD</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Tempo de Sessão (minutos)</label>
                  <input
                    type="number"
                    value={settings.security.session_timeout}
                    onChange={(e) => updateSetting('security', 'session_timeout', e.target.value)}
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Tentativas de Login</label>
                  <input
                    type="number"
                    value={settings.security.login_attempts}
                    onChange={(e) => updateSetting('security', 'login_attempts', e.target.value)}
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <p className="text-xs text-gray-500 mt-1">Bloquear conta após este número de tentativas falhas</p>
                </div>

                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium text-gray-900">Autenticação em Dois Fatores</p>
                    <p className="text-sm text-gray-500">Exigir 2FA para todos os usuários</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input 
                      type="checkbox" 
                      checked={settings.security.require_2fa === 'true'}
                      onChange={() => toggleBooleanSetting('security', 'require_2fa')}
                      className="sr-only peer" 
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-100 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>

                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium text-gray-900">Logs de Auditoria</p>
                    <p className="text-sm text-gray-500">Registrar todas as ações do sistema</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input 
                      type="checkbox" 
                      checked={settings.security.audit_logging === 'true'}
                      onChange={() => toggleBooleanSetting('security', 'audit_logging')}
                      className="sr-only peer" 
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-100 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>
              </div>

              <div className="mt-8 pt-6 border-t border-gray-200 flex justify-end items-center gap-3">
                {saved && (
                  <span className="flex items-center gap-1 text-green-600 text-sm">
                    <Check className="w-4 h-4" />
                    Salvo com sucesso!
                  </span>
                )}
                <button 
                  onClick={() => saveSettings('security')}
                  disabled={saving}
                  className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                >
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  Salvar Configurações
                </button>
              </div>
            </div>
          )}

          {activeTab === 'schedule' && (
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-6">Horários de Operação</h2>
              
              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Horário Início</label>
                    <input
                      type="time"
                      value={settings.schedule.operation_start}
                      onChange={(e) => updateSetting('schedule', 'operation_start', e.target.value)}
                      className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Horário Fim</label>
                    <input
                      type="time"
                      value={settings.schedule.operation_end}
                      onChange={(e) => updateSetting('schedule', 'operation_end', e.target.value)}
                      className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <p className="text-sm text-gray-500">Mensagens automáticas só serão enviadas dentro deste horário (LGPD)</p>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Dias de Operação</label>
                  <div className="flex gap-2">
                    {[
                      { id: 'mon', label: 'Seg' },
                      { id: 'tue', label: 'Ter' },
                      { id: 'wed', label: 'Qua' },
                      { id: 'thu', label: 'Qui' },
                      { id: 'fri', label: 'Sex' },
                      { id: 'sat', label: 'Sáb' },
                      { id: 'sun', label: 'Dom' }
                    ].map((day) => {
                      const isActive = settings.schedule.operation_days.includes(day.id);
                      return (
                        <button
                          key={day.id}
                          onClick={() => toggleDay(day.id)}
                          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                            isActive ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                          }`}
                        >
                          {day.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <p className="text-sm text-yellow-800">
                    <strong>Atenção:</strong> Contatos fora do horário comercial podem resultar em multas conforme LGPD e Código de Defesa do Consumidor.
                  </p>
                </div>
              </div>

              <div className="mt-8 pt-6 border-t border-gray-200 flex justify-end items-center gap-3">
                {saved && (
                  <span className="flex items-center gap-1 text-green-600 text-sm">
                    <Check className="w-4 h-4" />
                    Salvo com sucesso!
                  </span>
                )}
                <button 
                  onClick={() => saveSettings('schedule')}
                  disabled={saving}
                  className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                >
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  Salvar Horários
                </button>
              </div>
            </div>
          )}

          {activeTab === 'appearance' && (
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-6">Aparência</h2>
              
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">Tema</label>
                  <div className="flex gap-4">
                    {[
                      { id: 'light', label: 'Claro', preview: 'bg-white' },
                      { id: 'dark', label: 'Escuro', preview: 'bg-gray-800' },
                      { id: 'auto', label: 'Automático', preview: 'bg-gradient-to-r from-white to-gray-800' },
                    ].map((theme) => (
                      <button
                        key={theme.id}
                        onClick={() => updateSetting('appearance', 'theme', theme.id)}
                        className="flex flex-col items-center gap-2"
                      >
                        <div className={`w-24 h-16 rounded-lg ${theme.preview} border-2 ${
                          settings.appearance.theme === theme.id ? 'border-blue-500' : 'border-gray-200'
                        }`}></div>
                        <span className="text-sm text-gray-700">{theme.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">Cor Principal</label>
                  <div className="flex gap-3">
                    {['#3B82F6', '#8B5CF6', '#10B981', '#F59E0B', '#EF4444'].map((color) => (
                      <button
                        key={color}
                        onClick={() => updateSetting('appearance', 'primary_color', color)}
                        className={`w-10 h-10 rounded-full border-2 transition-transform ${
                          settings.appearance.primary_color === color ? 'border-gray-900 scale-110' : 'border-transparent'
                        }`}
                        style={{ backgroundColor: color }}
                      />
                    ))}
                  </div>
                </div>

                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium text-gray-900">Modo Compacto</p>
                    <p className="text-sm text-gray-500">Reduzir espaçamentos e tamanhos</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input 
                      type="checkbox" 
                      checked={settings.appearance.compact_mode === 'true'}
                      onChange={() => toggleBooleanSetting('appearance', 'compact_mode')}
                      className="sr-only peer" 
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-100 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>
              </div>

              <div className="mt-8 pt-6 border-t border-gray-200 flex justify-end items-center gap-3">
                {saved && (
                  <span className="flex items-center gap-1 text-green-600 text-sm">
                    <Check className="w-4 h-4" />
                    Salvo com sucesso!
                  </span>
                )}
                <button 
                  onClick={() => saveSettings('appearance')}
                  disabled={saving}
                  className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                >
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  Salvar Aparência
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
