import { LucideIcon } from 'lucide-react';

interface KPICardProps {
  title: string;
  value: string;
  subtitle?: string;
  icon: LucideIcon;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  color: 'blue' | 'green' | 'purple' | 'orange' | 'red' | 'indigo';
}

const colorClasses = {
  blue: 'from-blue-500/10 to-blue-600/10 border-blue-500/20',
  green: 'from-green-500/10 to-green-600/10 border-green-500/20',
  purple: 'from-purple-500/10 to-purple-600/10 border-purple-500/20',
  orange: 'from-orange-500/10 to-orange-600/10 border-orange-500/20',
  red: 'from-red-500/10 to-red-600/10 border-red-500/20',
  indigo: 'from-indigo-500/10 to-indigo-600/10 border-indigo-500/20'
};

const iconColorClasses = {
  blue: 'text-blue-600 bg-blue-500/10',
  green: 'text-green-600 bg-green-500/10',
  purple: 'text-purple-600 bg-purple-500/10',
  orange: 'text-orange-600 bg-orange-500/10',
  red: 'text-red-600 bg-red-500/10',
  indigo: 'text-indigo-600 bg-indigo-500/10'
};

export default function KPICard({ title, value, subtitle, icon: Icon, trend, color }: KPICardProps) {
  return (
    <div className={`relative overflow-hidden rounded-xl border bg-gradient-to-br ${colorClasses[color]} backdrop-blur-sm transition-all hover:shadow-lg hover:scale-[1.02]`}>
      <div className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className={`p-3 rounded-lg ${iconColorClasses[color]}`}>
            <Icon className="w-5 h-5" />
          </div>
          {trend && (
            <div className={`flex items-center gap-1 text-sm font-medium ${trend.isPositive ? 'text-green-600' : 'text-red-600'}`}>
              <span>{trend.isPositive ? '↑' : '↓'}</span>
              <span>{Math.abs(trend.value)}%</span>
            </div>
          )}
        </div>
        <div>
          <p className="text-sm font-medium text-gray-600 mb-1">{title}</p>
          <p className="text-2xl font-bold text-gray-900">{value}</p>
          {subtitle && <p className="text-xs text-gray-500 mt-1">{subtitle}</p>}
        </div>
      </div>
    </div>
  );
}