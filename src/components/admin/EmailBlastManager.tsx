
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Mail, Send, Users, FileText, Activity, Clock, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { useEmailCampaigns, EmailTemplate } from '@/hooks/useEmailCampaigns';

const EmailBlastManager = () => {
  const {
    campaigns,
    templates,
    guests,
    isLoading,
    createCampaign,
    sendCampaign,
    createTemplate,
    getEmailStats
  } = useEmailCampaigns();

  const [newCampaign, setNewCampaign] = useState({
    name: '',
    templateId: '',
    recipientGroup: 'all'
  });

  const [newTemplate, setNewTemplate] = useState({
    name: '',
    subject: '',
    content: '',
    type: 'custom' as EmailTemplate['template_type']
  });

  const [createCampaignDialogOpen, setCreateCampaignDialogOpen] = useState(false);
  const [createTemplateDialogOpen, setCreateTemplateDialogOpen] = useState(false);

  const stats = getEmailStats();

  const handleCreateCampaign = async () => {
    if (!newCampaign.name || !newCampaign.templateId) return;

    try {
      await createCampaign(newCampaign);
      setNewCampaign({ name: '', templateId: '', recipientGroup: 'all' });
      setCreateCampaignDialogOpen(false);
    } catch (error) {
      console.error('Failed to create campaign:', error);
    }
  };

  const handleCreateTemplate = async () => {
    if (!newTemplate.name || !newTemplate.subject || !newTemplate.content) return;

    try {
      await createTemplate(newTemplate);
      setNewTemplate({ name: '', subject: '', content: '', type: 'custom' });
      setCreateTemplateDialogOpen(false);
    } catch (error) {
      console.error('Failed to create template:', error);
    }
  };

  const handleSendCampaign = async (campaignId: string, templateId: string, recipientGroup: string) => {
    try {
      await sendCampaign(campaignId, templateId, recipientGroup);
    } catch (error) {
      console.error('Failed to send campaign:', error);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'sent':
        return <Badge variant="default" className="bg-green-100 text-green-800"><CheckCircle className="w-3 h-3 mr-1" />Terkirim</Badge>;
      case 'sending':
        return <Badge variant="default" className="bg-blue-100 text-blue-800"><Clock className="w-3 h-3 mr-1" />Mengirim</Badge>;
      case 'failed':
        return <Badge variant="destructive"><XCircle className="w-3 h-3 mr-1" />Gagal</Badge>;
      case 'draft':
        return <Badge variant="secondary"><AlertCircle className="w-3 h-3 mr-1" />Draft</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getRecipientGroupLabel = (group: string) => {
    switch (group) {
      case 'all': return 'Semua Tamu';
      case 'pending': return 'Menunggu RSVP';
      case 'attending': return 'Akan Hadir';
      case 'akad': return 'Akad Nikah';
      case 'resepsi': return 'Resepsi';
      default: return group;
    }
  };

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Campaign</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalCampaigns}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Email Terkirim</CardTitle>
            <Mail className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalSent}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Tamu</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalGuests}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Template Aktif</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.activeTemplates}</div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="campaigns" className="space-y-4">
        <TabsList>
          <TabsTrigger value="campaigns">Email Campaigns</TabsTrigger>
          <TabsTrigger value="templates">Email Templates</TabsTrigger>
        </TabsList>

        <TabsContent value="campaigns" className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-medium">Email Campaigns</h3>
            <Dialog open={createCampaignDialogOpen} onOpenChange={setCreateCampaignDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Mail className="w-4 h-4 mr-2" />
                  Buat Campaign Baru
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>Buat Email Campaign Baru</DialogTitle>
                  <DialogDescription>
                    Buat campaign email untuk mengirim undangan atau pengingat ke tamu.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="campaign-name">Nama Campaign</Label>
                    <Input
                      id="campaign-name"
                      value={newCampaign.name}
                      onChange={(e) => setNewCampaign({ ...newCampaign, name: e.target.value })}
                      placeholder="Masukkan nama campaign"
                    />
                  </div>
                  <div>
                    <Label htmlFor="template-select">Template Email</Label>
                    <Select value={newCampaign.templateId} onValueChange={(value) => setNewCampaign({ ...newCampaign, templateId: value })}>
                      <SelectTrigger>
                        <SelectValue placeholder="Pilih template" />
                      </SelectTrigger>
                      <SelectContent>
                        {templates.map((template) => (
                          <SelectItem key={template.id} value={template.id}>
                            {template.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="recipient-group">Grup Penerima</Label>
                    <Select value={newCampaign.recipientGroup} onValueChange={(value) => setNewCampaign({ ...newCampaign, recipientGroup: value })}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Semua Tamu</SelectItem>
                        <SelectItem value="pending">Menunggu RSVP</SelectItem>
                        <SelectItem value="attending">Akan Hadir</SelectItem>
                        <SelectItem value="akad">Akad Nikah</SelectItem>
                        <SelectItem value="resepsi">Resepsi</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setCreateCampaignDialogOpen(false)}>
                    Batal
                  </Button>
                  <Button onClick={handleCreateCampaign} disabled={isLoading}>
                    {isLoading ? 'Membuat...' : 'Buat Campaign'}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

          <div className="grid gap-4">
            {campaigns.map((campaign) => (
              <Card key={campaign.id}>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-lg">{campaign.name}</CardTitle>
                      <CardDescription>
                        Template: {campaign.email_templates?.name} • Penerima: {getRecipientGroupLabel(campaign.recipient_group)}
                      </CardDescription>
                    </div>
                    {getStatusBadge(campaign.status)}
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex justify-between items-center">
                    <div className="grid grid-cols-3 gap-4 text-sm">
                      <div>
                        <span className="text-muted-foreground">Total:</span>
                        <div className="font-medium">{campaign.total_recipients} penerima</div>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Terkirim:</span>
                        <div className="font-medium text-green-600">{campaign.sent_count}</div>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Gagal:</span>
                        <div className="font-medium text-red-600">{campaign.failed_count}</div>
                      </div>
                    </div>
                    {campaign.status === 'draft' && (
                      <Button 
                        onClick={() => handleSendCampaign(campaign.id, campaign.template_id, campaign.recipient_group)}
                        disabled={isLoading}
                      >
                        <Send className="w-4 h-4 mr-2" />
                        {isLoading ? 'Mengirim...' : 'Kirim Sekarang'}
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}

            {campaigns.length === 0 && (
              <Card>
                <CardContent className="text-center py-8">
                  <Mail className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">Belum ada email campaign. Buat yang pertama!</p>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        <TabsContent value="templates" className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-medium">Email Templates</h3>
            <Dialog open={createTemplateDialogOpen} onOpenChange={setCreateTemplateDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline">
                  <FileText className="w-4 h-4 mr-2" />
                  Buat Template Baru
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-lg">
                <DialogHeader>
                  <DialogTitle>Buat Email Template Baru</DialogTitle>
                  <DialogDescription>
                    Buat template email yang dapat digunakan untuk campaign.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="template-name">Nama Template</Label>
                    <Input
                      id="template-name"
                      value={newTemplate.name}
                      onChange={(e) => setNewTemplate({ ...newTemplate, name: e.target.value })}
                      placeholder="Masukkan nama template"
                    />
                  </div>
                  <div>
                    <Label htmlFor="template-subject">Subject Email</Label>
                    <Input
                      id="template-subject"
                      value={newTemplate.subject}
                      onChange={(e) => setNewTemplate({ ...newTemplate, subject: e.target.value })}
                      placeholder="Masukkan subject email"
                    />
                  </div>
                  <div>
                    <Label htmlFor="template-type">Tipe Template</Label>
                    <Select value={newTemplate.type} onValueChange={(value: any) => setNewTemplate({ ...newTemplate, type: value })}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="invitation">Undangan</SelectItem>
                        <SelectItem value="reminder">Pengingat</SelectItem>
                        <SelectItem value="thank_you">Terima Kasih</SelectItem>
                        <SelectItem value="custom">Custom</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="template-content">Konten Email (HTML)</Label>
                    <Textarea
                      id="template-content"
                      value={newTemplate.content}
                      onChange={(e) => setNewTemplate({ ...newTemplate, content: e.target.value })}
                      placeholder="Masukkan konten email dalam format HTML"
                      rows={6}
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setCreateTemplateDialogOpen(false)}>
                    Batal
                  </Button>
                  <Button onClick={handleCreateTemplate} disabled={isLoading}>
                    {isLoading ? 'Menyimpan...' : 'Simpan Template'}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

          <div className="grid gap-4">
            {templates.map((template) => (
              <Card key={template.id}>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-lg">{template.name}</CardTitle>
                      <CardDescription>{template.subject}</CardDescription>
                    </div>
                    <div className="flex gap-2">
                      <Badge variant={template.template_type === 'invitation' ? 'default' : 'secondary'}>
                        {template.template_type === 'invitation' ? 'Undangan' : 
                         template.template_type === 'reminder' ? 'Pengingat' :
                         template.template_type === 'thank_you' ? 'Terima Kasih' : 'Custom'}
                      </Badge>
                      {template.is_active && (
                        <Badge variant="outline" className="text-green-600 border-green-600">
                          Aktif
                        </Badge>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-sm text-muted-foreground">
                    Dibuat: {new Date(template.created_at).toLocaleDateString('id-ID')}
                  </div>
                </CardContent>
              </Card>
            ))}

            {templates.length === 0 && (
              <Card>
                <CardContent className="text-center py-8">
                  <FileText className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">Belum ada template email. Buat yang pertama!</p>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default EmailBlastManager;
