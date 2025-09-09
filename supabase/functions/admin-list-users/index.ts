import { serve } from "https://deno.land/std/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Missing Authorization header' }), { 
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    // Create Supabase client with service role key for admin operations
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Verify the requesting user is an admin by checking their JWT
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Invalid authentication' }), { 
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Check if user is admin in admin_users table
    const { data: adminUser, error: adminError } = await supabase
      .from('admin_users')
      .select('user_type, is_admin_root')
      .eq('email', user.email)
      .single();

    if (adminError || !adminUser || !['admin', 'admin_root'].includes(adminUser.user_type)) {
      return new Response(JSON.stringify({ error: 'Access denied: admin privileges required' }), { 
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Parse query parameters
    const url = new URL(req.url);
    const search = url.searchParams.get('q') || '';
    const page = parseInt(url.searchParams.get('page') || '1');
    const pageSize = parseInt(url.searchParams.get('pageSize') || '50');
    const offset = Math.max(0, (page - 1) * pageSize);

    // Fetch admin users with search and pagination
    let query = supabase
      .from('admin_users')
      .select('id, email, user_type, is_admin_root, created_at')
      .order('created_at', { ascending: false })
      .range(offset, offset + pageSize - 1);

    if (search) {
      query = query.ilike('email', `%${search}%`);
    }

    const { data: users, error: usersError } = await query;

    if (usersError) {
      console.error('Error fetching users:', usersError);
      return new Response(JSON.stringify({ error: 'Failed to fetch users' }), { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Transform the data to match expected format
    const transformedUsers = users?.map(user => ({
      user_id: user.id,
      email: user.email,
      user_type: user.user_type,
      is_admin_root: user.is_admin_root,
      created_at: user.created_at
    })) || [];

    return new Response(JSON.stringify({ 
      data: transformedUsers,
      count: transformedUsers.length,
      page,
      pageSize
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Function error:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), { 
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});