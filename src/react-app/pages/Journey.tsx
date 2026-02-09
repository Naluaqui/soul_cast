import { useState } from 'react';
import { Plus, Play, Pause, Settings, ChevronRight, MessageSquare, Phone, Mail, Clock, AlertTriangle, Trash2, Loader2, X, Save } from 'lucide-react';
import { useJourneys, Journey, JourneyStep } from '@/react-app/hooks/useJourneys';

export default function JourneyPage() {
  const { journeys, loading, toggleJourneyStatus, createJourney, updateJourney, deleteJourney } = useJourneys();
  const [showEditor, setShowEditor] = useState(false);
  const [editingJourney, setEditingJourney] = useState<Journey | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    steps: [] as JourneyStep[],
  });

  const getChannelIcon = (channel: string) => {
    switch (channel) {
      case 'whatsapp': return <MessageSquare className="w-4 h-4 text-green-600" />;
      case 'phone': return <Phone className="w-4 h-4 text-blue-600" />;
      case 'email': return <Mail className="w-4 h-4 text-purple-600" />;
      case 'sms': return <MessageSquare className="w-4 h-4 text-orange-600" />;
      default: return <MessageSquare className="w-4 h-4 text-gray-600" />;
    }
  };

  const handleToggleStatus = async (id: number) => {
    try {
      await toggleJourneyStatus(id);
    } catch (err) {
      console.error('Failed to toggle status:', err);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Tem certeza que deseja excluir esta régua?')) return;
    try {
      await deleteJourney(id);
    } catch (err) {
      console.error('Failed to delete journey:', err);
    }
  };

  const openEditor = (journey?: Journey) => {
    if (journey) {
      setEditingJourney(journey);
      setFormData({
        name: journey.name,
        description: journey.description || '',
        steps: journey.steps.map(s => ({
          ...s,
          day_offset: s.day_offset,
          channel: s.channel,
          action_type: s.action_type,
          action_title: s.action_title,
        })),
      });
    } else {
      setEditingJourney(null);
      setFormData({
        name: '',
        description: '',
        steps: [{ step_order: 1, day_offset: 1, channel: 'whatsapp', action_type: 'message', action_title: '' }],
      });
    }
    setShowEditor(true);
  };

  const addStep = () => {
    const lastStep = formData.steps[formData.steps.length - 1];
    setFormData({
      ...formData,
      steps: [
        ...formData.steps,
        {
          step_order: formData.steps.length + 1,
          day_offset: lastStep ? lastStep.day_offset + 3 : 1,
          channel: 'whatsapp',
          action_type: 'message',
          action_title: '',
        },
      ],
    });
  };

  const removeStep = (index: number) => {
    setFormData({
      ...formData,
      steps: formData.steps.filter((_, i) => i !== index).map((s, i) => ({ ...s, step_order: i + 1 })),
    });
  };

  const updateStep = (index: number, updates: Partial<JourneyStep>) => {
    setFormData({
      ...formData,
      steps: formData.steps.map((s, i) => (i === index ? { ...s, ...updates } : s)),
    });
  };

  const handleSave = async () => {
    try {
      if (editingJourney) {
        await updateJourney(editingJourney.id, formData);
      } else {
        await createJourney({ ...formData, status: 'draft' });
      }
      setShowEditor(false);
    } catch (err) {
      console.error('Failed to save journey:', err);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-8 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Régua de Comunicação</h1>
          <p className="text-gray-500 mt-1">Configure jornadas automatizadas de cobrança</p>
        </div>
        <button
          onClick={() => openEditor()}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Nova Régua
        </button>
      </div>

      {/* Info Banner */}
      <div className="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-xl p-4 mb-8">
        <div className="flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-blue-600 mt-0.5" />
          <div>
            <p className="font-medium text-blue-900">Réguas seguem políticas LGPD</p>
            <p className="text-sm text-blue-700 mt-1">
              Todas as comunicações respeitam horários permitidos (8h-20h), consentimento do cliente e limites de frequência.
            </p>
          </div>
        </div>
      </div>

      {/* Journeys List */}
      {journeys.length === 0 ? (
        <div className="bg-white rounded-xl border-2 border-dashed border-gray-300 p-12 text-center">
          <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
            <Plus className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Nenhuma Régua Configurada</h3>
          <p className="text-gray-500 max-w-md mx-auto mb-4">
            Crie sua primeira régua de comunicação para automatizar a cobrança.
          </p>
          <button
            onClick={() => openEditor()}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Criar Régua
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {journeys.map((journey) => (
            <div
              key={journey.id}
              className="bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-md transition-all"
            >
              <div className="p-5">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-1">
                      <h3 className="font-semibold text-gray-900">{journey.name}</h3>
                      <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                        journey.status === 'active' 
                          ? 'bg-green-100 text-green-700' 
                          : journey.status === 'paused'
                          ? 'bg-yellow-100 text-yellow-700'
                          : 'bg-gray-100 text-gray-600'
                      }`}>
                        {journey.status === 'active' ? 'Ativa' : journey.status === 'paused' ? 'Pausada' : 'Rascunho'}
                      </span>
                    </div>
                    <p className="text-sm text-gray-500">{journey.description}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    {journey.status === 'active' ? (
                      <button 
                        onClick={() => handleToggleStatus(journey.id)}
                        className="p-2 text-yellow-600 hover:bg-yellow-50 rounded-lg transition-colors" 
                        title="Pausar"
                      >
                        <Pause className="w-5 h-5" />
                      </button>
                    ) : (
                      <button 
                        onClick={() => handleToggleStatus(journey.id)}
                        className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors" 
                        title="Ativar"
                      >
                        <Play className="w-5 h-5" />
                      </button>
                    )}
                    <button 
                      onClick={() => openEditor(journey)}
                      className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg transition-colors" 
                      title="Configurar"
                    >
                      <Settings className="w-5 h-5" />
                    </button>
                    <button 
                      onClick={() => handleDelete(journey.id)}
                      className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors" 
                      title="Excluir"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                </div>

                {/* Stats */}
                <div className="flex gap-6 mb-4">
                  <div>
                    <p className="text-xs text-gray-500">Casos Ativos</p>
                    <p className="text-lg font-bold text-gray-900">{journey.cases_active}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Taxa de Conversão</p>
                    <p className="text-lg font-bold text-green-600">{journey.conversion_rate}%</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Etapas</p>
                    <p className="text-lg font-bold text-gray-900">{journey.steps?.length || 0}</p>
                  </div>
                </div>

                {/* Timeline Preview */}
                {journey.steps && journey.steps.length > 0 && (
                  <div className="bg-gray-50 rounded-lg p-4">
                    <p className="text-xs font-medium text-gray-500 mb-3">Fluxo da Régua</p>
                    <div className="flex items-center gap-2 overflow-x-auto pb-2">
                      {journey.steps.map((step, index) => (
                        <div key={index} className="flex items-center">
                          <div className="flex items-center gap-2 px-3 py-2 bg-white border border-gray-200 rounded-lg whitespace-nowrap">
                            <div className="flex items-center gap-1.5">
                              <Clock className="w-3.5 h-3.5 text-gray-400" />
                              <span className="text-xs font-medium text-gray-600">D+{step.day_offset}</span>
                            </div>
                            <div className="w-px h-4 bg-gray-200" />
                            {getChannelIcon(step.channel)}
                            <span className="text-xs text-gray-700">{step.action_title}</span>
                          </div>
                          {index < journey.steps.length - 1 && (
                            <ChevronRight className="w-4 h-4 text-gray-300 mx-1 flex-shrink-0" />
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="px-5 py-3 bg-gray-50 border-t border-gray-100 flex justify-between items-center">
                <span className="text-xs text-gray-500">ID: JRN-{String(journey.id).padStart(3, '0')}</span>
                <button 
                  onClick={() => openEditor(journey)}
                  className="text-sm text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1"
                >
                  Editar Régua
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Editor Modal */}
      {showEditor && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
            <div className="p-6 border-b border-gray-200 flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900">
                {editingJourney ? 'Editar Régua' : 'Nova Régua de Comunicação'}
              </h2>
              <button onClick={() => setShowEditor(false)} className="p-2 hover:bg-gray-100 rounded-lg">
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto flex-1 space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Nome da Régua</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Ex: Régua Padrão - Primeiro Atraso"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Descrição</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  rows={2}
                  placeholder="Descreva quando esta régua deve ser aplicada"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-4">
                  <label className="block text-sm font-medium text-gray-700">Etapas da Régua</label>
                  <button
                    onClick={addStep}
                    className="text-sm text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1"
                  >
                    <Plus className="w-4 h-4" />
                    Adicionar Etapa
                  </button>
                </div>

                <div className="space-y-3">
                  {formData.steps.map((step, index) => (
                    <div key={index} className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-medium text-gray-500">D+</span>
                        <input
                          type="number"
                          value={step.day_offset}
                          onChange={(e) => updateStep(index, { day_offset: parseInt(e.target.value) || 0 })}
                          className="w-16 px-2 py-1.5 border border-gray-300 rounded-lg text-sm"
                          min="0"
                        />
                      </div>
                      <select
                        value={step.channel}
                        onChange={(e) => updateStep(index, { channel: e.target.value })}
                        className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm"
                      >
                        <option value="whatsapp">WhatsApp</option>
                        <option value="sms">SMS</option>
                        <option value="email">Email</option>
                        <option value="phone">Ligação</option>
                      </select>
                      <input
                        type="text"
                        value={step.action_title}
                        onChange={(e) => updateStep(index, { action_title: e.target.value })}
                        className="flex-1 px-3 py-1.5 border border-gray-300 rounded-lg text-sm"
                        placeholder="Descrição da ação"
                      />
                      <button
                        onClick={() => removeStep(index)}
                        className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg"
                        disabled={formData.steps.length === 1}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-gray-200 flex justify-end gap-3">
              <button
                onClick={() => setShowEditor(false)}
                className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleSave}
                disabled={!formData.name || formData.steps.length === 0}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Save className="w-4 h-4" />
                {editingJourney ? 'Salvar Alterações' : 'Criar Régua'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
