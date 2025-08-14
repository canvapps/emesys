import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Bell, 
  Users, 
  TrendingUp, 
  Clock, 
  CheckCircle, 
  XCircle, 
  AlertCircle,
  Activity,
  Calendar,
  Mail,
  Phone,
  MessageSquare
} from 'lucide-react';
import { useEnhancedRSVP, RSVPParticipant } from '@/hooks/useEnhancedRSVP';
import { cn } from '@/lib/utils';

// ================================================================================================
// REAL-TIME RSVP TRACKER - FASE 1 RSVP SYSTEM ENHANCEMENT
// ================================================================================================
// Real-time monitoring dan notifications untuk RSVP responses
// Live analytics, activity feed, dan notification management
// ================================================================================================

interface RSVPActivity {
  id: string;
  type: 'rsvp_submitted' | 'rsvp_updated' | 'invitation_sent' | 'reminder_sent';
  participant_name: string;
  participant_email: string;
  attendance_status?: 'attending' | 'not_attending' | 'maybe' | 'pending';
  guest_count?: number;
  timestamp: string;
  details?: string;
}

interface Notification {
  id: string;
  type: 'success' | 'warning' | 'info' | 'error';
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  actionable?: boolean;
}

interface RSVPRealtimeTrackerProps {
  enableNotifications?: boolean;
  enableActivityFeed?: boolean;
  refreshInterval?: number;
  className?: string;
}

