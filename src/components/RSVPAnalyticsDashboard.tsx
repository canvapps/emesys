import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { 
  BarChart3, 
  TrendingUp, 
  Users, 
  Calendar,
  Clock,
  Mail,
  Phone,
  Download,
  Filter,
  PieChart,
  Activity,
  CheckCircle,
  XCircle,
  AlertCircle,
  Target,
  Zap,
  Globe
} from 'lucide-react';
import { useEnhancedRSVP, RSVPParticipant } from '@/hooks/useEnhancedRSVP';
import { cn } from '@/lib/utils';

// ================================================================================================
// COMPREHENSIVE RSVP ANALYTICS DASHBOARD - FASE 1 RSVP SYSTEM ENHANCEMENT
// ================================================================================================
// Advanced analytics dan insights untuk RSVP management
// Real-time data visualization, trends analysis, dan actionable insights
// Trinity Protocol compliant dengan comprehensive documentation
// ================================================================================================

interface ChartDataPoint {
  label: string;
  value: number;
  color?: string;
  percentage?: number;
}

interface TimeSeriesData {
  date: string;
  responses: number;
  attending: number;
  notAttending: number;
  maybe: number;
}

interface RSVPTrend {
  period: string;
  totalResponses: number;
  responseRate: number;
  acceptanceRate: number;
  averageGuestCount: number;
}

interface RSVPAnalyticsDashboardProps {
  showDetailedAnalytics?: boolean;
  showTrendAnalysis?: boolean;
  showExportOptions?: boolean;
  dateRange?: 'week' | 'month' | 'all';
  className?: string;
}

