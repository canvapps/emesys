import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { Heart, Users, Clock, CheckCircle, XCircle, Calendar, BarChart3, Download, Share2 } from 'lucide-react';
import { useEnhancedRSVP, RSVPFormData } from '@/hooks/useEnhancedRSVP';
import { cn } from '@/lib/utils';

// ================================================================================================
// ENHANCED RSVP SECTION - FASE 1 RSVP SYSTEM ENHANCEMENT
// ================================================================================================
// Comprehensive RSVP interface dengan advanced features, analytics, dan session management
// Compatible dengan existing schema, ready for database migration
// ================================================================================================

interface RSVPSectionEnhancedProps {
  invitationCode?: string;
  showAnalytics?: boolean;
  showSessionInfo?: boolean;
  className?: string;
}

export const RSVPSectionEnhanced: React.FC<RSVPSectionEnhancedProps> = ({
  invitationCode,
  showAnalytics = false,
  showSessionInfo = false,
  className
}) => {
  const {
    participants,
    analytics,
    currentSession,
    loading,
    submitting,
    error,
    submitRSVP,
    createSession,
    updateSession,
    validateForm,
    searchParticipants,
    filterByStatus,
    exportData
  } = useEnhancedRSVP({
    enableSessionTracking: true,
    enableAnalytics: true,
    autoSave: true
  });

  // ================================================================================================
  // FORM STATE MANAGEMENT
  // ================================================================================================
  
  const [formData, setFormData] = useState<RSVPFormData>({
    guest_name: '',
    guest_email: '',
    guest_phone: '',
    guest_count: 1,
    attendance_status: 'attending',
    meal_preference: '',
    special_requirements: '',
    plus_one_name: '',
    message: ''
  });

  const [formStep, setFormStep] = useState(1);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [isFormValid, setIsFormValid] = useState(false);
  const [sessionStartTime, setSessionStartTime] = useState<Date | null>(null);
  const [timeSpent, setTimeSpent] = useState(0);

  // ================================================================================================
  // SESSION TRACKING
  // ================================================================================================
  
  useEffect(() => {
    // Create session when component mounts
    if (!currentSession) {
      const session = createSession(invitationCode);
      setSessionStartTime(new Date());
    } else {
      setSessionStartTime(new Date(currentSession.form_started_at));
    }
  }, []);

  useEffect(() => {
    // Track time spent on form
    const interval = setInterval(() => {
      if (sessionStartTime && currentSession?.status === 'active') {
        const elapsed = Math.floor((Date.now() - sessionStartTime.getTime()) / 1000);
        setTimeSpent(elapsed);
        
        updateSession(currentSession.session_token, {
          time_spent_seconds: elapsed,
          partial_data: formData
        });
      }
    }, 5000); // Update every 5 seconds

    return () => clearInterval(interval);
  }, [sessionStartTime, currentSession, formData]);

  // ================================================================================================
  // FORM VALIDATION & HANDLING
  // ================================================================================================
  
  useEffect(() => {
    const validation = validateForm(formData);
    setValidationErrors(validation.errors);
    setIsFormValid(validation.isValid);
  }, [formData]);

  const handleInputChange = (field: keyof RSVPFormData, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!isFormValid) {
      setFormStep(1); // Go back to first step to show errors
      return;
    }

    const success = await submitRSVP(formData, currentSession?.session_token);
    if (success) {
      setFormStep(4); // Success step
    }
  };

  const nextStep = () => {
    if (formStep < 4) {
      setFormStep(formStep + 1);
    }
  };

  const prevStep = () => {
    if (formStep > 1) {
      setFormStep(formStep - 1);
    }
  };

  // ================================================================================================
  // ANALYTICS COMPONENTS
  // ================================================================================================
  
  const RSVPAnalyticsDashboard = () => (
    <Card className="mt-6">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BarChart3 className="h-5 w-5" />
          RSVP Analytics Dashboard
        </CardTitle>
        <CardDescription>
          Real-time insights tentang responses RSVP
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Response Overview */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">{analytics.total_attending}</div>
            <div className="text-sm text-muted-foreground">Hadir</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-red-600">{analytics.total_not_attending}</div>
            <div className="text-sm text-muted-foreground">Tidak Hadir</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-yellow-600">{analytics.total_maybe}</div>
            <div className="text-sm text-muted-foreground">Mungkin</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">{analytics.total_guests}</div>
            <div className="text-sm text-muted-foreground">Total Tamu</div>
          </div>
        </div>

        {/* Response Rate Progress */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Response Rate</span>
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

        {/* Recent Activity */}
        <div className="space-y-2">
          <h4 className="font-medium">Recent Activity</h4>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>Responses Last 24h: <Badge variant="secondary">{analytics.responses_last_24h}</Badge></div>
            <div>Responses Last 7d: <Badge variant="secondary">{analytics.responses_last_7d}</Badge></div>
          </div>
        </div>

        {/* Export Options */}
        <div className="flex gap-2 pt-4 border-t">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => {
              const csvData = exportData('csv');
              const blob = new Blob([csvData], { type: 'text/csv' });
              const url = URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url;
              a.download = `rsvp-data-${new Date().toISOString().split('T')[0]}.csv`;
              a.click();
              URL.revokeObjectURL(url);
            }}
          >
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => {
              const jsonData = exportData('json');
              const blob = new Blob([jsonData], { type: 'application/json' });
              const url = URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url;
              a.download = `rsvp-data-${new Date().toISOString().split('T')[0]}.json`;
              a.click();
              URL.revokeObjectURL(url);
            }}
          >
            <Download className="h-4 w-4 mr-2" />
            Export JSON
          </Button>
        </div>
      </CardContent>
    </Card>
  );

  // ================================================================================================
  // SESSION INFO COMPONENT
  // ================================================================================================
  
  const SessionInfoPanel = () => (
    currentSession && (
      <Alert className="mb-6">
        <Clock className="h-4 w-4" />
        <AlertDescription>
          <div className="flex justify-between items-center">
            <span>Session Active - Time Spent: {Math.floor(timeSpent / 60)}m {timeSpent % 60}s</span>
            <Badge variant={currentSession.status === 'active' ? 'default' : 'secondary'}>
              {currentSession.status}
            </Badge>
          </div>
        </AlertDescription>
      </Alert>
    )
  );

  // ================================================================================================
  // FORM STEPS COMPONENTS
  // ================================================================================================
  
  const FormStepIndicator = () => (
    <div className="flex justify-center mb-6">
      <div className="flex items-center space-x-4">
        {[1, 2, 3].map((step) => (
          <React.Fragment key={step}>
            <div className={cn(
              "flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium",
              formStep >= step
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground"
            )}>
              {formStep > step ? (
                <CheckCircle className="h-5 w-5" />
              ) : (
                step
              )}
            </div>
            {step < 3 && (
              <div className={cn(
                "w-8 h-1 rounded-full",
                formStep > step ? "bg-primary" : "bg-muted"
              )} />
            )}
          </React.Fragment>
        ))}
      </div>
    </div>
  );

  const BasicInfoStep = () => (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="guest_name">Nama Lengkap *</Label>
          <Input
            id="guest_name"
            placeholder="Masukkan nama lengkap"
            value={formData.guest_name}
            onChange={(e) => handleInputChange('guest_name', e.target.value)}
            className={validationErrors.some(e => e.includes('Nama')) ? 'border-red-500' : ''}
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="guest_email">Email *</Label>
          <Input
            id="guest_email"
            type="email"
            placeholder="nama@email.com"
            value={formData.guest_email}
            onChange={(e) => handleInputChange('guest_email', e.target.value)}
            className={validationErrors.some(e => e.includes('Email')) ? 'border-red-500' : ''}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="guest_phone">Nomor Telepon</Label>
        <Input
          id="guest_phone"
          placeholder="+62 812-3456-7890"
          value={formData.guest_phone}
          onChange={(e) => handleInputChange('guest_phone', e.target.value)}
        />
      </div>

      <div className="space-y-4">
        <Label>Status Kehadiran *</Label>
        <RadioGroup
          value={formData.attendance_status}
          onValueChange={(value) => handleInputChange('attendance_status', value)}
        >
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="attending" id="attending" />
            <Label htmlFor="attending" className="flex items-center cursor-pointer">
              <CheckCircle className="h-4 w-4 mr-2 text-green-600" />
              Ya, saya akan hadir
            </Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="not_attending" id="not_attending" />
            <Label htmlFor="not_attending" className="flex items-center cursor-pointer">
              <XCircle className="h-4 w-4 mr-2 text-red-600" />
              Maaf, saya tidak dapat hadir
            </Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="maybe" id="maybe" />
            <Label htmlFor="maybe" className="flex items-center cursor-pointer">
              <Clock className="h-4 w-4 mr-2 text-yellow-600" />
              Belum yakin, akan konfirmasi nanti
            </Label>
          </div>
        </RadioGroup>
      </div>
    </div>
  );

  const GuestDetailsStep = () => (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="guest_count">Jumlah Tamu *</Label>
        <Select 
          value={formData.guest_count.toString()} 
          onValueChange={(value) => handleInputChange('guest_count', parseInt(value))}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(num => (
              <SelectItem key={num} value={num.toString()}>
                {num} {num === 1 ? 'orang' : 'orang'}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {formData.guest_count > 1 && (
        <div className="space-y-2">
          <Label htmlFor="plus_one_name">Nama Tamu Tambahan *</Label>
          <Input
            id="plus_one_name"
            placeholder="Nama tamu yang ikut"
            value={formData.plus_one_name}
            onChange={(e) => handleInputChange('plus_one_name', e.target.value)}
            className={validationErrors.some(e => e.includes('tamu tambahan')) ? 'border-red-500' : ''}
          />
        </div>
      )}

      {formData.attendance_status === 'attending' && (
        <div className="space-y-2">
          <Label htmlFor="meal_preference">Preferensi Makanan</Label>
          <Select 
            value={formData.meal_preference} 
            onValueChange={(value) => handleInputChange('meal_preference', value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Pilih preferensi makanan" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="regular">Regular</SelectItem>
              <SelectItem value="vegetarian">Vegetarian</SelectItem>
              <SelectItem value="halal">Halal</SelectItem>
              <SelectItem value="vegan">Vegan</SelectItem>
              <SelectItem value="no_pork">No Pork</SelectItem>
              <SelectItem value="other">Lainnya</SelectItem>
            </SelectContent>
          </Select>
        </div>
      )}

      <div className="space-y-2">
        <Label htmlFor="special_requirements">Kebutuhan Khusus</Label>
        <Textarea
          id="special_requirements"
          placeholder="Misalnya: kursi roda, alergi makanan, dll."
          value={formData.special_requirements}
          onChange={(e) => handleInputChange('special_requirements', e.target.value)}
          rows={3}
        />
      </div>
    </div>
  );

  const MessageStep = () => (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="message">Pesan untuk Pengantin</Label>
        <Textarea
          id="message"
          placeholder="Tulis pesan, doa, atau ucapan selamat untuk pengantin..."
          value={formData.message}
          onChange={(e) => handleInputChange('message', e.target.value)}
          rows={4}
        />
      </div>

      {/* RSVP Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Ringkasan RSVP Anda</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span>Nama:</span>
            <span className="font-medium">{formData.guest_name}</span>
          </div>
          <div className="flex justify-between">
            <span>Email:</span>
            <span className="font-medium">{formData.guest_email}</span>
          </div>
          <div className="flex justify-between">
            <span>Kehadiran:</span>
            <Badge variant={
              formData.attendance_status === 'attending' ? 'default' :
              formData.attendance_status === 'not_attending' ? 'destructive' : 'secondary'
            }>
              {formData.attendance_status === 'attending' ? 'Hadir' :
               formData.attendance_status === 'not_attending' ? 'Tidak Hadir' : 'Belum Yakin'}
            </Badge>
          </div>
          <div className="flex justify-between">
            <span>Jumlah Tamu:</span>
            <span className="font-medium">{formData.guest_count} orang</span>
          </div>
          {formData.meal_preference && (
            <div className="flex justify-between">
              <span>Preferensi Makanan:</span>
              <span className="font-medium">{formData.meal_preference}</span>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );

  const SuccessStep = () => (
    <div className="text-center space-y-4">
      <div className="flex justify-center">
        <div className="rounded-full bg-green-100 p-6">
          <CheckCircle className="h-12 w-12 text-green-600" />
        </div>
      </div>
      <div>
        <h3 className="text-xl font-semibold">RSVP Berhasil Tersimpan!</h3>
        <p className="text-muted-foreground mt-2">
          Terima kasih {formData.guest_name}, konfirmasi kehadiran Anda telah kami terima.
        </p>
      </div>
      
      {formData.attendance_status === 'attending' && (
        <Alert>
          <Heart className="h-4 w-4" />
          <AlertDescription>
            Kami tidak sabar untuk merayakan hari spesial ini bersama Anda!
            Detail lebih lanjut akan dikirim melalui email.
          </AlertDescription>
        </Alert>
      )}

      <div className="flex justify-center gap-2 pt-4">
        <Button 
          variant="outline" 
          onClick={() => {
            // Reset form for new entry
            setFormData({
              guest_name: '',
              guest_email: '',
              guest_phone: '',
              guest_count: 1,
              attendance_status: 'attending',
              meal_preference: '',
              special_requirements: '',
              plus_one_name: '',
              message: ''
            });
            setFormStep(1);
          }}
        >
          RSVP Baru
        </Button>
        <Button variant="outline">
          <Share2 className="h-4 w-4 mr-2" />
          Bagikan
        </Button>
      </div>
    </div>
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
    <div className={cn("container mx-auto px-4 py-8", className)}>
      {/* Session Info */}
      {showSessionInfo && <SessionInfoPanel />}
      
      <Tabs defaultValue="rsvp" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="rsvp">RSVP Form</TabsTrigger>
          {showAnalytics && (
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
          )}
        </TabsList>

        {/* RSVP Form Tab */}
        <TabsContent value="rsvp" className="space-y-6">
          <Card className="max-w-2xl mx-auto">
            <CardHeader className="text-center">
              <CardTitle className="flex items-center justify-center gap-2 text-2xl">
                <Heart className="h-6 w-6 text-red-500" />
                Konfirmasi Kehadiran
              </CardTitle>
              <CardDescription>
                Mohon konfirmasi kehadiran Anda pada acara pernikahan kami
              </CardDescription>
            </CardHeader>

            <CardContent>
              {error && (
                <Alert className="mb-4" variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              {validationErrors.length > 0 && (
                <Alert className="mb-4" variant="destructive">
                  <AlertDescription>
                    <ul className="list-disc list-inside">
                      {validationErrors.map((error, index) => (
                        <li key={index}>{error}</li>
                      ))}
                    </ul>
                  </AlertDescription>
                </Alert>
              )}

              {formStep < 4 && <FormStepIndicator />}

              <form onSubmit={handleFormSubmit} className="space-y-6">
                {formStep === 1 && <BasicInfoStep />}
                {formStep === 2 && <GuestDetailsStep />}
                {formStep === 3 && <MessageStep />}
                {formStep === 4 && <SuccessStep />}

                {formStep < 4 && (
                  <>
                    <Separator />
                    <div className="flex justify-between">
                      <Button 
                        type="button" 
                        variant="outline" 
                        onClick={prevStep}
                        disabled={formStep === 1}
                      >
                        Kembali
                      </Button>

                      {formStep < 3 ? (
                        <Button type="button" onClick={nextStep}>
                          Lanjutkan
                        </Button>
                      ) : (
                        <Button 
                          type="submit" 
                          disabled={submitting || !isFormValid}
                          className="min-w-[120px]"
                        >
                          {submitting ? (
                            <>
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                              Menyimpan...
                            </>
                          ) : (
                            <>
                              <CheckCircle className="h-4 w-4 mr-2" />
                              Kirim RSVP
                            </>
                          )}
                        </Button>
                      )}
                    </div>
                  </>
                )}
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Analytics Tab */}
        {showAnalytics && (
          <TabsContent value="analytics">
            <RSVPAnalyticsDashboard />
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
};

export default RSVPSectionEnhanced;