export const RSVPRealtimeTracker: React.FC<RSVPRealtimeTrackerProps> = ({
  enableNotifications = true,
  enableActivityFeed = true,
  refreshInterval = 5000, // 5 seconds
  className
}) => {
  const {
    participants,
    analytics,
    loading,
    refreshAnalytics
  } = useEnhancedRSVP({
    enableRealtime: true,
    enableAnalytics: true
  });

  // ================================================================================================
  // STATE MANAGEMENT
  // ================================================================================================

  const [activities, setActivities] = useState<RSVPActivity[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLiveMode, setIsLiveMode] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
  const [unreadCount, setUnreadCount] = useState(0);

  // Previous state for comparison
  const [prevParticipants, setPrevParticipants] = useState<RSVPParticipant[]>([]);

  // ================================================================================================
  // REAL-TIME MONITORING
  // ================================================================================================

  useEffect(() => {
    if (!isLiveMode) return;

    const interval = setInterval(() => {
      refreshAnalytics();
      setLastUpdate(new Date());
      
      // Detect changes and generate activities
      detectChangesAndNotify();
    }, refreshInterval);

    return () => clearInterval(interval);
  }, [isLiveMode, refreshInterval, participants, prevParticipants]);

  const detectChangesAndNotify = () => {
    if (prevParticipants.length === 0) {
      setPrevParticipants(participants);
      return;
    }

    const newParticipants = participants.filter(
      current => !prevParticipants.some(prev => prev.id === current.id)
    );

    const updatedParticipants = participants.filter(current =>
      prevParticipants.some(prev => 
        prev.id === current.id && 
        (prev.attendance_status !== current.attendance_status ||
         prev.guest_count !== current.guest_count ||
         prev.updated_at !== current.updated_at)
      )
    );

    // Generate activities for new participants
    newParticipants.forEach(participant => {
      addActivity({
        type: 'rsvp_submitted',
        participant_name: participant.name,
        participant_email: participant.email,
        attendance_status: participant.attendance_status,
        guest_count: participant.guest_count,
        details: `New RSVP: ${participant.attendance_status}`
      });

      // Generate notification
      addNotification({
        type: participant.attendance_status === 'attending' ? 'success' :
              participant.attendance_status === 'not_attending' ? 'warning' : 'info',
        title: 'New RSVP Received!',
        message: `${participant.name} ${
          participant.attendance_status === 'attending' ? 'will attend' :
          participant.attendance_status === 'not_attending' ? 'cannot attend' :
          'is unsure about attending'
        }`,
        actionable: false
      });
    });

    // Generate activities for updated participants
    updatedParticipants.forEach(participant => {
      const prevParticipant = prevParticipants.find(p => p.id === participant.id);
      
      if (prevParticipant) {
        addActivity({
          type: 'rsvp_updated',
          participant_name: participant.name,
          participant_email: participant.email,
          attendance_status: participant.attendance_status,
          guest_count: participant.guest_count,
          details: `Updated from ${prevParticipant.attendance_status} to ${participant.attendance_status}`
        });

        addNotification({
          type: 'info',
          title: 'RSVP Updated',
          message: `${participant.name} changed their response to ${participant.attendance_status}`,
          actionable: false
        });
      }
    });

    setPrevParticipants(participants);
  };

  const addActivity = (activityData: Omit<RSVPActivity, 'id' | 'timestamp'>) => {
    const newActivity: RSVPActivity = {
      id: crypto.randomUUID(),
      timestamp: new Date().toISOString(),
      ...activityData
    };

    setActivities(prev => [newActivity, ...prev].slice(0, 50)); // Keep last 50 activities
  };

  const addNotification = (notificationData: Omit<Notification, 'id' | 'timestamp' | 'read'>) => {
    const newNotification: Notification = {
      id: crypto.randomUUID(),
      timestamp: new Date().toISOString(),
      read: false,
      ...notificationData
    };

    setNotifications(prev => [newNotification, ...prev]);
    setUnreadCount(prev => prev + 1);

    // Auto-remove notifications after 30 seconds
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== newNotification.id));
    }, 30000);
  };

  // ================================================================================================
  // NOTIFICATION MANAGEMENT
  // ================================================================================================

  const markNotificationAsRead = (notificationId: string) => {
    setNotifications(prev => prev.map(n => 
      n.id === notificationId ? { ...n, read: true } : n
    ));
    setUnreadCount(prev => Math.max(0, prev - 1));
  };

  const markAllNotificationsAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    setUnreadCount(0);
  };

  const clearAllNotifications = () => {
    setNotifications([]);
    setUnreadCount(0);
  };

  // ================================================================================================
  // ACTIVITY FEED COMPONENT
  // ================================================================================================

  const ActivityFeed = () => (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Activity className="h-5 w-5" />
          Live Activity Feed
        </CardTitle>
        <CardDescription>
          Real-time updates tentang RSVP activity
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-96">
          {activities.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Activity className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No recent activity</p>
            </div>
          ) : (
            <div className="space-y-4">
              {activities.map((activity) => (
                <div key={activity.id} className="flex items-start gap-3 p-3 rounded-lg border">
                  <div className="flex-shrink-0">
                    {activity.type === 'rsvp_submitted' && (
                      <CheckCircle className="h-5 w-5 text-green-600" />
                    )}
                    {activity.type === 'rsvp_updated' && (
                      <AlertCircle className="h-5 w-5 text-blue-600" />
                    )}
                    {activity.type === 'invitation_sent' && (
                      <Mail className="h-5 w-5 text-purple-600" />
                    )}
                    {activity.type === 'reminder_sent' && (
                      <Bell className="h-5 w-5 text-orange-600" />
                    )}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium">
                        {activity.participant_name}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(activity.timestamp).toLocaleTimeString('id-ID')}
                      </p>
                    </div>
                    
                    <p className="text-sm text-muted-foreground">
                      {activity.participant_email}
                    </p>
                    
                    {activity.details && (
                      <p className="text-sm mt-1">
                        {activity.details}
                      </p>
                    )}
                    
                    <div className="flex items-center gap-2 mt-2">
                      {activity.attendance_status && (
                        <Badge variant={
                          activity.attendance_status === 'attending' ? 'default' :
                          activity.attendance_status === 'not_attending' ? 'destructive' : 'secondary'
                        }>
                          {activity.attendance_status === 'attending' ? 'Attending' :
                           activity.attendance_status === 'not_attending' ? 'Not Attending' :
                           activity.attendance_status === 'maybe' ? 'Maybe' : 'Pending'}
                        </Badge>
                      )}
                      
                      {activity.guest_count && (
                        <Badge variant="outline">
                          {activity.guest_count} guest{activity.guest_count > 1 ? 's' : ''}
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );

  // ================================================================================================
  // NOTIFICATIONS PANEL
  // ================================================================================================

  const NotificationsPanel = () => (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              Notifications
              {unreadCount > 0 && (
                <Badge variant="destructive" className="ml-2">
                  {unreadCount}
                </Badge>
              )}
            </CardTitle>
            <CardDescription>
              Real-time alerts dan updates
            </CardDescription>
          </div>
          
          <div className="flex gap-2">
            {unreadCount > 0 && (
              <Button variant="outline" size="sm" onClick={markAllNotificationsAsRead}>
                Mark All Read
              </Button>
            )}
            <Button variant="outline" size="sm" onClick={clearAllNotifications}>
              Clear All
            </Button>
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        <ScrollArea className="h-64">
          {notifications.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Bell className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No notifications</p>
            </div>
          ) : (
            <div className="space-y-3">
              {notifications.map((notification) => (
                <Alert 
                  key={notification.id}
                  className={cn(
                    "cursor-pointer transition-colors",
                    !notification.read && "border-l-4 border-l-primary"
                  )}
                  onClick={() => markNotificationAsRead(notification.id)}
                >
                  <div className="flex items-start gap-3">
                    {notification.type === 'success' && <CheckCircle className="h-4 w-4 text-green-600" />}
                    {notification.type === 'warning' && <AlertCircle className="h-4 w-4 text-yellow-600" />}
                    {notification.type === 'info' && <Bell className="h-4 w-4 text-blue-600" />}
                    {notification.type === 'error' && <XCircle className="h-4 w-4 text-red-600" />}
                    
                    <div className="flex-1">
                      <AlertDescription>
                        <div className="flex items-center justify-between mb-1">
                          <p className="font-medium">{notification.title}</p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(notification.timestamp).toLocaleTimeString('id-ID')}
                          </p>
                        </div>
                        <p className="text-sm">{notification.message}</p>
                      </AlertDescription>
                    </div>
                  </div>
                </Alert>
              ))}
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );

  // ================================================================================================
  // LIVE METRICS DASHBOARD
  // ================================================================================================

  const LiveMetricsDashboard = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center gap-4">
            <div className="p-2 rounded-full bg-green-100">
              <Users className="h-6 w-6 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{analytics.total_attending}</p>
              <p className="text-sm text-muted-foreground">Attending</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-6">
          <div className="flex items-center gap-4">
            <div className="p-2 rounded-full bg-red-100">
              <XCircle className="h-6 w-6 text-red-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{analytics.total_not_attending}</p>
              <p className="text-sm text-muted-foreground">Not Attending</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-6">
          <div className="flex items-center gap-4">
            <div className="p-2 rounded-full bg-blue-100">
              <TrendingUp className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{analytics.response_rate}%</p>
              <p className="text-sm text-muted-foreground">Response Rate</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-6">
          <div className="flex items-center gap-4">
            <div className="p-2 rounded-full bg-purple-100">
              <Calendar className="h-6 w-6 text-purple-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{analytics.total_guests}</p>
              <p className="text-sm text-muted-foreground">Total Guests</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  // ================================================================================================
  // MAIN COMPONENT RENDER
  // ================================================================================================

  return (
    <div className={cn("space-y-6", className)}>
      {/* Header with Live Status */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">RSVP Real-time Tracker</h2>
          <p className="text-muted-foreground">
            Live monitoring dan notifications untuk RSVP responses
          </p>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className={cn(
              "w-2 h-2 rounded-full",
              isLiveMode ? "bg-green-500 animate-pulse" : "bg-gray-400"
            )} />
            <span className="text-sm">
              {isLiveMode ? 'Live' : 'Paused'}
            </span>
          </div>
          
          <Button
            variant={isLiveMode ? "secondary" : "default"}
            size="sm"
            onClick={() => setIsLiveMode(!isLiveMode)}
          >
            {isLiveMode ? 'Pause' : 'Start'} Live Mode
          </Button>
        </div>
      </div>

      {/* Live Metrics Dashboard */}
      <LiveMetricsDashboard />

      {/* Progress Overview */}
      <Card>
        <CardHeader>
          <CardTitle>Response Progress</CardTitle>
          <CardDescription>
            Current RSVP response statistics - Last updated: {lastUpdate.toLocaleTimeString('id-ID')}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Overall Response Rate</span>
              <span>{analytics.response_rate}%</span>
            </div>
            <Progress value={analytics.response_rate} className="h-2" />
          </div>

          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Acceptance Rate</span>
              <span>{analytics.acceptance_rate}%</span>
            </div>
            <Progress value={analytics.acceptance_rate} className="h-2" />
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-2">
            <div className="text-center">
              <div className="text-lg font-semibold text-green-600">{analytics.responses_last_24h}</div>
              <div className="text-xs text-muted-foreground">Last 24h</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-semibold text-blue-600">{analytics.responses_last_7d}</div>
              <div className="text-xs text-muted-foreground">Last 7 days</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-semibold text-purple-600">{analytics.total_pending}</div>
              <div className="text-xs text-muted-foreground">Pending</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-semibold text-orange-600">{analytics.total_maybe}</div>
              <div className="text-xs text-muted-foreground">Maybe</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Activity Feed and Notifications */}
      <Tabs defaultValue="activity" className="w-full">
        <TabsList>
          <TabsTrigger value="activity">Activity Feed</TabsTrigger>
          <TabsTrigger value="notifications">
            Notifications
            {unreadCount > 0 && (
              <Badge variant="destructive" className="ml-2">
                {unreadCount}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="activity" className="mt-6">
          {enableActivityFeed && <ActivityFeed />}
        </TabsContent>

        <TabsContent value="notifications" className="mt-6">
          {enableNotifications && <NotificationsPanel />}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default RSVPRealtimeTracker;