export const RSVPAnalyticsDashboard: React.FC<RSVPAnalyticsDashboardProps> = ({
  showDetailedAnalytics = true,
  showTrendAnalysis = true,
  showExportOptions = true,
  dateRange = 'all',
  className
}) => {
  const {
    participants,
    analytics,
    invitations,
    loading,
    refreshAnalytics,
    exportData,
    searchParticipants,
    filterByStatus
  } = useEnhancedRSVP({
    enableAnalytics: true,
    enableRealtime: true
  });

  // ================================================================================================
  // STATE MANAGEMENT
  // ================================================================================================

  const [selectedMetric, setSelectedMetric] = useState<'responses' | 'attendance' | 'guests'>('responses');
  const [filterStatus, setFilterStatus] = useState<'all' | 'attending' | 'not_attending' | 'maybe' | 'pending'>('all');
  const [timeFilter, setTimeFilter] = useState<'24h' | '7d' | '30d' | 'all'>('all');
  const [chartType, setChartType] = useState<'bar' | 'pie' | 'line'>('bar');

  // ================================================================================================
  // DATA PROCESSING & ANALYTICS
  // ================================================================================================

  const processedData = React.useMemo(() => {
    let filteredParticipants = participants;

    // Apply status filter
    if (filterStatus !== 'all') {
      filteredParticipants = filterByStatus(filterStatus as any);
    }

    // Apply time filter
    if (timeFilter !== 'all') {
      const cutoffDate = new Date();
      switch (timeFilter) {
        case '24h':
          cutoffDate.setDate(cutoffDate.getDate() - 1);
          break;
        case '7d':
          cutoffDate.setDate(cutoffDate.getDate() - 7);
          break;
        case '30d':
          cutoffDate.setDate(cutoffDate.getDate() - 30);
          break;
      }
      
      filteredParticipants = filteredParticipants.filter(p => 
        p.rsvp_date && new Date(p.rsvp_date) >= cutoffDate
      );
    }

    return filteredParticipants;
  }, [participants, filterStatus, timeFilter, filterByStatus]);

  const chartData: ChartDataPoint[] = [
    {
      label: 'Attending',
      value: analytics.total_attending,
      color: '#10B981',
      percentage: analytics.total_responded > 0 ? Math.round((analytics.total_attending / analytics.total_responded) * 100) : 0
    },
    {
      label: 'Not Attending',
      value: analytics.total_not_attending,
      color: '#EF4444',
      percentage: analytics.total_responded > 0 ? Math.round((analytics.total_not_attending / analytics.total_responded) * 100) : 0
    },
    {
      label: 'Maybe',
      value: analytics.total_maybe,
      color: '#F59E0B',
      percentage: analytics.total_responded > 0 ? Math.round((analytics.total_maybe / analytics.total_responded) * 100) : 0
    },
    {
      label: 'Pending',
      value: analytics.total_pending,
      color: '#6B7280',
      percentage: analytics.total_invited > 0 ? Math.round((analytics.total_pending / analytics.total_invited) * 100) : 0
    }
  ];

  const timeSeriesData: TimeSeriesData[] = React.useMemo(() => {
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - (6 - i));
      return date.toISOString().split('T')[0];
    });

    return last7Days.map(date => {
      const dayResponses = participants.filter(p => 
        p.rsvp_date && p.rsvp_date.startsWith(date)
      );

      return {
        date,
        responses: dayResponses.length,
        attending: dayResponses.filter(p => p.attendance_status === 'attending').length,
        notAttending: dayResponses.filter(p => p.attendance_status === 'not_attending').length,
        maybe: dayResponses.filter(p => p.attendance_status === 'maybe').length
      };
    });
  }, [participants]);

  // ================================================================================================
  // SUMMARY METRICS CARDS
  // ================================================================================================

  const SummaryMetrics = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Total Responses</p>
              <p className="text-3xl font-bold">{analytics.total_responded}</p>
              <p className="text-sm text-muted-foreground">
                of {analytics.total_invited} invited
              </p>
            </div>
            <div className="p-3 rounded-full bg-blue-100">
              <Users className="h-6 w-6 text-blue-600" />
            </div>
          </div>
          <div className="mt-4">
            <Progress value={analytics.response_rate} className="h-2" />
            <p className="text-sm text-muted-foreground mt-2">
              {analytics.response_rate}% response rate
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Attending</p>
              <p className="text-3xl font-bold text-green-600">{analytics.total_attending}</p>
              <p className="text-sm text-muted-foreground">
                {analytics.total_guests} total guests
              </p>
            </div>
            <div className="p-3 rounded-full bg-green-100">
              <CheckCircle className="h-6 w-6 text-green-600" />
            </div>
          </div>
          <div className="mt-4">
            <Progress value={analytics.acceptance_rate} className="h-2" />
            <p className="text-sm text-muted-foreground mt-2">
              {analytics.acceptance_rate}% acceptance rate
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Recent Activity</p>
              <p className="text-3xl font-bold text-purple-600">{analytics.responses_last_24h}</p>
              <p className="text-sm text-muted-foreground">in last 24 hours</p>
            </div>
            <div className="p-3 rounded-full bg-purple-100">
              <Activity className="h-6 w-6 text-purple-600" />
            </div>
          </div>
          <div className="mt-4">
            <div className="flex justify-between text-sm">
              <span>Last 7 days</span>
              <span className="font-medium">{analytics.responses_last_7d}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Pending Responses</p>
              <p className="text-3xl font-bold text-orange-600">{analytics.total_pending}</p>
              <p className="text-sm text-muted-foreground">awaiting confirmation</p>
            </div>
            <div className="p-3 rounded-full bg-orange-100">
              <Clock className="h-6 w-6 text-orange-600" />
            </div>
          </div>
          <div className="mt-4">
            <div className="flex justify-between text-sm">
              <span>Maybe responses</span>
              <span className="font-medium">{analytics.total_maybe}</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  // ================================================================================================
  // RESPONSE BREAKDOWN CHART
  // ================================================================================================

  const ResponseBreakdownChart = () => (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <PieChart className="h-5 w-5" />
              Response Breakdown
            </CardTitle>
            <CardDescription>
              Distribution of RSVP responses
            </CardDescription>
          </div>
          <Select value={chartType} onValueChange={(value: any) => setChartType(value)}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="bar">Bar Chart</SelectItem>
              <SelectItem value="pie">Pie Chart</SelectItem>
              <SelectItem value="line">Line Chart</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent>
        {chartType === 'bar' && (
          <div className="space-y-4">
            {chartData.map((item, index) => (
              <div key={index} className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div 
                      className="w-3 h-3 rounded-full" 
                      style={{ backgroundColor: item.color }} 
                    />
                    <span className="font-medium">{item.label}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">{item.percentage}%</span>
                    <span className="font-bold">{item.value}</span>
                  </div>
                </div>
                <Progress 
                  value={item.percentage} 
                  className="h-2"
                  style={{ 
                    background: `linear-gradient(to right, ${item.color}20 0%, ${item.color}20 ${item.percentage}%, #f1f5f9 ${item.percentage}%, #f1f5f9 100%)`
                  }}
                />
              </div>
            ))}
          </div>
        )}

        {chartType === 'pie' && (
          <div className="flex items-center justify-center py-8">
            <div className="relative w-64 h-64">
              <svg viewBox="0 0 100 100" className="w-full h-full transform -rotate-90">
                {chartData.map((item, index) => {
                  const total = chartData.reduce((sum, d) => sum + d.value, 0);
                  const percentage = total > 0 ? (item.value / total) * 100 : 0;
                  const offset = chartData
                    .slice(0, index)
                    .reduce((sum, d) => sum + ((d.value / total) * 100), 0);
                  
                  return (
                    <circle
                      key={index}
                      cx="50"
                      cy="50"
                      r="15.915"
                      fill="transparent"
                      stroke={item.color}
                      strokeWidth="8"
                      strokeDasharray={`${percentage} ${100 - percentage}`}
                      strokeDashoffset={-offset}
                      className="transition-all duration-300"
                    />
                  );
                })}
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center">
                  <div className="text-2xl font-bold">{analytics.total_responded}</div>
                  <div className="text-sm text-muted-foreground">Total</div>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-6 border-t">
          {chartData.map((item, index) => (
            <div key={index} className="text-center">
              <div className="flex items-center justify-center gap-2 mb-1">
                <div 
                  className="w-2 h-2 rounded-full" 
                  style={{ backgroundColor: item.color }} 
                />
                <span className="text-sm font-medium">{item.label}</span>
              </div>
              <div className="text-2xl font-bold" style={{ color: item.color }}>
                {item.value}
              </div>
              <div className="text-xs text-muted-foreground">
                {item.percentage}%
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );

  // ================================================================================================
  // TREND ANALYSIS CHART
  // ================================================================================================

  const TrendAnalysisChart = () => (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5" />
          Response Trends (Last 7 Days)
        </CardTitle>
        <CardDescription>
          Daily RSVP response patterns
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="h-64 flex items-end justify-between gap-2">
            {timeSeriesData.map((day, index) => {
              const maxResponses = Math.max(...timeSeriesData.map(d => d.responses), 1);
              const height = (day.responses / maxResponses) * 100;
              
              return (
                <div key={index} className="flex-1 flex flex-col items-center gap-2">
                  <div className="w-full flex flex-col gap-1" style={{ height: '200px' }}>
                    <div className="flex-1 flex flex-col justify-end">
                      <div 
                        className="bg-green-500 rounded-t" 
                        style={{ height: `${(day.attending / (day.responses || 1)) * height}%` }}
                        title={`Attending: ${day.attending}`}
                      />
                      <div 
                        className="bg-red-500" 
                        style={{ height: `${(day.notAttending / (day.responses || 1)) * height}%` }}
                        title={`Not Attending: ${day.notAttending}`}
                      />
                      <div 
                        className="bg-yellow-500 rounded-b" 
                        style={{ height: `${(day.maybe / (day.responses || 1)) * height}%` }}
                        title={`Maybe: ${day.maybe}`}
                      />
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="font-bold text-sm">{day.responses}</div>
                    <div className="text-xs text-muted-foreground">
                      {new Date(day.date).toLocaleDateString('id-ID', { 
                        weekday: 'short' 
                      })}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          
          <div className="flex items-center justify-center gap-6 pt-4 border-t">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-green-500 rounded" />
              <span className="text-sm">Attending</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-red-500 rounded" />
              <span className="text-sm">Not Attending</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-yellow-500 rounded" />
              <span className="text-sm">Maybe</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  // ================================================================================================
  // DETAILED PARTICIPANT LIST
  // ================================================================================================

  const DetailedParticipantList = () => (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Participant Details
            </CardTitle>
            <CardDescription>
              Comprehensive list of all RSVP responses
            </CardDescription>
          </div>
          
          <div className="flex items-center gap-2">
            <Select value={filterStatus} onValueChange={(value: any) => setFilterStatus(value)}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Responses</SelectItem>
                <SelectItem value="attending">Attending</SelectItem>
                <SelectItem value="not_attending">Not Attending</SelectItem>
                <SelectItem value="maybe">Maybe</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
              </SelectContent>
            </Select>
            
            <Select value={timeFilter} onValueChange={(value: any) => setTimeFilter(value)}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Time</SelectItem>
                <SelectItem value="24h">Last 24h</SelectItem>
                <SelectItem value="7d">Last 7 days</SelectItem>
                <SelectItem value="30d">Last 30 days</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-96">
          <div className="space-y-4">
            {processedData.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No participants found for the selected filters</p>
              </div>
            ) : (
              processedData.map((participant, index) => (
                <div key={participant.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <div className="font-medium">{participant.name}</div>
                      <Badge variant={
                        participant.attendance_status === 'attending' ? 'default' :
                        participant.attendance_status === 'not_attending' ? 'destructive' :
                        participant.attendance_status === 'maybe' ? 'secondary' : 'outline'
                      }>
                        {participant.attendance_status === 'attending' ? 'Attending' :
                         participant.attendance_status === 'not_attending' ? 'Not Attending' :
                         participant.attendance_status === 'maybe' ? 'Maybe' : 'Pending'}
                      </Badge>
                    </div>
                    
                    <div className="text-sm text-muted-foreground mt-1">
                      {participant.email}
                      {participant.phone && ` • ${participant.phone}`}
                    </div>
                    
                    <div className="flex items-center gap-4 mt-2 text-sm">
                      <span>
                        <Users className="h-4 w-4 inline mr-1" />
                        {participant.guest_count} guest{participant.guest_count > 1 ? 's' : ''}
                      </span>
                      
                      {participant.rsvp_date && (
                        <span>
                          <Calendar className="h-4 w-4 inline mr-1" />
                          {new Date(participant.rsvp_date).toLocaleDateString('id-ID')}
                        </span>
                      )}
                    </div>
                    
                    {participant.message && (
                      <div className="mt-2 p-2 bg-muted rounded text-sm">
                        <em>"{participant.message}"</em>
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );

  // ================================================================================================
  // EXPORT AND ACTION BUTTONS
  // ================================================================================================

  const ExportActions = () => (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Download className="h-5 w-5" />
          Export & Actions
        </CardTitle>
        <CardDescription>
          Export data dan perform bulk actions
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Button 
            variant="outline" 
            onClick={() => {
              const csvData = exportData('csv');
              const blob = new Blob([csvData], { type: 'text/csv' });
              const url = URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url;
              a.download = `rsvp-analytics-${new Date().toISOString().split('T')[0]}.csv`;
              a.click();
              URL.revokeObjectURL(url);
            }}
          >
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
          
          <Button 
            variant="outline" 
            onClick={() => {
              const jsonData = exportData('json');
              const blob = new Blob([jsonData], { type: 'application/json' });
              const url = URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url;
              a.download = `rsvp-analytics-${new Date().toISOString().split('T')[0]}.json`;
              a.click();
              URL.revokeObjectURL(url);
            }}
          >
            <Download className="h-4 w-4 mr-2" />
            Export JSON
          </Button>
          
          <Button 
            variant="outline" 
            onClick={refreshAnalytics}
          >
            <Zap className="h-4 w-4 mr-2" />
            Refresh Data
          </Button>
        </div>
        
        <Separator className="my-4" />
        
        <div className="space-y-2">
          <h4 className="font-medium">Quick Stats</h4>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>Average Guest Count: <span className="font-medium">
              {analytics.total_attending > 0 
                ? (analytics.total_guests / analytics.total_attending).toFixed(1)
                : '0'}
            </span></div>
            <div>Response Time: <span className="font-medium">
              {analytics.avg_response_time_days > 0 
                ? `${analytics.avg_response_time_days} days`
                : 'N/A'}
            </span></div>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  // ================================================================================================
  // MAIN COMPONENT RENDER
  // ================================================================================================

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className={cn("space-y-6", className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold">RSVP Analytics Dashboard</h2>
          <p className="text-muted-foreground">
            Comprehensive insights dan analytics untuk RSVP management
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <Badge variant="outline">
            Last updated: {new Date(analytics.calculated_at).toLocaleTimeString('id-ID')}
          </Badge>
          <Button variant="outline" size="sm" onClick={refreshAnalytics}>
            <Zap className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Summary Metrics */}
      <SummaryMetrics />

      {/* Main Analytics Tabs */}
      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="trends">Trends</TabsTrigger>
          <TabsTrigger value="participants">Participants</TabsTrigger>
          <TabsTrigger value="actions">Actions</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <ResponseBreakdownChart />
          
          {showDetailedAnalytics && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Key Insights</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                    <div className="flex items-center gap-2 font-medium text-green-800">
                      <Target className="h-4 w-4" />
                      Response Performance
                    </div>
                    <p className="text-sm text-green-700 mt-1">
                      {analytics.response_rate}% response rate - 
                      {analytics.response_rate >= 70 ? ' Excellent performance!' : 
                       analytics.response_rate >= 50 ? ' Good response rate.' :
                       ' Consider sending reminders.'}
                    </p>
                  </div>
                  
                  <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <div className="flex items-center gap-2 font-medium text-blue-800">
                      <Users className="h-4 w-4" />
                      Guest Planning
                    </div>
                    <p className="text-sm text-blue-700 mt-1">
                      Expecting {analytics.total_guests} guests total. 
                      Average {analytics.total_attending > 0 ? (analytics.total_guests / analytics.total_attending).toFixed(1) : '0'} guests per response.
                    </p>
                  </div>
                  
                  <div className="p-4 bg-purple-50 border border-purple-200 rounded-lg">
                    <div className="flex items-center gap-2 font-medium text-purple-800">
                      <Activity className="h-4 w-4" />
                      Recent Activity
                    </div>
                    <p className="text-sm text-purple-700 mt-1">
                      {analytics.responses_last_24h} responses in last 24h, 
                      {analytics.responses_last_7d} in last 7 days.
                    </p>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle>Next Actions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {analytics.total_pending > 0 && (
                    <div className="flex items-start gap-3">
                      <Clock className="h-5 w-5 text-orange-500 mt-0.5" />
                      <div>
                        <p className="font-medium">Follow up with pending guests</p>
                        <p className="text-sm text-muted-foreground">
                          {analytics.total_pending} guests haven't responded yet
                        </p>
                      </div>
                    </div>
                  )}
                  
                  {analytics.total_maybe > 0 && (
                    <div className="flex items-start gap-3">
                      <AlertCircle className="h-5 w-5 text-yellow-500 mt-0.5" />
                      <div>
                        <p className="font-medium">Confirm maybe responses</p>
                        <p className="text-sm text-muted-foreground">
                          {analytics.total_maybe} guests are unsure about attending
                        </p>
                      </div>
                    </div>
                  )}
                  
                  {analytics.response_rate < 50 && (
                    <div className="flex items-start gap-3">
                      <Mail className="h-5 w-5 text-blue-500 mt-0.5" />
                      <div>
                        <p className="font-medium">Send reminder invitations</p>
                        <p className="text-sm text-muted-foreground">
                          Low response rate - consider sending reminders
                        </p>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>

        <TabsContent value="trends" className="space-y-6">
          {showTrendAnalysis && <TrendAnalysisChart />}
        </TabsContent>

        <TabsContent value="participants" className="space-y-6">
          <DetailedParticipantList />
        </TabsContent>

        <TabsContent value="actions" className="space-y-6">
          {showExportOptions && <ExportActions />}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default RSVPAnalyticsDashboard;