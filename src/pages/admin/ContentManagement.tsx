import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useWeddingContent, ImportantInfo, ContactInfo, FooterContent } from '@/hooks/useWeddingContent';
import { useToast } from '@/hooks/use-toast';
import { 
  InformationCircleIcon,
  PhoneIcon,
  DocumentTextIcon,
  PlusIcon,
  TrashIcon
} from '@heroicons/react/24/outline';
import { Save, Eye } from 'lucide-react';

const ContentManagement = () => {
  const { 
    importantInfo, 
    contactInfo, 
    footerContent, 
    isLoading, 
    updateImportantInfo,
    updateContactInfo,
    updateFooterContent
  } = useWeddingContent();
  
  const [importantInfoData, setImportantInfoData] = useState<Partial<ImportantInfo>>(importantInfo || {});
  const [contactInfoData, setContactInfoData] = useState<Partial<ContactInfo>>(contactInfo || {});
  const [footerContentData, setFooterContentData] = useState<Partial<FooterContent>>(footerContent || {});
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();

  // Update form data when content loads
  React.useEffect(() => {
    if (importantInfo) setImportantInfoData(importantInfo);
    if (contactInfo) setContactInfoData(contactInfo);
    if (footerContent) setFooterContentData(footerContent);
  }, [importantInfo, contactInfo, footerContent]);

  const handleSaveImportantInfo = async () => {
    setIsSaving(true);
    try {
      await updateImportantInfo(importantInfoData);
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveContactInfo = async () => {
    setIsSaving(true);
    try {
      await updateContactInfo(contactInfoData);
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveFooterContent = async () => {
    setIsSaving(true);
    try {
      await updateFooterContent(footerContentData);
    } finally {
      setIsSaving(false);
    }
  };

  const handlePreview = () => {
    window.open('/', '_blank');
  };

  const addSocialButton = () => {
    const newButton = { text: '', action: '' };
    setFooterContentData(prev => ({
      ...prev,
      social_buttons: [...(prev.social_buttons || []), newButton]
    }));
  };

  const removeSocialButton = (index: number) => {
    setFooterContentData(prev => ({
      ...prev,
      social_buttons: (prev.social_buttons || []).filter((_, i) => i !== index)
    }));
  };

  const updateSocialButton = (index: number, field: string, value: string) => {
    const newButtons = [...(footerContentData.social_buttons || [])];
    newButtons[index] = { ...newButtons[index], [field]: value };
    setFooterContentData(prev => ({
      ...prev,
      social_buttons: newButtons
    }));
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        <span className="ml-2">Loading content...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Manajemen Konten</h1>
          <p className="text-muted-foreground">Kelola konten informasi penting, kontak, dan footer</p>
        </div>
        <Button variant="outline" onClick={handlePreview}>
          <Eye className="h-4 w-4 mr-2" />
          Preview Website
        </Button>
      </div>

      <Tabs defaultValue="important" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="important" className="flex items-center gap-2">
            <InformationCircleIcon className="h-4 w-4" />
            Informasi Penting
          </TabsTrigger>
          <TabsTrigger value="contact" className="flex items-center gap-2">
            <PhoneIcon className="h-4 w-4" />
            Kontak & Bantuan
          </TabsTrigger>
          <TabsTrigger value="footer" className="flex items-center gap-2">
            <DocumentTextIcon className="h-4 w-4" />
            Footer
          </TabsTrigger>
        </TabsList>

        <TabsContent value="important" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <InformationCircleIcon className="h-5 w-5" />
                Informasi Penting
              </CardTitle>
              <CardDescription>
                Kelola informasi penting seperti dress code dan protokol kesehatan
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Visibility Toggle */}
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="space-y-0.5">
                  <Label>Tampilkan Section</Label>
                  <p className="text-sm text-muted-foreground">
                    Aktifkan untuk menampilkan section informasi penting
                  </p>
                </div>
                <Switch
                  checked={importantInfoData.is_visible || false}
                  onCheckedChange={(checked) => setImportantInfoData(prev => ({ ...prev, is_visible: checked }))}
                />
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Judul Section</Label>
                  <Input
                    id="title"
                    value={importantInfoData.title || ''}
                    onChange={(e) => setImportantInfoData(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="Informasi Penting"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="dress_code_title">Judul Dress Code</Label>
                      <Input
                        id="dress_code_title"
                        value={importantInfoData.dress_code_title || ''}
                        onChange={(e) => setImportantInfoData(prev => ({ ...prev, dress_code_title: e.target.value }))}
                        placeholder="Dress Code"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="dress_code_description">Deskripsi Dress Code</Label>
                      <Textarea
                        id="dress_code_description"
                        value={importantInfoData.dress_code_description || ''}
                        onChange={(e) => setImportantInfoData(prev => ({ ...prev, dress_code_description: e.target.value }))}
                        placeholder="Kami mengundang Anda untuk mengenakan pakaian formal..."
                        rows={4}
                      />
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="health_protocol_title">Judul Protokol Kesehatan</Label>
                      <Input
                        id="health_protocol_title"
                        value={importantInfoData.health_protocol_title || ''}
                        onChange={(e) => setImportantInfoData(prev => ({ ...prev, health_protocol_title: e.target.value }))}
                        placeholder="Protokol Kesehatan"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="health_protocol_description">Deskripsi Protokol Kesehatan</Label>
                      <Textarea
                        id="health_protocol_description"
                        value={importantInfoData.health_protocol_description || ''}
                        onChange={(e) => setImportantInfoData(prev => ({ ...prev, health_protocol_description: e.target.value }))}
                        placeholder="Demi kenyamanan bersama, kami menerapkan protokol kesehatan..."
                        rows={4}
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="space-y-0.5">
                      <Label>Tombol Download E-Invitation</Label>
                      <p className="text-sm text-muted-foreground">
                        Aktifkan tombol download undangan digital
                      </p>
                    </div>
                    <Switch
                      checked={importantInfoData.download_invitation_enabled || false}
                      onCheckedChange={(checked) => setImportantInfoData(prev => ({ ...prev, download_invitation_enabled: checked }))}
                    />
                  </div>

                  {importantInfoData.download_invitation_enabled && (
                    <div className="space-y-2">
                      <Label htmlFor="download_invitation_text">Teks Tombol Download</Label>
                      <Input
                        id="download_invitation_text"
                        value={importantInfoData.download_invitation_text || ''}
                        onChange={(e) => setImportantInfoData(prev => ({ ...prev, download_invitation_text: e.target.value }))}
                        placeholder="Download E-Invitation"
                      />
                    </div>
                  )}
                </div>
              </div>

              <div className="flex justify-end">
                <Button onClick={handleSaveImportantInfo} disabled={isSaving}>
                  {isSaving ? (
                    <Save className="h-4 w-4 mr-2 animate-pulse" />
                  ) : (
                    <Save className="h-4 w-4 mr-2" />
                  )}
                  Simpan Informasi Penting
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="contact" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <PhoneIcon className="h-5 w-5" />
                Kontak & Bantuan
              </CardTitle>
              <CardDescription>
                Kelola informasi kontak untuk bantuan tamu
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Visibility Toggle */}
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="space-y-0.5">
                  <Label>Tampilkan Section</Label>
                  <p className="text-sm text-muted-foreground">
                    Aktifkan untuk menampilkan section bantuan
                  </p>
                </div>
                <Switch
                  checked={contactInfoData.is_visible || false}
                  onCheckedChange={(checked) => setContactInfoData(prev => ({ ...prev, is_visible: checked }))}
                />
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="help_title">Judul Section</Label>
                  <Input
                    id="help_title"
                    value={contactInfoData.help_title || ''}
                    onChange={(e) => setContactInfoData(prev => ({ ...prev, help_title: e.target.value }))}
                    placeholder="Butuh Bantuan?"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="help_description">Deskripsi</Label>
                  <Textarea
                    id="help_description"
                    value={contactInfoData.help_description || ''}
                    onChange={(e) => setContactInfoData(prev => ({ ...prev, help_description: e.target.value }))}
                    placeholder="Hubungi kami jika ada pertanyaan atau kendala..."
                    rows={3}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="whatsapp_number">Nomor WhatsApp</Label>
                    <Input
                      id="whatsapp_number"
                      value={contactInfoData.whatsapp_number || ''}
                      onChange={(e) => setContactInfoData(prev => ({ ...prev, whatsapp_number: e.target.value }))}
                      placeholder="+62 812-3456-7890"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="whatsapp_text">Teks Tombol WhatsApp</Label>
                    <Input
                      id="whatsapp_text"
                      value={contactInfoData.whatsapp_text || ''}
                      onChange={(e) => setContactInfoData(prev => ({ ...prev, whatsapp_text: e.target.value }))}
                      placeholder="WhatsApp"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="email_address">Alamat Email</Label>
                    <Input
                      id="email_address"
                      type="email"
                      value={contactInfoData.email_address || ''}
                      onChange={(e) => setContactInfoData(prev => ({ ...prev, email_address: e.target.value }))}
                      placeholder="wedding@dhikasari.com"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email_text">Teks Tombol Email</Label>
                    <Input
                      id="email_text"
                      value={contactInfoData.email_text || ''}
                      onChange={(e) => setContactInfoData(prev => ({ ...prev, email_text: e.target.value }))}
                      placeholder="Email"
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end">
                <Button onClick={handleSaveContactInfo} disabled={isSaving}>
                  {isSaving ? (
                    <Save className="h-4 w-4 mr-2 animate-pulse" />
                  ) : (
                    <Save className="h-4 w-4 mr-2" />
                  )}
                  Simpan Kontak Info
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="footer" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DocumentTextIcon className="h-5 w-5" />
                Footer Content
              </CardTitle>
              <CardDescription>
                Kelola konten footer website
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Visibility Toggle */}
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="space-y-0.5">
                  <Label>Tampilkan Footer</Label>
                  <p className="text-sm text-muted-foreground">
                    Aktifkan untuk menampilkan footer di website
                  </p>
                </div>
                <Switch
                  checked={footerContentData.is_visible || false}
                  onCheckedChange={(checked) => setFooterContentData(prev => ({ ...prev, is_visible: checked }))}
                />
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="couple_names">Nama Pasangan</Label>
                    <Input
                      id="couple_names"
                      value={footerContentData.couple_names || ''}
                      onChange={(e) => setFooterContentData(prev => ({ ...prev, couple_names: e.target.value }))}
                      placeholder="Dhika & Sari"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="wedding_date">Tanggal Pernikahan</Label>
                    <Input
                      id="wedding_date"
                      type="date"
                      value={footerContentData.wedding_date || ''}
                      onChange={(e) => setFooterContentData(prev => ({ ...prev, wedding_date: e.target.value }))}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="footer_description">Deskripsi Footer</Label>
                  <Textarea
                    id="footer_description"
                    value={footerContentData.footer_description || ''}
                    onChange={(e) => setFooterContentData(prev => ({ ...prev, footer_description: e.target.value }))}
                    placeholder="Dengan penuh sukacita, kami mengundang Anda..."
                    rows={3}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="contact_phone">Nomor Telepon</Label>
                    <Input
                      id="contact_phone"
                      value={footerContentData.contact_phone || ''}
                      onChange={(e) => setFooterContentData(prev => ({ ...prev, contact_phone: e.target.value }))}
                      placeholder="+62 812-3456-7890"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="contact_email">Email</Label>
                    <Input
                      id="contact_email"
                      type="email"
                      value={footerContentData.contact_email || ''}
                      onChange={(e) => setFooterContentData(prev => ({ ...prev, contact_email: e.target.value }))}
                      placeholder="wedding@dhikasari.com"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="contact_address">Alamat</Label>
                    <Input
                      id="contact_address"
                      value={footerContentData.contact_address || ''}
                      onChange={(e) => setFooterContentData(prev => ({ ...prev, contact_address: e.target.value }))}
                      placeholder="Jakarta, Indonesia"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="thank_you_title">Judul Terima Kasih</Label>
                  <Input
                    id="thank_you_title"
                    value={footerContentData.thank_you_title || ''}
                    onChange={(e) => setFooterContentData(prev => ({ ...prev, thank_you_title: e.target.value }))}
                    placeholder="Terima Kasih Atas Doa & Restu Anda"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="thank_you_message">Pesan Terima Kasih</Label>
                  <Textarea
                    id="thank_you_message"
                    value={footerContentData.thank_you_message || ''}
                    onChange={(e) => setFooterContentData(prev => ({ ...prev, thank_you_message: e.target.value }))}
                    placeholder="Kehadiran dan doa restu dari keluarga serta sahabat tercinta..."
                    rows={4}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="copyright_text">Teks Copyright</Label>
                  <Input
                    id="copyright_text"
                    value={footerContentData.copyright_text || ''}
                    onChange={(e) => setFooterContentData(prev => ({ ...prev, copyright_text: e.target.value }))}
                    placeholder="© 2025 Dhika & Sari Wedding Invitation"
                  />
                </div>
              </div>

              {/* Social Buttons */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label>Tombol Social Media</Label>
                  <Button variant="outline" size="sm" onClick={addSocialButton}>
                    <PlusIcon className="h-4 w-4 mr-2" />
                    Tambah Tombol
                  </Button>
                </div>

                <div className="space-y-4">
                  {(footerContentData.social_buttons || []).map((button, index) => (
                    <div key={index} className="p-4 border rounded-lg space-y-4">
                      <div className="flex items-center justify-between">
                        <h4 className="font-medium">Tombol {index + 1}</h4>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => removeSocialButton(index)}
                        >
                          <TrashIcon className="h-4 w-4" />
                        </Button>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Teks Tombol</Label>
                          <Input
                            value={button.text}
                            onChange={(e) => updateSocialButton(index, 'text', e.target.value)}
                            placeholder="📱 WhatsApp"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Action</Label>
                          <Input
                            value={button.action}
                            onChange={(e) => updateSocialButton(index, 'action', e.target.value)}
                            placeholder="whatsapp, email, location"
                          />
                        </div>
                      </div>
                    </div>
                  ))}

                  {(!footerContentData.social_buttons || footerContentData.social_buttons.length === 0) && (
                    <div className="text-center py-8 border-2 border-dashed border-muted rounded-lg">
                      <p className="text-muted-foreground">Belum ada tombol social media. Tambahkan yang pertama!</p>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex justify-end">
                <Button onClick={handleSaveFooterContent} disabled={isSaving}>
                  {isSaving ? (
                    <Save className="h-4 w-4 mr-2 animate-pulse" />
                  ) : (
                    <Save className="h-4 w-4 mr-2" />
                  )}
                  Simpan Footer Content
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ContentManagement;