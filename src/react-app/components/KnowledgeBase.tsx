import { useState } from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { 
  Search, 
  Plus, 
  FileText, 
  Tag, 
  Calendar,
  Edit,
  Trash2,
  Eye,
  ChevronDown,
  ChevronUp,
  Filter
} from 'lucide-react';
import { Document, mockDocuments, documentCategories } from '@/data/knowledgeBase';

export default function KnowledgeBase() {
  const [documents] = useState<Document[]>(mockDocuments);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [expandedDoc, setExpandedDoc] = useState<string | null>(null);
  const [viewingDoc, setViewingDoc] = useState<Document | null>(null);

  const filteredDocuments = documents.filter(doc => {
    const matchesSearch = doc.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          doc.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          doc.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesCategory = selectedCategory === 'all' || doc.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const getCategoryStyle = (category: string) => {
    return documentCategories[category as keyof typeof documentCategories] || 
           { label: category, color: 'bg-gray-100 text-gray-700' };
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden h-full flex flex-col">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-100 bg-gray-50">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-semibold text-gray-900">Base de Conhecimento (RAG)</h3>
            <p className="text-sm text-gray-500">{documents.length} documentos indexados</p>
          </div>
          <button className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-sm font-medium">
            <Plus className="w-4 h-4" />
            Novo Documento
          </button>
        </div>
        
        {/* Search and Filters */}
        <div className="flex gap-3">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar documentos..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 text-sm"
            />
          </div>
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="pl-10 pr-8 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 text-sm appearance-none bg-white"
            >
              <option value="all">Todas Categorias</option>
              {Object.entries(documentCategories).map(([key, { label }]) => (
                <option key={key} value={key}>{label}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Documents List */}
      <div className="flex-1 overflow-y-auto p-4">
        <div className="space-y-3">
          {filteredDocuments.map((doc) => (
            <div 
              key={doc.id}
              className="border border-gray-200 rounded-lg overflow-hidden hover:border-purple-200 transition-colors"
            >
              <div 
                className="p-4 cursor-pointer"
                onClick={() => setExpandedDoc(expandedDoc === doc.id ? null : doc.id)}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getCategoryStyle(doc.category).color}`}>
                        {getCategoryStyle(doc.category).label}
                      </span>
                      {doc.status === 'draft' && (
                        <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-700">
                          Rascunho
                        </span>
                      )}
                      <span className="text-xs text-gray-400">v{doc.version}</span>
                    </div>
                    <h4 className="font-medium text-gray-900 truncate">{doc.title}</h4>
                    <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5" />
                        Atualizado em {format(doc.updatedAt, 'dd/MM/yyyy')}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {expandedDoc === doc.id ? (
                      <ChevronUp className="w-5 h-5 text-gray-400" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-gray-400" />
                    )}
                  </div>
                </div>
                
                {/* Tags */}
                <div className="flex flex-wrap gap-1 mt-3">
                  {doc.tags.slice(0, 4).map((tag, i) => (
                    <span key={i} className="flex items-center gap-1 text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded">
                      <Tag className="w-3 h-3" />
                      {tag}
                    </span>
                  ))}
                  {doc.tags.length > 4 && (
                    <span className="text-xs text-gray-500">+{doc.tags.length - 4}</span>
                  )}
                </div>
              </div>
              
              {/* Expanded Content */}
              {expandedDoc === doc.id && (
                <div className="px-4 pb-4 border-t border-gray-100">
                  <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                    <pre className="text-sm text-gray-700 whitespace-pre-wrap font-sans">
                      {doc.content.substring(0, 500)}
                      {doc.content.length > 500 && '...'}
                    </pre>
                  </div>
                  <div className="flex gap-2 mt-4">
                    <button 
                      onClick={() => setViewingDoc(doc)}
                      className="flex items-center gap-2 px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                      <Eye className="w-4 h-4" />
                      Ver Completo
                    </button>
                    <button className="flex items-center gap-2 px-3 py-1.5 text-sm text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                      <Edit className="w-4 h-4" />
                      Editar
                    </button>
                    <button className="flex items-center gap-2 px-3 py-1.5 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                      <Trash2 className="w-4 h-4" />
                      Excluir
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}

          {filteredDocuments.length === 0 && (
            <div className="text-center py-12">
              <FileText className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">Nenhum documento encontrado</p>
              <p className="text-sm text-gray-400 mt-1">Tente ajustar os filtros ou criar um novo documento</p>
            </div>
          )}
        </div>
      </div>

      {/* Document Viewer Modal */}
      {viewingDoc && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-3xl max-h-[90vh] overflow-hidden shadow-2xl flex flex-col">
            <div className="px-6 py-4 border-b border-gray-100 bg-gray-50 flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-gray-900">{viewingDoc.title}</h3>
                <p className="text-sm text-gray-500">Versão {viewingDoc.version} • Atualizado em {format(viewingDoc.updatedAt, 'dd/MM/yyyy', { locale: ptBR })}</p>
              </div>
              <button 
                onClick={() => setViewingDoc(null)}
                className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
              >
                ✕
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-6">
              <div className="prose prose-sm max-w-none">
                <pre className="whitespace-pre-wrap font-sans text-gray-700 leading-relaxed">
                  {viewingDoc.content}
                </pre>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
