import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import Stripe from "https://esm.sh/stripe@14.21.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[SYNC-CATEGORY-STRIPE] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    { auth: { persistSession: false } }
  );

  try {
    logStep("Function started");

    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) throw new Error("STRIPE_SECRET_KEY is not set");

    const { categoryId } = await req.json();
    if (!categoryId) throw new Error("categoryId is required");

    logStep("Processing category", { categoryId });

    // Get category data
    const { data: category, error: categoryError } = await supabaseClient
      .from('event_category')
      .select('*')
      .eq('id', categoryId)
      .single();

    if (categoryError || !category) {
      throw new Error(`Category not found: ${categoryError?.message}`);
    }

    logStep("Category found", { slug: category.slug, isFree: category.is_free });

    const stripe = new Stripe(stripeKey, { apiVersion: "2023-10-16" });

    if (category.is_free) {
      // Free category - clear Stripe IDs and mark as synced
      await supabaseClient
        .from('event_category')
        .update({
          stripe_product_id: null,
          stripe_price_id: null,
          sync_status: 'ok',
          sync_error: null,
          updated_at: new Date().toISOString()
        })
        .eq('id', categoryId);

      logStep("Free category synced");
      return new Response(JSON.stringify({ success: true, message: 'Free category synced' }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    // Paid category - sync with Stripe
    let productId = category.stripe_product_id;
    
    if (!productId) {
      // Create Stripe product
      const product = await stripe.products.create({
        name: category.title_pt,
        description: category.description_pt || undefined,
        metadata: {
          category_id: categoryId,
          event_slug: 'civeni-ii',
        }
      });
      productId = product.id;
      logStep("Created Stripe product", { productId });
    }

    // Create new price (Stripe best practice)
    const price = await stripe.prices.create({
      product: productId,
      unit_amount: category.price_cents,
      currency: category.currency.toLowerCase(),
      active: category.is_active,
      metadata: {
        category_id: categoryId,
        slug: category.slug,
      }
    });

    logStep("Created Stripe price", { priceId: price.id, amount: price.unit_amount });

    // Update category with Stripe IDs
    await supabaseClient
      .from('event_category')
      .update({
        stripe_product_id: productId,
        stripe_price_id: price.id,
        sync_status: 'ok',
        sync_error: null,
        updated_at: new Date().toISOString()
      })
      .eq('id', categoryId);

    // Log audit
    await supabaseClient
      .from('event_category_audit')
      .insert({
        category_id: categoryId,
        action: 'stripe_sync',
        new_data: { stripe_product_id: productId, stripe_price_id: price.id },
        changed_by: null // System action
      });

    logStep("Category synced successfully");

    return new Response(JSON.stringify({ 
      success: true, 
      stripe_product_id: productId,
      stripe_price_id: price.id 
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR", { message: errorMessage });

    // Update sync status with error
    if (req.url.includes('categoryId')) {
      try {
        const { categoryId } = await req.json();
        await supabaseClient
          .from('event_category')
          .update({
            sync_status: 'error',
            sync_error: errorMessage,
            updated_at: new Date().toISOString()
          })
          .eq('id', categoryId);
      } catch (updateError) {
        logStep("Error updating sync status", { updateError });
      }
    }

    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});