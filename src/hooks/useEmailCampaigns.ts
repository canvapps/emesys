
import { useState, useEffect } from 'react';
import { useToast } from './use-toast';

export interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  content: string;
  template_type: 'invitation' | 'reminder' | 'thank_you' | 'custom';
  is_active: boolean;
  created_at: string;
}

export interface EmailCampaign {
  id: string;
  name: string;
  template_id: string;
  recipient_group: string;
  status: 'draft' | 'sending' | 'sent' | 'failed';
  total_recipients: number;
  sent_count: number;
  failed_count: number;
  sent_at?: string;
  created_at: string;
  email_templates?: EmailTemplate;
}

export interface Guest {
  id: string;
  name: string;
  email: string;
  phone?: string;
  invitation_type: 'akad' | 'resepsi' | 'both';
  attendance_status: 'pending' | 'attending' | 'not_attending' | 'maybe';
  guest_count: number;
  message?: string;
  rsvp_date?: string;
  created_at: string;
}

// Mock data for development
const mockTemplates: EmailTemplate[] = [
  {
    id: '1',
    name: 'Undangan Utama',
    subject: 'Undangan Pernikahan Dhika & Sari',
    content: `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%); padding: 40px; text-align: center;">
        <h1 style="color: #2c3e50;">Dhika & Sari</h1>
        <p style="color: #7f8c8d; font-size: 18px;">Mengundang Anda dalam acara pernikahan kami</p>
      </div>
      <div style="padding: 40px; background: #ffffff;">
        <p>Assalamu'alaikum Warahmatullahi Wabarakatuh</p>
        <p>Dengan memohon rahmat dan ridho Allah SWT, kami bermaksud mengundang Bapak/Ibu/Saudara/i untuk hadir dalam acara pernikahan kami:</p>
        <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="text-align: center;">15 Februari 2025</h3>
          <p style="text-align: center;">Pukul 08:00 - 22:00 WIB</p>
        </div>
      </div>
    </div>`,
    template_type: 'invitation',
    is_active: true,
    created_at: new Date().toISOString(),
  },
  {
    id: '2',
    name: 'Reminder RSVP',
    subject: 'Pengingat: Konfirmasi Kehadiran',
    content: `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background: #f39c12; padding: 30px; text-align: center; color: white;">
        <h1>Pengingat RSVP</h1>
        <p style="font-size: 18px;">Jangan lupa konfirmasi kehadiran Anda</p>
      </div>
      <div style="padding: 30px;">
        <p>Halo,</p>
        <p>Kami menunggu konfirmasi kehadiran Anda untuk acara pernikahan kami.</p>
      </div>
    </div>`,
    template_type: 'reminder',
    is_active: true,
    created_at: new Date().toISOString(),
  },
  {
    id: '3',
    name: 'Terima Kasih',
    subject: 'Terima Kasih atas Kehadiran Anda',
    content: `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background: #27ae60; padding: 30px; text-align: center; color: white;">
        <h1>Terima Kasih</h1>
        <p style="font-size: 18px;">Atas kehadiran dan doa restu Anda</p>
      </div>
      <div style="padding: 30px;">
        <p>Terima kasih telah hadir dan memberikan doa restu pada acara pernikahan kami.</p>
      </div>
    </div>`,
    template_type: 'thank_you',
    is_active: true,
    created_at: new Date().toISOString(),
  },
];

const mockGuests: Guest[] = [
  {
    id: '1',
    name: 'Ahmad Suryadi',
    email: 'ahmad@example.com',
    phone: '081234567890',
    invitation_type: 'both',
    attendance_status: 'attending',
    guest_count: 2,
    created_at: new Date().toISOString(),
  },
  {
    id: '2',
    name: 'Siti Nurhaliza',
    email: 'siti@example.com',
    phone: '081234567891',
    invitation_type: 'both',
    attendance_status: 'pending',
    guest_count: 1,
    created_at: new Date().toISOString(),
  },
  {
    id: '3',
    name: 'Budi Santoso',
    email: 'budi@example.com',
    phone: '081234567892',
    invitation_type: 'resepsi',
    attendance_status: 'attending',
    guest_count: 3,
    created_at: new Date().toISOString(),
  },
  {
    id: '4',
    name: 'Maya Indira',
    email: 'maya@example.com',
    phone: '081234567893',
    invitation_type: 'both',
    attendance_status: 'maybe',
    guest_count: 1,
    created_at: new Date().toISOString(),
  },
  {
    id: '5',
    name: 'Rizki Pratama',
    email: 'rizki@example.com',
    phone: '081234567894',
    invitation_type: 'both',
    attendance_status: 'not_attending',
    guest_count: 1,
    created_at: new Date().toISOString(),
  },
];

const mockCampaigns: EmailCampaign[] = [
  {
    id: '1',
    name: 'Undangan Akad',
    template_id: '1',
    recipient_group: 'akad',
    status: 'sent',
    total_recipients: 50,
    sent_count: 48,
    failed_count: 2,
    sent_at: new Date().toISOString(),
    created_at: new Date().toISOString(),
    email_templates: mockTemplates[0],
  },
  {
    id: '2',
    name: 'Reminder RSVP Batch 1',
    template_id: '2',
    recipient_group: 'pending',
    status: 'draft',
    total_recipients: 20,
    sent_count: 0,
    failed_count: 0,
    created_at: new Date().toISOString(),
    email_templates: mockTemplates[1],
  },
];

