import { useState } from 'react';
import { Search, Filter, X, ChevronDown } from 'lucide-react';
import { CaseStatus, Channel, caseStatusLabels, channelLabels, operators, contractTypes } from '@/data/cases';

export interface FilterState {
  search: string;
  status: CaseStatus | '';
  channel: Channel | '';
  operator: string;
  contractType: string;
  daysOverdueMin: string;
  daysOverdueMax: string;
  valueMin: string;
  valueMax: string;
  hasConsent: string;
}

interface CaseFiltersProps {
  filters: FilterState;
  onFilterChange: (filters: FilterState) => void;
  onClearFilters: () => void;
  resultCount: number;
}

export default function CaseFilters({ filters, onFilterChange, onClearFilters, resultCount }: CaseFiltersProps) {
  const [showAdvanced, setShowAdvanced] = useState(false);

  const updateFilter = (key: keyof FilterState, value: string) => {
    onFilterChange({ ...filters, [key]: value });
  };

  const hasActiveFilters = Object.entries(filters).some(([key, value]) => {
    if (key === 'search') return false;
    return value !== '';
  });

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4 mb-6">
      {/* Search Bar */}
      <div className="flex items-center gap-4 mb-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar por nome, CPF/CNPJ, contrato ou ID do caso..."
            value={filters.search}
            onChange={(e) => updateFilter('search', e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
          />
        </div>
        <button
          onClick={() => setShowAdvanced(!showAdvanced)}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-lg border transition-all ${
            showAdvanced || hasActiveFilters
              ? 'bg-blue-50 border-blue-200 text-blue-700'
              : 'border-gray-200 text-gray-700 hover:bg-gray-50'
          }`}
        >
          <Filter className="w-4 h-4" />
          <span>Filtros</span>
          {hasActiveFilters && (
            <span className="bg-blue-600 text-white text-xs px-1.5 py-0.5 rounded-full">
              {Object.values(filters).filter((v, i) => i > 0 && v !== '').length}
            </span>
          )}
          <ChevronDown className={`w-4 h-4 transition-transform ${showAdvanced ? 'rotate-180' : ''}`} />
        </button>
      </div>

      {/* Advanced Filters */}
      {showAdvanced && (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4 pt-4 border-t border-gray-100">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1.5">Status</label>
            <select
              value={filters.status}
              onChange={(e) => updateFilter('status', e.target.value)}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Todos</option>
              {Object.entries(caseStatusLabels).map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1.5">Canal</label>
            <select
              value={filters.channel}
              onChange={(e) => updateFilter('channel', e.target.value)}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Todos</option>
              {Object.entries(channelLabels).map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1.5">Operador</label>
            <select
              value={filters.operator}
              onChange={(e) => updateFilter('operator', e.target.value)}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Todos</option>
              {operators.map((op) => (
                <option key={op.id} value={op.name}>{op.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1.5">Tipo de Contrato</label>
            <select
              value={filters.contractType}
              onChange={(e) => updateFilter('contractType', e.target.value)}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Todos</option>
              {contractTypes.map((type) => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1.5">Consentimento</label>
            <select
              value={filters.hasConsent}
              onChange={(e) => updateFilter('hasConsent', e.target.value)}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Todos</option>
              <option value="true">Com Consentimento</option>
              <option value="false">Sem Consentimento</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1.5">Dias Atraso (min)</label>
            <input
              type="number"
              value={filters.daysOverdueMin}
              onChange={(e) => updateFilter('daysOverdueMin', e.target.value)}
              placeholder="0"
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1.5">Dias Atraso (max)</label>
            <input
              type="number"
              value={filters.daysOverdueMax}
              onChange={(e) => updateFilter('daysOverdueMax', e.target.value)}
              placeholder="999"
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1.5">Valor (min)</label>
            <input
              type="number"
              value={filters.valueMin}
              onChange={(e) => updateFilter('valueMin', e.target.value)}
              placeholder="R$ 0"
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1.5">Valor (max)</label>
            <input
              type="number"
              value={filters.valueMax}
              onChange={(e) => updateFilter('valueMax', e.target.value)}
              placeholder="R$ 999.999"
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="flex items-end">
            <button
              onClick={onClearFilters}
              className="flex items-center gap-2 px-4 py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="w-4 h-4" />
              Limpar Filtros
            </button>
          </div>
        </div>
      )}

      {/* Results Count */}
      <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-100">
        <p className="text-sm text-gray-600">
          <span className="font-semibold text-gray-900">{resultCount}</span> casos encontrados
        </p>
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-500">Ordenar por:</span>
          <select className="text-sm border-0 bg-transparent font-medium text-gray-700 focus:ring-0 cursor-pointer">
            <option>Dias em Atraso (maior)</option>
            <option>Dias em Atraso (menor)</option>
            <option>Valor (maior)</option>
            <option>Valor (menor)</option>
            <option>Próxima Ação</option>
            <option>Score de Risco</option>
          </select>
        </div>
      </div>
    </div>
  );
}
