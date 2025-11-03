import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import Stripe from 'https://esm.sh/stripe@14.21.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Cache simples em memória (5 minutos)
const cache = new Map<string, { data: any; timestamp: number }>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutos

const normalize = (s: string): string => {
  return s
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toUpperCase()
    .trim();
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const stripeKey = Deno.env.get('STRIPE_SECRET_KEY');
    if (!stripeKey) {
      throw new Error('STRIPE_SECRET_KEY not configured');
    }

    const stripe = new Stripe(stripeKey, {
      apiVersion: '2023-10-16',
    });

    const url = new URL(req.url);
    const name = url.searchParams.get('name');
    const expectedCents = url.searchParams.get('amount');

    if (!name) {
      return new Response(
        JSON.stringify({ error: 'Missing name parameter' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Verificar cache
    const cacheKey = `${name}_${expectedCents || ''}`;
    const cached = cache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      console.log(`✅ Cache hit for ${name}`);
      return new Response(JSON.stringify(cached.data), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log(`🔍 Resolving payment method for: ${name}`);

    // Buscar charges dos últimos 90 dias
    const createdGte = Math.floor((Date.now() - 90 * 24 * 3600 * 1000) / 1000);

    const charges = await stripe.charges.list({
      created: { gte: createdGte },
      limit: 100,
      expand: ['data.payment_method_details'],
    });

    // Normalizar nome alvo
    const targetName = normalize(name);

    // Ranking por similaridade
    const scored = charges.data
      .filter((c) => c.status === 'succeeded' && c.paid)
      .map((c) => {
        const billingName = c.billing_details?.name || '';
        const normalizedBilling = normalize(billingName);
        
        // Score por nome (2 pontos se contém o nome)
        const nameScore = normalizedBilling.includes(targetName) ? 2 : 0;
        
        // Score por valor (1 ponto se valor bate)
        const valueScore =
          expectedCents && Math.abs(c.amount - parseInt(expectedCents)) <= 100 ? 1 : 0;

        return { c, score: nameScore + valueScore };
      })
      .filter((x) => x.score > 0)
      .sort((a, b) => b.score - a.score || b.c.created - a.c.created);

    const hit = scored[0]?.c;

    if (!hit) {
      const result = { methodLabel: '—', methodRaw: null, chargeId: null };
      cache.set(cacheKey, { data: result, timestamp: Date.now() });
      return new Response(JSON.stringify(result), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const type = hit.payment_method_details?.type || 'other';
    let label = 'Outros';

    if (type === 'card') {
      const brand = hit.payment_method_details?.card?.brand || 'cartão';
      label = `Cartão (${brand})`;
    } else if (type === 'boleto') {
      label = 'Boleto';
    } else if (type === 'pix') {
      label = 'Pix';
    }

    const result = {
      methodLabel: label,
      methodRaw: type,
      chargeId: hit.id,
      last4: hit.payment_method_details?.card?.last4 || null,
    };

    // Armazenar em cache
    cache.set(cacheKey, { data: result, timestamp: Date.now() });

    console.log(`✅ Resolved: ${label} for ${name}`);

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('❌ Error resolving payment method:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
