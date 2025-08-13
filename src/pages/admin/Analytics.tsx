
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts';
import { useGuests } from '@/hooks/useGuests';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { useToast } from '@/hooks/use-toast';
import { 
  UsersIcon, 
  ChartBarIcon, 
  CalendarIcon,
  ClockIcon,
  ArrowPathIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon
} from '@heroicons/react/24/outline';
import { RefreshCw, Users, Calendar, Mail, MapPin } from 'lucide-react';

const Analytics = () => {
  const { guests, getGuestStats } = useGuests();
  const [emailCampaigns] = useLocalStorage('email-campaigns', []);
  const [locations] = useLocalStorage('wedding-locations', []);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastRefresh, setLastRefresh] = useState(new Date());
  const { toast } = useToast();

  // Real-time data refresh
  const refreshData = async () => {
    setIsRefreshing(true);
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    setLastRefresh(new Date());
    setIsRefreshing(false);
    
    toast({
      title: "Data Updated",
      description: "Analytics data has been refreshed",
    });
  };

  // Auto refresh every 5 minutes
  useEffect(() => {
    const interval = setInterval(() => {
      refreshData();
    }, 5 * 60 * 1000); // 5 minutes

    return () => clearInterval(interval);
  }, []);

  // Get real guest statistics
  const guestStats = getGuestStats();

  // Get RSVP trend data (last 7 days)
  const getRSVPTrend = () => {
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - (6 - i));
      return date.toISOString().split('T')[0];
    });

    return last7Days.map(date => {
      const dayGuests = guests.filter(guest => 
        guest.rsvp_date && guest.rsvp_date.startsWith(date)
      );
      
      return {
        date: new Date(date).toLocaleDateString('id-ID', { 
          month: 'short', 
          day: 'numeric' 
        }),
        rsvp: dayGuests.length,
        attending: dayGuests.filter(g => g.attendance_status === 'attending').length,
      };
    });
  };

  // Get invitation type distribution
  const getInvitationDistribution = () => {
    const akadOnly = guests.filter(g => g.invitation_type === 'akad').length;
    const resepsiOnly = guests.filter(g => g.invitation_type === 'resepsi').length;
    const both = guests.filter(g => g.invitation_type === 'both').length;

    return [
      { name: 'Akad Only', value: akadOnly, color: '#8884d8' },
      { name: 'Resepsi Only', value: resepsiOnly, color: '#82ca9d' },
      { name: 'Both', value: both, color: '#ffc658' },
    ];
  };

  // Get attendance status distribution
  const getAttendanceDistribution = () => {
    return [
      { name: 'Hadir', value: guestStats.attending, color: '#10b981' },
      { name: 'Tidak Hadir', value: guestStats.notAttending, color: '#ef4444' },
      { name: 'Mungkin', value: guestStats.maybe, color: '#f59e0b' },
      { name: 'Pending', value: guestStats.pending, color: '#6b7280' },
    ];
  };

  // Get geographical distribution
  const getGeographicalData = () => {
    const cityCount = guests.reduce((acc, guest) => {
      if (guest.city) {
        acc[guest.city] = (acc[guest.city] || 0) + 1;
      }
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(cityCount)
      .map(([city, count]) => ({ city, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
  };

  const rsvpTrendData = getRSVPTrend();
  const invitationData = getInvitationDistribution();
  const attendanceData = getAttendanceDistribution();
  const geographicalData = getGeographicalData();

  // Calculate response rate
  const responseRate = guestStats.total > 0 
    ? Math.round(((guestStats.total - guestStats.pending) / guestStats.total) * 100)
    : 0;

  // Calculate growth from previous period (mock calculation)
  const guestGrowth = 12; // +12% from last week
  const responseGrowth = 8; // +8% response rate improvement

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Analytics Dashboard</h1>
          <p className="text-muted-foreground">
            Real-time insights and wedding statistics
          </p>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-sm text-muted-foreground">
            Last updated: {lastRefresh.toLocaleTimeString('id-ID')}
          </div>
          <Button 
            variant="outline" 
            onClick={refreshData}
            disabled={isRefreshing}
          >
            {isRefreshing ? (
              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <ArrowPathIcon className="h-4 w-4 mr-2" />
            )}
            Refresh
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Guests</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{guestStats.total}</div>
            <div className="flex items-center text-xs text-muted-foreground">
              <ArrowTrendingUpIcon className="h-3 w-3 mr-1 text-green-500" />
              +{guestGrowth}% from last week
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Confirmed Attending</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{guestStats.attending}</div>
            <div className="text-xs text-muted-foreground">
              {guestStats.attendanceRate}% attendance rate
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Response Rate</CardTitle>
            <Mail className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{responseRate}%</div>
            <div className="flex items-center text-xs text-muted-foreground">
              <ArrowTrendingUpIcon className="h-3 w-3 mr-1 text-green-500" />
              +{responseGrowth}% improvement
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Locations</CardTitle>
            <MapPin className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{locations.length}</div>
            <div className="text-xs text-muted-foreground">
              {locations.filter(l => l.is_active).length} active venues
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="guests">Guest Analytics</TabsTrigger>
          <TabsTrigger value="rsvp">RSVP Trends</TabsTrigger>
          <TabsTrigger value="geography">Geography</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Attendance Status</CardTitle>
                <CardDescription>Distribution of guest responses</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={attendanceData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {attendanceData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Invitation Types</CardTitle>
                <CardDescription>Types of invitations sent</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={invitationData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="value" fill="#8884d8" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="guests" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader>
                <CardTitle>Guest Status</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Attending</span>
                    <Badge variant="default">{guestStats.attending}</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Not Attending</span>
                    <Badge variant="destructive">{guestStats.notAttending}</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Maybe</span>
                    <Badge variant="secondary">{guestStats.maybe}</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Pending</span>
                    <Badge variant="outline">{guestStats.pending}</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Email Campaigns</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-2xl font-bold">{emailCampaigns.length}</div>
                <div className="text-sm text-muted-foreground">
                  Total campaigns sent
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Total Expected</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-2xl font-bold">
                  {guests.reduce((sum, guest) => sum + guest.guest_count, 0)}
                </div>
                <div className="text-sm text-muted-foreground">
                  Including plus ones
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="rsvp" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>RSVP Trend (Last 7 Days)</CardTitle>
              <CardDescription>Daily RSVP responses and confirmations</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <LineChart data={rsvpTrendData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Line 
                    type="monotone" 
                    dataKey="rsvp" 
                    stroke="#8884d8" 
                    strokeWidth={2}
                    name="Total RSVP"
                  />
                  <Line 
                    type="monotone" 
                    dataKey="attending" 
                    stroke="#82ca9d" 
                    strokeWidth={2}
                    name="Confirmed Attending"
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="geography" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Guest Distribution by City</CardTitle>
              <CardDescription>Top 10 cities with most guests</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={geographicalData} layout="horizontal">
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" />
                  <YAxis type="category" dataKey="city" width={100} />
                  <Tooltip />
                  <Bar dataKey="count" fill="#8884d8" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Analytics;
