
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { 
  CogIcon, 
  UserIcon, 
  BellIcon, 
  ShieldCheckIcon,
  PaintBrushIcon,
  CheckIcon,
  EnvelopeIcon
} from '@heroicons/react/24/outline';
import { Save, AlertCircle, TestTube } from 'lucide-react';
import { useAppSettings } from '@/hooks/useAppSettings';

const Settings = () => {
  const { 
    settings, 
    isLoading, 
    isSaving, 
    hasChanges, 
    updateSetting, 
    saveSettings, 
    resetSettings,
    testEmailConfiguration 
  } = useAppSettings();
  const [activeTab, setActiveTab] = useState('general');
  const [isTestingEmail, setIsTestingEmail] = useState(false);

  const handleTestEmail = async () => {
    setIsTestingEmail(true);
    try {
      await testEmailConfiguration();
    } finally {
      setIsTestingEmail(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
          <p className="text-muted-foreground">Kelola pengaturan aplikasi dan preferensi sistem</p>
        </div>
        <div className="flex items-center gap-2">
          {hasChanges && (
            <Badge variant="secondary" className="flex items-center gap-1">
              <AlertCircle className="h-3 w-3" />
              Ada perubahan belum disimpan
            </Badge>
          )}
          <Button 
            variant="outline" 
            onClick={resetSettings}
            disabled={isSaving}
          >
            Reset ke Default
          </Button>
          <Button 
            onClick={saveSettings}
            disabled={!hasChanges || isSaving}
          >
            {isSaving ? (
              <Save className="h-4 w-4 mr-2 animate-pulse" />
            ) : (
              <Save className="h-4 w-4 mr-2" />
            )}
            {isSaving ? 'Menyimpan...' : 'Simpan Perubahan'}
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="general" className="flex items-center gap-2">
            <CogIcon className="h-4 w-4" />
            Umum
          </TabsTrigger>
          <TabsTrigger value="wedding" className="flex items-center gap-2">
            <UserIcon className="h-4 w-4" />
            Pernikahan
          </TabsTrigger>
          <TabsTrigger value="notifications" className="flex items-center gap-2">
            <BellIcon className="h-4 w-4" />
            Notifikasi
          </TabsTrigger>
          <TabsTrigger value="security" className="flex items-center gap-2">
            <ShieldCheckIcon className="h-4 w-4" />
            Keamanan
          </TabsTrigger>
          <TabsTrigger value="appearance" className="flex items-center gap-2">
            <PaintBrushIcon className="h-4 w-4" />
            Tampilan
          </TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Pengaturan Umum</CardTitle>
              <CardDescription>Konfigurasi dasar aplikasi</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="siteName">Nama Situs</Label>
                  <Input
                    id="siteName"
                    value={settings.general.siteName}
                    onChange={(e) => updateSetting('general', 'siteName', e.target.value)}
                    placeholder="Masukkan nama situs"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="contactEmail">Email Kontak</Label>
                  <Input
                    id="contactEmail"
                    type="email"
                    value={settings.general.contactEmail}
                    onChange={(e) => updateSetting('general', 'contactEmail', e.target.value)}
                    placeholder="admin@example.com"
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="siteDescription">Deskripsi Situs</Label>
                <Textarea
                  id="siteDescription"
                  value={settings.general.siteDescription}
                  onChange={(e) => updateSetting('general', 'siteDescription', e.target.value)}
                  placeholder="Deskripsi singkat website Anda"
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="timezone">Zona Waktu</Label>
                  <Select 
                    value={settings.general.timezone} 
                    onValueChange={(value) => updateSetting('general', 'timezone', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Asia/Jakarta">Asia/Jakarta (WIB)</SelectItem>
                      <SelectItem value="Asia/Makassar">Asia/Makassar (WITA)</SelectItem>
                      <SelectItem value="Asia/Jayapura">Asia/Jayapura (WIT)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="language">Bahasa</Label>
                  <Select 
                    value={settings.general.language} 
                    onValueChange={(value) => updateSetting('general', 'language', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="id">Bahasa Indonesia</SelectItem>
                      <SelectItem value="en">English</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="space-y-0.5">
                  <Label>Mode Maintenance</Label>
                  <p className="text-sm text-muted-foreground">
                    Aktifkan mode maintenance untuk menonaktifkan situs sementara
                  </p>
                </div>
                <Switch
                  checked={settings.general.maintenanceMode}
                  onCheckedChange={(checked) => updateSetting('general', 'maintenanceMode', checked)}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="wedding" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Pengaturan Pernikahan</CardTitle>
              <CardDescription>Konfigurasi informasi pernikahan</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="brideName">Nama Pengantin Wanita</Label>
                  <Input
                    id="brideName"
                    value={settings.wedding.brideName}
                    onChange={(e) => updateSetting('wedding', 'brideName', e.target.value)}
                    placeholder="Nama pengantin wanita"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="groomName">Nama Pengantin Pria</Label>
                  <Input
                    id="groomName"
                    value={settings.wedding.groomName}
                    onChange={(e) => updateSetting('wedding', 'groomName', e.target.value)}
                    placeholder="Nama pengantin pria"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="coupleNames">Nama Pasangan (Tampilan)</Label>
                <Input
                  id="coupleNames"
                  value={settings.wedding.coupleNames}
                  onChange={(e) => updateSetting('wedding', 'coupleNames', e.target.value)}
                  placeholder="Bride & Groom"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="weddingDate">Tanggal Pernikahan</Label>
                  <Input
                    id="weddingDate"
                    type="date"
                    value={settings.wedding.weddingDate}
                    onChange={(e) => updateSetting('wedding', 'weddingDate', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="rsvpDeadline">Batas Waktu RSVP</Label>
                  <Input
                    id="rsvpDeadline"
                    type="date"
                    value={settings.wedding.rsvpDeadline}
                    onChange={(e) => updateSetting('wedding', 'rsvpDeadline', e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="venue">Venue Pernikahan</Label>
                <Input
                  id="venue"
                  value={settings.wedding.venue}
                  onChange={(e) => updateSetting('wedding', 'venue', e.target.value)}
                  placeholder="Nama venue pernikahan"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="maxGuests">Maksimal Tamu per Undangan</Label>
                <Input
                  id="maxGuests"
                  type="number"
                  min="1"
                  max="10"
                  value={settings.wedding.maxGuestsPerInvite}
                  onChange={(e) => updateSetting('wedding', 'maxGuestsPerInvite', parseInt(e.target.value))}
                />
              </div>

              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="space-y-0.5">
                  <Label>Izinkan Plus One</Label>
                  <p className="text-sm text-muted-foreground">
                    Izinkan tamu membawa pendamping tambahan
                  </p>
                </div>
                <Switch
                  checked={settings.wedding.allowPlusOnes}
                  onCheckedChange={(checked) => updateSetting('wedding', 'allowPlusOnes', checked)}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notifications" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Pengaturan Notifikasi</CardTitle>
              <CardDescription>Konfigurasi email dan preferensi peringatan</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="space-y-0.5">
                    <Label>Notifikasi Email</Label>
                    <p className="text-sm text-muted-foreground">
                      Terima notifikasi email umum
                    </p>
                  </div>
                  <Switch
                    checked={settings.notifications.emailNotifications}
                    onCheckedChange={(checked) => updateSetting('notifications', 'emailNotifications', checked)}
                  />
                </div>

                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="space-y-0.5">
                    <Label>Notifikasi RSVP</Label>
                    <p className="text-sm text-muted-foreground">
                      Dapatkan notifikasi ketika tamu melakukan RSVP
                    </p>
                  </div>
                  <Switch
                    checked={settings.notifications.rsvpNotifications}
                    onCheckedChange={(checked) => updateSetting('notifications', 'rsvpNotifications', checked)}
                  />
                </div>

                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="space-y-0.5">
                    <Label>Email Pengingat</Label>
                    <p className="text-sm text-muted-foreground">
                      Kirim email pengingat kepada tamu
                    </p>
                  </div>
                  <Switch
                    checked={settings.notifications.reminderEmails}
                    onCheckedChange={(checked) => updateSetting('notifications', 'reminderEmails', checked)}
                  />
                </div>

                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="space-y-0.5">
                    <Label>Peringatan Admin</Label>
                    <p className="text-sm text-muted-foreground">
                      Terima peringatan sistem dan notifikasi penting
                    </p>
                  </div>
                  <Switch
                    checked={settings.notifications.adminAlerts}
                    onCheckedChange={(checked) => updateSetting('notifications', 'adminAlerts', checked)}
                  />
                </div>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="emailTemplate">Template Email</Label>
                  <Select 
                    value={settings.notifications.emailTemplate} 
                    onValueChange={(value) => updateSetting('notifications', 'emailTemplate', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="default">Template Default</SelectItem>
                      <SelectItem value="elegant">Template Elegan</SelectItem>
                      <SelectItem value="minimal">Template Minimal</SelectItem>
                      <SelectItem value="modern">Template Modern</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex justify-start">
                  <Button
                    variant="outline"
                    onClick={handleTestEmail}
                    disabled={isTestingEmail || !settings.notifications.emailNotifications}
                  >
                    {isTestingEmail ? (
                      <TestTube className="h-4 w-4 mr-2 animate-pulse" />
                    ) : (
                      <EnvelopeIcon className="h-4 w-4 mr-2" />
                    )}
                    {isTestingEmail ? 'Menguji...' : 'Test Email'}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Pengaturan Keamanan</CardTitle>
              <CardDescription>Konfigurasi keamanan dan opsi autentikasi</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="space-y-0.5">
                  <Label>Wajib Verifikasi Email</Label>
                  <p className="text-sm text-muted-foreground">
                    Pengguna harus memverifikasi alamat email mereka
                  </p>
                </div>
                <Switch
                  checked={settings.security.requireEmailVerification}
                  onCheckedChange={(checked) => updateSetting('security', 'requireEmailVerification', checked)}
                />
              </div>

              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="space-y-0.5">
                  <Label>Izinkan Registrasi Tamu</Label>
                  <p className="text-sm text-muted-foreground">
                    Izinkan tamu membuat akun sendiri
                  </p>
                </div>
                <Switch
                  checked={settings.security.allowGuestRegistration}
                  onCheckedChange={(checked) => updateSetting('security', 'allowGuestRegistration', checked)}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="sessionTimeout">Timeout Sesi (menit)</Label>
                  <Input
                    id="sessionTimeout"
                    type="number"
                    min="5"
                    max="1440"
                    value={settings.security.sessionTimeout}
                    onChange={(e) => updateSetting('security', 'sessionTimeout', parseInt(e.target.value))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="maxLoginAttempts">Maksimal Percobaan Login</Label>
                  <Input
                    id="maxLoginAttempts"
                    type="number"
                    min="3"
                    max="10"
                    value={settings.security.maxLoginAttempts}
                    onChange={(e) => updateSetting('security', 'maxLoginAttempts', parseInt(e.target.value))}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="appearance" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Pengaturan Tampilan</CardTitle>
              <CardDescription>Kustomisasi tampilan dan nuansa aplikasi</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="theme">Tema</Label>
                  <Select 
                    value={settings.appearance.theme} 
                    onValueChange={(value) => updateSetting('appearance', 'theme', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="elegant">Elegan</SelectItem>
                      <SelectItem value="modern">Modern</SelectItem>
                      <SelectItem value="classic">Klasik</SelectItem>
                      <SelectItem value="minimal">Minimal</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="primaryColor">Warna Utama</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      id="primaryColor"
                      type="color"
                      value={settings.appearance.primaryColor}
                      onChange={(e) => updateSetting('appearance', 'primaryColor', e.target.value)}
                      className="w-20"
                    />
                    <Input
                      value={settings.appearance.primaryColor}
                      onChange={(e) => updateSetting('appearance', 'primaryColor', e.target.value)}
                      placeholder="#6366f1"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="logoUrl">URL Logo</Label>
                <Input
                  id="logoUrl"
                  value={settings.appearance.logoUrl}
                  onChange={(e) => updateSetting('appearance', 'logoUrl', e.target.value)}
                  placeholder="https://example.com/logo.png"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="customCSS">CSS Kustom</Label>
                <Textarea
                  id="customCSS"
                  value={settings.appearance.customCSS}
                  onChange={(e) => updateSetting('appearance', 'customCSS', e.target.value)}
                  placeholder="/* Tambahkan CSS kustom Anda di sini */"
                  rows={8}
                  className="font-mono text-sm"
                />
                <p className="text-xs text-muted-foreground">
                  CSS kustom akan diterapkan secara global. Hati-hati dengan perubahan yang dapat merusak tampilan.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Settings;
