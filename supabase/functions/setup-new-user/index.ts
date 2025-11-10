import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.78.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface SetupRequest {
  userId: string;
  email: string;
  name?: string;
}

interface SetupResponse {
  success: boolean;
  profile?: {
    id: string;
    email: string;
    name: string;
  };
  error?: string;
  details?: string;
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('[setup-new-user] Request received');

    // Parse request body
    const { userId, email, name }: SetupRequest = await req.json();
    
    if (!userId || !email) {
      console.error('[setup-new-user] Missing required fields:', { userId, email });
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Missing userId or email' 
        } as SetupResponse),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    console.log('[setup-new-user] Setting up user:', { userId, email, name });
    
    // Validar variáveis de ambiente
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    
    if (!supabaseUrl || !serviceRoleKey) {
      console.error('[setup-new-user] Missing environment variables');
      throw new Error('Missing Supabase configuration');
    }

    // Create Supabase client with SERVICE ROLE (bypasses RLS)
    const supabaseAdmin = createClient(
      supabaseUrl,
      serviceRoleKey,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );
    
    console.log('[setup-new-user] Supabase admin client created');

    // Create or verify profile ONLY
    console.log('[setup-new-user] Creating profile...');
    const { data: existingProfile, error: profileCheckError } = await supabaseAdmin
      .from('profiles')
      .select('id, email, name')
      .eq('id', userId)
      .maybeSingle();

    if (profileCheckError) {
      console.error('[setup-new-user] Error checking profile:', profileCheckError);
      throw new Error(`Profile check failed: ${profileCheckError.message}`);
    }

    let profileData = existingProfile;

    if (!existingProfile) {
      const { data: newProfile, error: profileError } = await supabaseAdmin
        .from('profiles')
        .insert({
          id: userId,
          email: email,
          name: name || email.split('@')[0]
        })
        .select('id, email, name')
        .single();

      if (profileError) {
        console.error('[setup-new-user] Error creating profile:', profileError);
        
        // If duplicate key error, profile was created by trigger - fetch it
        if (profileError.code === '23505') {
          console.log('[setup-new-user] Profile already exists (created by trigger), fetching...');
          const { data: fetchedProfile, error: fetchError } = await supabaseAdmin
            .from('profiles')
            .select('id, email, name')
            .eq('id', userId)
            .single();
          
          if (fetchError) {
            throw new Error(`Profile fetch after duplicate failed: ${fetchError.message}`);
          }
          
          profileData = fetchedProfile;
          console.log('[setup-new-user] Profile fetched successfully after duplicate');
        } else {
          throw new Error(`Profile creation failed: ${profileError.message}`);
        }
      } else {
        profileData = newProfile;
        console.log('[setup-new-user] Profile created successfully');
      }
    } else {
      console.log('[setup-new-user] Profile already exists');
    }

    // Success response
    const response: SetupResponse = {
      success: true,
      profile: profileData || undefined
    };

    console.log('[setup-new-user] Setup completed successfully:', response);

    return new Response(
      JSON.stringify(response),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('[setup-new-user] Fatal error:', error);
    console.error('[setup-new-user] Error stack:', error instanceof Error ? error.stack : 'No stack trace');
    
    // Registrar erro no banco de dados para debug
    try {
      const supabaseUrl = Deno.env.get('SUPABASE_URL');
      const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
      
      if (supabaseUrl && serviceRoleKey) {
        const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);
        const { userId } = await req.clone().json();
        
        await supabaseAdmin.from('signup_errors').insert({
          user_id: userId,
          error_message: error instanceof Error ? error.message : 'Unknown error',
          error_detail: error instanceof Error ? error.stack : JSON.stringify(error)
        });
        
        console.log('[setup-new-user] Error logged to database');
      }
    } catch (logError) {
      console.error('[setup-new-user] Failed to log error:', logError);
    }
    
    const errorResponse: SetupResponse = {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      details: error instanceof Error ? error.stack : undefined
    };

    return new Response(
      JSON.stringify(errorResponse),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
