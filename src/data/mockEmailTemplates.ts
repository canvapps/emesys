
export interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  content: string;
  template_type: 'invitation' | 'reminder' | 'thank_you';
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export const mockEmailTemplates: EmailTemplate[] = [
  {
    id: '1',
    name: 'Undangan Utama',
    subject: 'Undangan Pernikahan Dhika & Sari - 15 Februari 2025',
    content: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%); padding: 40px; text-align: center;">
          <h1 style="color: #2c3e50; margin-bottom: 10px;">Dhika & Sari</h1>
          <p style="color: #7f8c8d; font-size: 18px;">Mengundang Anda dalam acara pernikahan kami</p>
        </div>
        
        <div style="padding: 40px; background: #ffffff;">
          <p style="color: #2c3e50; font-size: 16px; line-height: 1.6;">
            Assalamu'alaikum Warahmatullahi Wabarakatuh
          </p>
          
          <p style="color: #2c3e50; font-size: 16px; line-height: 1.6;">
            Dengan memohon rahmat dan ridho Allah SWT, kami bermaksud mengundang 
            Bapak/Ibu/Saudara/i untuk hadir dalam acara pernikahan kami:
          </p>
          
          <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="color: #2c3e50; text-align: center;">Akad Nikah</h3>
            <p style="text-align: center; margin: 5px 0;">15 Februari 2025</p>
            <p style="text-align: center; margin: 5px 0;">Pukul 08:00 - 10:00 WIB</p>
            <p style="text-align: center; margin: 5px 0;">Masjid Al-Ikhlas</p>
          </div>
          
          <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="color: #2c3e50; text-align: center;">Resepsi</h3>
            <p style="text-align: center; margin: 5px 0;">15 Februari 2025</p>
            <p style="text-align: center; margin: 5px 0;">Pukul 18:00 - 22:00 WIB</p>
            <p style="text-align: center; margin: 5px 0;">The Grand Ballroom</p>
          </div>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="{{invitation_link}}" style="background: #3498db; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">
              Buka Undangan
            </a>
          </div>
          
          <p style="color: #2c3e50; font-size: 16px; line-height: 1.6;">
            Merupakan suatu kehormatan dan kebahagiaan bagi kami apabila 
            Bapak/Ibu/Saudara/i berkenan hadir untuk memberikan doa restu.
          </p>
          
          <p style="color: #2c3e50; font-size: 16px; line-height: 1.6;">
            Wassalamu'alaikum Warahmatullahi Wabarakatuh
          </p>
          
          <div style="text-align: center; margin-top: 30px;">
            <p style="color: #7f8c8d;">Dhika & Sari</p>
            <p style="color: #7f8c8d;">Beserta Keluarga</p>
          </div>
        </div>
      </div>
    `,
    template_type: 'invitation',
    is_active: true,
    created_at: '2024-01-15T08:00:00Z',
    updated_at: '2024-01-15T08:00:00Z'
  },
  {
    id: '2',
    name: 'Reminder H-7',
    subject: 'Pengingat: Pernikahan Dhika & Sari - 7 Hari Lagi',
    content: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: #f39c12; padding: 30px; text-align: center; color: white;">
          <h1 style="margin-bottom: 10px;">Pengingat</h1>
          <p style="font-size: 18px;">Pernikahan Dhika & Sari</p>
          <p style="font-size: 24px; font-weight: bold;">7 Hari Lagi!</p>
        </div>
        
        <div style="padding: 30px; background: #ffffff;">
          <p style="color: #2c3e50; font-size: 16px; line-height: 1.6;">
            Halo {{guest_name}},
          </p>
          
          <p style="color: #2c3e50; font-size: 16px; line-height: 1.6;">
            Kami ingin mengingatkan bahwa acara pernikahan kami akan segera tiba!
          </p>
          
          <div style="background: #ecf0f1; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="color: #2c3e50; text-align: center;">15 Februari 2025</h3>
            <p style="text-align: center; margin: 5px 0;">Akad: 08:00 WIB di Masjid Al-Ikhlas</p>
            <p style="text-align: center; margin: 5px 0;">Resepsi: 18:00 WIB di The Grand Ballroom</p>
          </div>
          
          <p style="color: #2c3e50; font-size: 16px; line-height: 1.6;">
            Jangan lupa untuk mengkonfirmasi kehadiran Anda jika belum melakukannya.
          </p>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="{{invitation_link}}" style="background: #e74c3c; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">
              Konfirmasi Kehadiran
            </a>
          </div>
        </div>
      </div>
    `,
    template_type: 'reminder',
    is_active: true,
    created_at: '2024-01-15T08:00:00Z',
    updated_at: '2024-01-15T08:00:00Z'
  },
  {
    id: '3',
    name: 'Terima Kasih',
    subject: 'Terima Kasih - Dhika & Sari',
    content: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: #27ae60; padding: 30px; text-align: center; color: white;">
          <h1 style="margin-bottom: 10px;">Terima Kasih</h1>
          <p style="font-size: 18px;">Atas kehadiran dan doa restu Anda</p>
        </div>
        
        <div style="padding: 30px; background: #ffffff;">
          <p style="color: #2c3e50; font-size: 16px; line-height: 1.6;">
            Kepada {{guest_name}},
          </p>
          
          <p style="color: #2c3e50; font-size: 16px; line-height: 1.6;">
            Terima kasih telah hadir dan memberikan doa restu pada acara pernikahan kami. 
            Kehadiran Anda sangat berarti bagi kami.
          </p>
          
          <p style="color: #2c3e50; font-size: 16px; line-height: 1.6;">
            Semoga Allah SWT membalas kebaikan Anda dengan kebaikan yang berlipat ganda.
          </p>
          
          <div style="text-align: center; margin-top: 30px;">
            <p style="color: #7f8c8d;">Dhika & Sari</p>
            <p style="color: #7f8c8d;">Beserta Keluarga</p>
          </div>
        </div>
      </div>
    `,
    template_type: 'thank_you',
    is_active: true,
    created_at: '2024-01-15T08:00:00Z',
    updated_at: '2024-01-15T08:00:00Z'
  }
];
