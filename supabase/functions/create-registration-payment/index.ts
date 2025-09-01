import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

// Simple in-memory rate limiting
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT_WINDOW = 60000; // 1 minute
const RATE_LIMIT_MAX = 10; // max requests per window

function checkRateLimit(clientIP: string): boolean {
  const now = Date.now();
  const key = clientIP;
  const current = rateLimitMap.get(key);
  
  if (!current || now > current.resetTime) {
    rateLimitMap.set(key, { count: 1, resetTime: now + RATE_LIMIT_WINDOW });
    return true;
  }
  
  if (current.count >= RATE_LIMIT_MAX) {
    return false;
  }
  
  current.count++;
  return true;
}

serve(async (req) => {
  console.log(`[PAYMENT] Request received: ${req.method} ${req.url}`);
  
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  // Rate limiting
  const clientIP = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown';
  if (!checkRateLimit(clientIP)) {
    console.log(`[PAYMENT] Rate limit exceeded for IP: ${clientIP}`);
    return new Response(JSON.stringify({ success: false, error: 'Rate limit exceeded' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 429,
    });
  }

  try {
    const body = await req.json().catch(() => ({}));
    console.log(`[PAYMENT] Request body:`, body);
    
    const origin = req.headers.get('origin') || 'https://wdkeqxfglmritghmakma.lovableproject.com';

    // Check all required environment variables
    const stripeKey = Deno.env.get('STRIPE_SECRET_KEY');
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    
    console.log(`[PAYMENT] Environment check - Stripe: ${!!stripeKey}, Supabase URL: ${!!supabaseUrl}, Service Key: ${!!supabaseServiceKey}`);
    
    if (!stripeKey) {
      console.error('[PAYMENT] STRIPE_SECRET_KEY not found');
      return new Response(JSON.stringify({ success: false, error: 'STRIPE_SECRET_KEY ausente' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      });
    }

    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('[PAYMENT] Supabase environment variables missing');
      return new Response(JSON.stringify({ success: false, error: 'Supabase configuration missing' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      });
    }

    const stripe = new Stripe(stripeKey, { apiVersion: '2023-10-16' });
    console.log('[PAYMENT] Stripe client initialized');

    // Load category to get price_cents
    const supabase = createClient(
      supabaseUrl,
      supabaseServiceKey,
      { auth: { persistSession: false } }
    );
    console.log('[PAYMENT] Supabase client initialized');

    const { categoryId, email } = body as { categoryId?: string; email?: string };
    console.log(`[PAYMENT] Processing payment for category: ${categoryId}, email: ${email}`);
    
    if (!categoryId) {
      console.error('[PAYMENT] Category ID not provided');
      return new Response(JSON.stringify({ success: false, error: 'Categoria não informada' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      });
    }

    const { data: category, error: catErr } = await supabase
      .from('event_category')
      .select('title_pt, price_cents, currency, is_free')
      .eq('id', categoryId)
      .single();

    if (catErr) {
      console.error('[PAYMENT] Database error fetching category:', catErr);
      return new Response(JSON.stringify({ success: false, error: 'Erro ao buscar categoria: ' + catErr.message }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      });
    }

    if (!category) {
      console.error('[PAYMENT] Category not found:', categoryId);
      return new Response(JSON.stringify({ success: false, error: 'Categoria não encontrada' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 404,
      });
    }

    console.log('[PAYMENT] Category found:', category);

    if (category.is_free) {
      console.log('[PAYMENT] Free category, no payment required');
      return new Response(JSON.stringify({ success: true, payment_required: false }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      });
    }

    // Always use price_data - never stripe_price_id to avoid test/live conflicts
    const unitAmount = category.price_cents && category.price_cents > 0 ? category.price_cents : 7000; // Default R$ 70.00
    const currency = (category.currency || 'BRL').toLowerCase();
    
    console.log(`[PAYMENT] Creating Stripe session - Amount: ${unitAmount}, Currency: ${currency}`);
    
    const lineItem = {
      price_data: {
        currency,
        product_data: { 
          name: category.title_pt || 'Inscrição CIVENI 2025',
          description: 'Inscrição para o III CIVENI 2025'
        },
        unit_amount: unitAmount,
      },
      quantity: 1,
    };

    console.log('[PAYMENT] Line item created:', lineItem);

    const sessionConfig = {
      mode: 'payment' as const,
      payment_method_types: ['card'],
      line_items: [lineItem],
      success_url: `${origin}/registration-success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/registration-canceled`,
      customer_email: email,
      metadata: {
        category_id: categoryId,
        email: email || 'no-email'
      }
    };

    console.log('[PAYMENT] Creating Stripe session with config:', sessionConfig);

    const session = await stripe.checkout.sessions.create(sessionConfig);

    console.log('[PAYMENT] Stripe session created:', session.id, session.url);

    if (!session?.url) {
      console.error('[PAYMENT] Stripe session created but no URL returned');
      return new Response(JSON.stringify({ success: false, error: 'Stripe não retornou URL' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      });
    }

    console.log('[PAYMENT] Success - returning session URL');
    return new Response(JSON.stringify({ success: true, payment_required: true, url: session.url }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });
  } catch (error: any) {
    console.error('[PAYMENT] Unexpected error:', error);
    console.error('[PAYMENT] Error stack:', error.stack);
    return new Response(JSON.stringify({ 
      success: false, 
      error: error.message || 'Erro interno',
      details: error.stack ? error.stack.substring(0, 500) : 'No stack trace'
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});