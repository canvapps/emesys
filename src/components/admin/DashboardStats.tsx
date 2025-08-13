import { Card, CardContent } from '@/components/ui/card';
import { 
  UsersIcon, 
  EnvelopeIcon, 
  CalendarIcon,
  CheckCircleIcon
} from '@heroicons/react/24/outline';

interface StatsCardProps {
  title: string;
  value: number;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  trend?: {
    value: number;
    isPositive: boolean;
  };
}

const StatsCard = ({ title, value, icon: Icon, color, trend }: StatsCardProps) => (
  <Card className="elegant-card hover:scale-105 transition-transform duration-300">
    <CardContent className="p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          <p className="text-2xl font-bold">{value}</p>
          {trend && (
            <p className={`text-xs mt-1 ${trend.isPositive ? 'text-green-600' : 'text-red-600'}`}>
              {trend.isPositive ? '+' : ''}{trend.value}% dari bulan lalu
            </p>
          )}
        </div>
        <div className={`${color} p-3 rounded-full shadow-lg`}>
          <Icon className="h-6 w-6 text-white" />
        </div>
      </div>
    </CardContent>
  </Card>
);

interface DashboardStatsProps {
  guestStats: {
    total: number;
    attending: number;
    pending: number;
    attendanceRate: number;
  };
  eventCount: number;
  invitationCount: number;
}

export const DashboardStats = ({ guestStats, eventCount, invitationCount }: DashboardStatsProps) => {
  const stats = [
    { 
      title: 'Total Tamu', 
      value: guestStats.total, 
      icon: UsersIcon, 
      color: 'bg-blue-500',
      trend: { value: 12, isPositive: true }
    },
    { 
      title: 'Konfirmasi Hadir', 
      value: guestStats.attending, 
      icon: CheckCircleIcon, 
      color: 'bg-green-500',
      trend: { value: 8, isPositive: true }
    },
    { 
      title: 'Menunggu Konfirmasi', 
      value: guestStats.pending, 
      icon: EnvelopeIcon, 
      color: 'bg-yellow-500',
      trend: { value: -3, isPositive: false }
    },
    { 
      title: 'Total Acara', 
      value: eventCount, 
      icon: CalendarIcon, 
      color: 'bg-purple-500'
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {stats.map((stat, index) => (
        <StatsCard
          key={index}
          title={stat.title}
          value={stat.value}
          icon={stat.icon}
          color={stat.color}
          trend={stat.trend}
        />
      ))}
    </div>
  );
};