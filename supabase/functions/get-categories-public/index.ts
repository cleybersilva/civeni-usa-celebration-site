import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_ANON_KEY") ?? ""
  );

  try {
    const url = new URL(req.url);
    const lang = url.searchParams.get('lang') || 'pt';
    const eventId = url.searchParams.get('event_id');

    console.log(`[GET-CATEGORIES-PUBLIC] Fetching categories - lang: ${lang}, eventId: ${eventId}`);

    // Build query with filters
    let query = supabaseClient
      .from('event_category')
      .select('*')
      .eq('is_active', true)
      .order('order_index');

    if (eventId) {
      query = query.eq('event_id', eventId);
    }

    const { data: categories, error } = await query;

    if (error) {
      throw new Error(`Failed to fetch categories: ${error.message}`);
    }

    // Filter by date availability and format response
    const now = new Date();
    const availableCategories = categories
      ?.filter(category => {
        const availableFrom = category.available_from ? new Date(category.available_from) : null;
        const availableUntil = category.available_until ? new Date(category.available_until) : null;
        
        if (availableFrom && availableFrom > now) return false;
        if (availableUntil && availableUntil < now) return false;
        
        return true;
      })
      .map(category => ({
        id: category.id,
        title: category[`title_${lang}`] || category.title_pt,
        description: category[`description_${lang}`] || category.description_pt,
        price: category.is_free ? 0 : (category.price_cents / 100),
        currency: category.currency,
        isFree: category.is_free,
        stripePriceId: category.stripe_price_id,
        order: category.order_index,
        slug: category.slug,
        availableFrom: category.available_from,
        availableUntil: category.available_until,
        quotaTotal: category.quota_total
      })) || [];

    console.log(`[GET-CATEGORIES-PUBLIC] Returning ${availableCategories.length} categories`);

    return new Response(JSON.stringify(availableCategories), {
      headers: { 
        ...corsHeaders, 
        "Content-Type": "application/json",
        "Cache-Control": "no-store, max-age=0"
      },
      status: 200,
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error(`[GET-CATEGORIES-PUBLIC] Error: ${errorMessage}`);

    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});