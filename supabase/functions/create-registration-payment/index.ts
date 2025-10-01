import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[CREATE-REGISTRATION-PAYMENT] ${step}${detailsStr}`);
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Function started");

    const body = await req.json();
    const {
      email,
      fullName,
      categoryId,
      batchId,
      couponCode,
      cursoId,
      turmaId,
      participantType,
      registrationType,
      currency = 'BRL'
    } = body;

    logStep("Request body received", { email, categoryId, batchId, participantType });

    // Initialize Supabase with service role for database operations
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    logStep("Supabase client initialized");

    // Get category details
    const { data: category, error: categoryError } = await supabase
      .from('event_category')
      .select('*')
      .eq('id', categoryId)
      .eq('is_active', true)
      .single();

    if (categoryError || !category) {
      logStep("Category not found", { categoryError });
      return new Response(
        JSON.stringify({ success: false, error: "Categoria não encontrada" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
      );
    }

    logStep("Category found", { categoryTitle: category.title_pt, isFree: category.is_free });

    // Get current lote (batch) details for pricing
    const { data: lote, error: loteError } = await supabase
      .from('lotes')
      .select('*')
      .eq('id', batchId)
      .eq('ativo', true)
      .single();

    if (loteError || !lote) {
      logStep("Batch not found", { loteError });
      return new Response(
        JSON.stringify({ success: false, error: "Lote não encontrado" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
      );
    }

    logStep("Batch found", { loteName: lote.nome, priceCents: lote.price_cents });

    // Validate coupon if provided using robust RPC
    let finalPrice = category.is_free ? 0 : (category.price_cents || lote.price_cents);
    let validCoupon = null;

    if (couponCode) {
      logStep("Validating coupon with RPC", { couponCode, email, participantType, categoryId });
      
      const { data: couponResult, error: couponError } = await supabase.rpc('validate_coupon_robust', {
        p_code: couponCode,
        p_email: email,
        p_participant_type: participantType,
        p_category_id: categoryId
      });

      logStep("Coupon RPC result", { result: couponResult, error: couponError });

      if (couponError) {
        logStep("Coupon RPC error", { couponError });
        return new Response(
          JSON.stringify({ success: false, error: "Erro ao validar cupom" }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
        );
      }

      if (!couponResult || !couponResult.is_valid) {
        logStep("Coupon invalid", { reason: couponResult?.reason, message: couponResult?.message });
        return new Response(
          JSON.stringify({ 
            success: false, 
            error: couponResult?.message || "Código de cupom inválido" 
          }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
        );
      }

      // Cupom válido - criar objeto compatível
      validCoupon = {
        id: couponResult.coupon_id,
        discount_type: couponResult.discount_type,
        discount_value: couponResult.discount_value,
        category_id: couponResult.category_id
      };
      
      // Apply coupon discount
      if (validCoupon.discount_type === 'category_override') {
        // Override with coupon category (free for professors)
        finalPrice = 0;
      } else if (validCoupon.discount_type === 'percentage') {
        finalPrice = Math.round(finalPrice * (1 - (validCoupon.discount_value / 100)));
      } else if (validCoupon.discount_type === 'fixed') {
        finalPrice = Math.max(0, finalPrice - (validCoupon.discount_value * 100)); // Convert to cents
      }

      logStep("Coupon applied", { discountType: validCoupon.discount_type, finalPrice });
    }

    // Create registration record - now without FK constraint issues
    const registrationData = {
      email: email.toLowerCase(),
      full_name: fullName,
      category_id: categoryId, // Store the event_category ID directly (no FK constraint now)
      batch_id: batchId,
      curso_id: cursoId,
      turma_id: turmaId,
      participant_type: participantType,
      payment_status: finalPrice === 0 ? 'completed' : 'pending',
      amount_paid: finalPrice / 100, // Convert to decimal
      currency: currency,
      coupon_code: couponCode || null,
    };

    logStep("Creating registration", registrationData);

    const { data: registration, error: registrationError } = await supabase
      .from('event_registrations')
      .insert(registrationData)
      .select()
      .single();

    if (registrationError) {
      logStep("Registration creation failed", { registrationError });
      return new Response(
        JSON.stringify({ success: false, error: "Erro ao criar inscrição" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
      );
    }

    logStep("Registration created", { registrationId: registration.id });

    // Update coupon usage and register redemption if used
    if (validCoupon) {
      // Registrar resgate para evitar reuso
      const { error: redemptionError } = await supabase
        .from('coupon_redemptions')
        .insert({
          coupon_id: validCoupon.id,
          email: email.toLowerCase()
        });
      
      if (redemptionError) {
        logStep("Redemption registration failed", { redemptionError });
        // Continue mesmo se falhar (pode ser duplicate key se já registrado antes)
      }
      
      // Buscar o contador atual e incrementar
      const { data: currentCoupon } = await supabase
        .from('coupon_codes')
        .select('used_count')
        .eq('id', validCoupon.id)
        .single();
      
      // Incrementar contador de uso
      await supabase
        .from('coupon_codes')
        .update({ used_count: (currentCoupon?.used_count || 0) + 1 })
        .eq('id', validCoupon.id);
      
      logStep("Coupon usage updated and redemption registered");
    }

    // If free registration, send confirmation and return success
    if (finalPrice === 0) {
      logStep("Free registration completed");
      
      // Send confirmation notifications
      try {
        await supabase.functions.invoke('send-registration-confirmation', {
          body: {
            email,
            fullName,
            registrationId: registration.id,
            categoryName: category.title_pt,
            isFree: true
          }
        });
        logStep("Confirmation notification sent");
      } catch (notificationError) {
        logStep("Notification failed", { notificationError });
        // Don't fail the registration if notification fails
      }

      return new Response(
        JSON.stringify({ 
          success: true, 
          payment_required: false,
          registration_id: registration.id,
          message: "Inscrição gratuita realizada com sucesso!"
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
      );
    }

    // For paid registrations, create Stripe session
    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
      apiVersion: "2023-10-16",
    });

    logStep("Creating Stripe session");

    // Check if customer exists
    const customers = await stripe.customers.list({ email, limit: 1 });
    let customerId;
    if (customers.data.length > 0) {
      customerId = customers.data[0].id;
      logStep("Existing customer found", { customerId });
    }

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      customer_email: customerId ? undefined : email,
      payment_method_types: ['card', 'pix'],
      line_items: [
        {
          price_data: {
            currency: currency.toLowerCase(),
            product_data: {
              name: `${category.title_pt}${
                category.slug === 'participante-externo' || category.slug === 'convidado' 
                  ? '' 
                  : ` - ${lote.nome}`
              }`,
              description: `Inscrição para Civeni 2025 - ${fullName}`,
            },
            unit_amount: finalPrice,
          },
          quantity: 1,
        },
      ],
      mode: "payment",
      success_url: `${req.headers.get("origin")}/registration-success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${req.headers.get("origin")}/registration-canceled`,
      metadata: {
        registration_id: registration.id,
        participant_email: email,
        participant_name: fullName,
      },
    });

    // Update registration with Stripe session ID
    await supabase
      .from('event_registrations')
      .update({ stripe_session_id: session.id })
      .eq('id', registration.id);

    logStep("Stripe session created", { sessionId: session.id, url: session.url });

    return new Response(
      JSON.stringify({
        success: true,
        payment_required: true,
        url: session.url,
        registration_id: registration.id,
        session_id: session.id
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