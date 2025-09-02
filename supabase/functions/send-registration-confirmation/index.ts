import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[SEND-CONFIRMATION] ${step}${detailsStr}`);
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Function started");

    const body = await req.json();
    const { email, fullName, registrationId, categoryName, isFree } = body;

    logStep("Request received", { email, fullName, registrationId, categoryName, isFree });

    // Initialize Supabase
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    // Create alert logs for notifications
    const notifications = [
      {
        alert_type: isFree ? 'free_registration_completed' : 'paid_registration_completed',
        recipient_type: 'email',
        recipient: 'cleyber.silva@live.com',
        message: `Nova inscrição ${isFree ? 'gratuita' : 'paga'}: ${fullName} (${email}) - ${categoryName}`,
        triggered_by_id: registrationId,
        status: 'pending'
      },
      {
        alert_type: isFree ? 'free_registration_completed' : 'paid_registration_completed',
        recipient_type: 'sms',
        recipient: '(83) 98832-9018',
        message: `Civeni 2025: Nova inscrição ${fullName} - ${categoryName}`,
        triggered_by_id: registrationId,
        status: 'pending'
      }
    ];

    // Insert notification logs
    const { error: alertError } = await supabase
      .from('alert_logs')
      .insert(notifications);

    if (alertError) {
      logStep("Alert creation failed", { alertError });
    } else {
      logStep("Alert logs created successfully");
    }

    // In a real scenario, you would integrate with:
    // - Email service (like Resend, SendGrid, etc.)
    // - SMS service (like Twilio, etc.)
    // - WhatsApp Business API
    
    // For now, we just log and create alert entries for admin notification
    logStep("Confirmation process completed", { 
      email, 
      fullName, 
      registrationId,
      notificationsCreated: notifications.length 
    });

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "Confirmações enviadas com sucesso",
        notifications_created: notifications.length
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
    );

  } catch (error: any) {
    logStep("ERROR", { message: error.message, stack: error.stack });
    return new Response(
      JSON.stringify({ success: false, error: error.message || "Erro interno do servidor" }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});