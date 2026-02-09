import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { funnelData } from '@/data/dashboard';

const COLORS = ['#3b82f6', '#6366f1', '#8b5cf6', '#a855f7', '#c084fc'];

export default function FunnelChart() {
  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-6">Funil de Cobrança</h3>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={funnelData} layout="vertical">
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis type="number" stroke="#9ca3af" />
          <YAxis dataKey="stage" type="category" stroke="#9ca3af" width={100} />
          <Tooltip 
            contentStyle={{ 
              backgroundColor: 'rgba(255, 255, 255, 0.95)', 
              border: '1px solid #e5e7eb',
              borderRadius: '8px',
              boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
            }}
            formatter={(value?: number, name?: string) => {
              if (!value) return ['0', 'Quantidade'];
              if (name === 'value') return [value.toLocaleString('pt-BR'), 'Quantidade'];
              return [value, name || ''];
            }}
          />
          <Bar dataKey="value" radius={[0, 8, 8, 0]}>
            {funnelData.map((_entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
      <div className="mt-4 grid grid-cols-5 gap-2">
        {funnelData.map((item, index) => (
          <div key={item.stage} className="text-center">
            <div className="text-xs font-medium text-gray-600">{item.stage}</div>
            <div className="text-sm font-bold" style={{ color: COLORS[index] }}>
              {(item.rate * 100).toFixed(0)}%
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}