export const useEmailCampaigns = () => {
  const [campaigns, setCampaigns] = useState<EmailCampaign[]>([]);
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [guests, setGuests] = useState<Guest[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  // Fetch campaigns (using mock data for now)
  const fetchCampaigns = async () => {
    try {
      setIsLoading(true);
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 500));
      setCampaigns(mockCampaigns);
    } catch (error: any) {
      console.error('Error fetching campaigns:', error);
      toast({
        title: "Error",
        description: "Gagal memuat campaigns",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch templates (using mock data for now)
  const fetchTemplates = async () => {
    try {
      setIsLoading(true);
      await new Promise(resolve => setTimeout(resolve, 300));
      setTemplates(mockTemplates);
    } catch (error: any) {
      console.error('Error fetching templates:', error);
      toast({
        title: "Error",
        description: "Gagal memuat templates",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch guests (using mock data for now)
  const fetchGuests = async () => {
    try {
      setIsLoading(true);
      await new Promise(resolve => setTimeout(resolve, 300));
      setGuests(mockGuests);
    } catch (error: any) {
      console.error('Error fetching guests:', error);
      toast({
        title: "Error",
        description: "Gagal memuat guests",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Create campaign
  const createCampaign = async (campaignData: {
    name: string;
    templateId: string;
    recipientGroup: string;
  }) => {
    setIsLoading(true);
    try {
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const template = templates.find(t => t.id === campaignData.templateId);
      const recipientCount = getRecipientCount(campaignData.recipientGroup);
      
      const newCampaign: EmailCampaign = {
        id: Date.now().toString(),
        name: campaignData.name,
        template_id: campaignData.templateId,
        recipient_group: campaignData.recipientGroup,
        status: 'draft',
        total_recipients: recipientCount,
        sent_count: 0,
        failed_count: 0,
        created_at: new Date().toISOString(),
        email_templates: template,
      };

      setCampaigns(prev => [newCampaign, ...prev]);

      toast({
        title: "Campaign Berhasil Dibuat!",
        description: "Campaign email baru telah dibuat dan siap dikirim.",
      });

      return newCampaign;
    } catch (error: any) {
      console.error('Error creating campaign:', error);
      toast({
        title: "Error",
        description: "Gagal membuat campaign",
        variant: "destructive",
      });
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // Send campaign
  const sendCampaign = async (campaignId: string, templateId: string, recipientGroup: string) => {
    setIsLoading(true);
    try {
      // Simulate sending emails
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const campaign = campaigns.find(c => c.id === campaignId);
      if (!campaign) throw new Error('Campaign not found');

      const sentCount = campaign.total_recipients - Math.floor(Math.random() * 3); // Random success rate
      const failedCount = campaign.total_recipients - sentCount;

      // Update campaign status
      setCampaigns(prev => prev.map(c => 
        c.id === campaignId 
          ? { 
              ...c, 
              status: 'sent' as const,
              sent_count: sentCount,
              failed_count: failedCount,
              sent_at: new Date().toISOString()
            }
          : c
      ));

      toast({
        title: "Email Campaign Terkirim!",
        description: `Berhasil mengirim ${sentCount} email dari ${campaign.total_recipients} total penerima.`,
      });

      return { sentCount, totalRecipients: campaign.total_recipients, failedCount };
    } catch (error: any) {
      console.error('Error sending campaign:', error);
      toast({
        title: "Error",
        description: "Gagal mengirim campaign",
        variant: "destructive",
      });
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // Create template
  const createTemplate = async (templateData: {
    name: string;
    subject: string;
    content: string;
    type: EmailTemplate['template_type'];
  }) => {
    setIsLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 500));

      const newTemplate: EmailTemplate = {
        id: Date.now().toString(),
        name: templateData.name,
        subject: templateData.subject,
        content: templateData.content,
        template_type: templateData.type,
        is_active: true,
        created_at: new Date().toISOString(),
      };

      setTemplates(prev => [newTemplate, ...prev]);

      toast({
        title: "Template Tersimpan!",
        description: "Template email berhasil disimpan.",
      });

      return newTemplate;
    } catch (error: any) {
      console.error('Error creating template:', error);
      toast({
        title: "Error",
        description: "Gagal menyimpan template",
        variant: "destructive",
      });
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // Helper function to get recipient count based on group
  const getRecipientCount = (recipientGroup: string): number => {
    switch (recipientGroup) {
      case 'all':
        return guests.length;
      case 'pending':
        return guests.filter(g => g.attendance_status === 'pending').length;
      case 'attending':
        return guests.filter(g => g.attendance_status === 'attending').length;
      case 'akad':
        return guests.filter(g => g.invitation_type === 'akad' || g.invitation_type === 'both').length;
      case 'resepsi':
        return guests.filter(g => g.invitation_type === 'resepsi' || g.invitation_type === 'both').length;
      default:
        return 0;
    }
  };

  // Get email stats
  const getEmailStats = () => {
    const totalCampaigns = campaigns.length;
    const totalSent = campaigns.reduce((sum, campaign) => sum + (campaign.sent_count || 0), 0);
    const totalFailed = campaigns.reduce((sum, campaign) => sum + (campaign.failed_count || 0), 0);
    
    return {
      totalCampaigns,
      totalSent,
      totalFailed,
      activeTemplates: templates.filter(t => t.is_active).length,
      totalGuests: guests.length,
      pendingRSVP: guests.filter(g => g.attendance_status === 'pending').length,
    };
  };

  useEffect(() => {
    fetchCampaigns();
    fetchTemplates();
    fetchGuests();
  }, []);

  return {
    campaigns,
    templates,
    guests,
    isLoading,
    createCampaign,
    sendCampaign,
    createTemplate,
    fetchCampaigns,
    fetchTemplates,
    fetchGuests,
    getEmailStats
  };
};
