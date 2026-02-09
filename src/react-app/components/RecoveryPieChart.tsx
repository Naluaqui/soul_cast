import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { recoveryByPeriod } from '@/data/dashboard';

const COLORS = ['#3b82f6', '#6366f1', '#8b5cf6', '#a855f7', '#c084fc'];

export default function RecoveryPieChart() {
  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-6">Recuperação por Período</h3>
      <ResponsiveContainer width="100%" height={300}>
        <PieChart>
          <Pie
            data={recoveryByPeriod}
            cx="50%"
            cy="50%"
            labelLine={false}
            outerRadius={100}
            fill="#8884d8"
            dataKey="amount"
            nameKey="period"
          >
            {recoveryByPeriod.map((_entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip 
            contentStyle={{ 
              backgroundColor: 'rgba(255, 255, 255, 0.95)', 
              border: '1px solid #e5e7eb',
              borderRadius: '8px',
              boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
            }}
            formatter={(value?: number) => value ? `R$ ${value.toLocaleString('pt-BR')}` : 'R$ 0'}
          />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
      <div className="mt-4 grid grid-cols-5 gap-2">
        {recoveryByPeriod.map((item, index) => (
          <div key={item.period} className="text-center">
            <div className="text-xs font-medium text-gray-600">{item.period}</div>
            <div className="text-sm font-bold" style={{ color: COLORS[index] }}>
              {item.percentage.toFixed(1)}%
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}