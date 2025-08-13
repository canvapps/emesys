
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { Resend } from "npm:resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface SendEmailRequest {
  campaignId: string;
  templateId: string;
  recipientGroup: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { campaignId, templateId, recipientGroup }: SendEmailRequest = await req.json();

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log('Starting email campaign:', { campaignId, templateId, recipientGroup });

    // Get email template
    const { data: template, error: templateError } = await supabase
      .from('email_templates')
      .select('*')
      .eq('id', templateId)
      .single();

    if (templateError || !template) {
      console.error('Template error:', templateError);
      return new Response(
        JSON.stringify({ error: 'Template not found' }),
        { status: 404, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Get recipients based on group
    let guestsQuery = supabase.from('guests').select('*');

    switch (recipientGroup) {
      case 'confirmed':
        guestsQuery = guestsQuery.eq('attendance_status', 'attending');
        break;
      case 'pending':
        guestsQuery = guestsQuery.eq('attendance_status', 'pending');
        break;
      case 'family':
        guestsQuery = guestsQuery.ilike('name', '%family%');
        break;
      case 'friends':
        guestsQuery = guestsQuery.ilike('name', '%friend%');
        break;
      default:
        // 'all' - no additional filter
        break;
    }

    const { data: guests, error: guestsError } = await guestsQuery;

    if (guestsError) {
      console.error('Guests error:', guestsError);
      return new Response(
        JSON.stringify({ error: 'Failed to fetch guests' }),
        { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Update campaign status to sending
    await supabase
      .from('email_campaigns')
      .update({ 
        status: 'sending', 
        total_recipients: guests?.length || 0 
      })
      .eq('id', campaignId);

    let sentCount = 0;
    let failedCount = 0;

    // Send emails to each guest
    for (const guest of guests || []) {
      try {
        // Personalize email content
        const personalizedContent = template.content
          .replace(/{{name}}/g, guest.name)
          .replace(/{{email}}/g, guest.email);

        const emailResponse = await resend.emails.send({
          from: "Wedding Invitation <onboarding@resend.dev>",
          to: [guest.email],
          subject: template.subject,
          html: personalizedContent,
        });

        console.log(`Email sent to ${guest.email}:`, emailResponse);

        // Log successful email
        await supabase.from('email_logs').insert({
          campaign_id: campaignId,
          guest_id: guest.id,
          recipient_email: guest.email,
          subject: template.subject,
          status: 'sent'
        });

        sentCount++;
      } catch (emailError) {
        console.error(`Failed to send email to ${guest.email}:`, emailError);

        // Log failed email
        await supabase.from('email_logs').insert({
          campaign_id: campaignId,
          guest_id: guest.id,
          recipient_email: guest.email,
          subject: template.subject,
          status: 'failed',
          error_message: emailError.message
        });

        failedCount++;
      }
    }

    // Update campaign final status
    const finalStatus = failedCount === 0 ? 'sent' : (sentCount > 0 ? 'sent' : 'failed');
    await supabase
      .from('email_campaigns')
      .update({ 
        status: finalStatus,
        sent_count: sentCount,
        failed_count: failedCount,
        sent_at: new Date().toISOString()
      })
      .eq('id', campaignId);

    console.log('Campaign completed:', { sentCount, failedCount, finalStatus });

    return new Response(
      JSON.stringify({ 
        success: true, 
        sentCount, 
        failedCount,
        totalRecipients: guests?.length || 0
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );

  } catch (error: any) {
    console.error("Error in send-email function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
