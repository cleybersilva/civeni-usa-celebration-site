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
    console.log('🔍 Admin list users request received');
    
    const authHeader = req.headers.get('Authorization');
    console.log('📋 Authorization header present:', !!authHeader);
    
    if (!authHeader) {
      console.error('❌ Missing Authorization header');
      return new Response(JSON.stringify({ error: 'Missing Authorization header' }), { 
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    console.log('🔧 Creating Supabase client with service role');
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Verify the session token using admin_sessions table
    const sessionToken = authHeader.replace('Bearer ', '');
    console.log('🔑 Validating session token:', sessionToken.substring(0, 10) + '...');
    
    const { data: session, error: sessionError } = await supabase
      .from('admin_sessions')
      .select('email')
      .eq('token', sessionToken)
      .gt('expires_at', new Date().toISOString())
      .single();
    
    if (sessionError) {
      console.error('❌ Session query error:', sessionError);
      return new Response(JSON.stringify({ 
        error: 'Invalid or expired session', 
        details: sessionError.message 
      }), { 
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
    
    if (!session) {
      console.error('❌ No session found');
      return new Response(JSON.stringify({ error: 'Invalid or expired session' }), { 
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    console.log('✅ Session validated for email:', session.email);

    // Check if user is admin in admin_users table
    const { data: adminUser, error: adminError } = await supabase
      .from('admin_users')
      .select('user_type, is_admin_root')
      .eq('email', session.email)
      .single();

    if (adminError) {
      console.error('❌ Admin user query error:', adminError);
      return new Response(JSON.stringify({ 
        error: 'Failed to verify admin privileges',
        details: adminError.message 
      }), { 
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    if (!adminUser || !['admin', 'admin_root'].includes(adminUser.user_type)) {
      console.error('❌ Access denied - user type:', adminUser?.user_type);
      return new Response(JSON.stringify({ error: 'Access denied: admin privileges required' }), { 
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    console.log('✅ Admin access granted for:', session.email, 'type:', adminUser.user_type);

    // Parse query parameters
    const url = new URL(req.url);
    const search = url.searchParams.get('q') || '';
    const page = parseInt(url.searchParams.get('page') || '1');
    const pageSize = parseInt(url.searchParams.get('pageSize') || '50');
    const offset = Math.max(0, (page - 1) * pageSize);

    console.log('📄 Query params:', { search, page, pageSize, offset });

    // Fetch admin users with search and pagination
    let query = supabase
      .from('admin_users')
      .select('id, email, user_type, is_admin_root, created_at', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(offset, offset + pageSize - 1);

    if (search) {
      query = query.ilike('email', `%${search}%`);
    }

    console.log('🔍 Executing query...');
    const { data: users, error: usersError, count } = await query;

    if (usersError) {
      console.error('❌ Error fetching users:', usersError);
      return new Response(JSON.stringify({ 
        error: 'Failed to fetch users',
        details: usersError.message 
      }), { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    console.log('✅ Users fetched:', users?.length || 0, 'total:', count);

    // Transform the data to match expected format
    const transformedUsers = users?.map(user => ({
      user_id: user.id,
      email: user.email,
      user_type: user.user_type,
      is_admin_root: user.is_admin_root,
      created_at: user.created_at
    })) || [];

    const response = { 
      data: transformedUsers,
      count: count || 0,
      page,
      pageSize
    };

    console.log('📤 Sending response:', response);

    return new Response(JSON.stringify(response), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('💥 Function error:', error);
    return new Response(JSON.stringify({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : String(error)
    }), { 
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});