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
  workspace?: {
    id: string;
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
    console.log('[setup-new-user] Request headers:', Object.fromEntries(req.headers.entries()));

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

    // Step 1: Create or verify profile
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
        throw new Error(`Profile creation failed: ${profileError.message}`);
      }

      profileData = newProfile;
      console.log('[setup-new-user] Profile created successfully');
    } else {
      console.log('[setup-new-user] Profile already exists');
    }

    // Step 2: Check if user already has a workspace
    console.log('[setup-new-user] Checking for existing workspace...');
    const { data: existingMembership, error: membershipCheckError } = await supabaseAdmin
      .from('workspace_members')
      .select('workspace_id')
      .eq('user_id', userId)
      .maybeSingle();

    if (membershipCheckError) {
      console.error('[setup-new-user] Error checking workspace membership:', membershipCheckError);
    }

    let workspaceData: { id: string; name: string } | null = null;

    if (existingMembership?.workspace_id) {
      // Fetch workspace details
      const { data: workspace, error: workspaceError } = await supabaseAdmin
        .from('workspaces')
        .select('id, name')
        .eq('id', existingMembership.workspace_id)
        .single();
      
      if (!workspaceError && workspace) {
        workspaceData = workspace;
        console.log('[setup-new-user] User already has workspace:', workspaceData);
      }
    } else {
      // Step 3: Create workspace
      console.log('[setup-new-user] Creating workspace...');
      const { data: newWorkspace, error: workspaceError } = await supabaseAdmin
        .from('workspaces')
        .insert({
          name: 'Meu Workspace',
          created_by: userId
        })
        .select('id, name')
        .single();

      if (workspaceError) {
        console.error('[setup-new-user] Error creating workspace:', workspaceError);
        throw new Error(`Workspace creation failed: ${workspaceError.message}`);
      }

      workspaceData = newWorkspace;
      console.log('[setup-new-user] Workspace created:', workspaceData);

      // Step 4: Add user as owner
      console.log('[setup-new-user] Adding user as workspace owner...');
      const { error: memberError } = await supabaseAdmin
        .from('workspace_members')
        .insert({
          workspace_id: newWorkspace.id,
          user_id: userId,
          role: 'owner',
          invited_by: userId
        });

      if (memberError) {
        console.error('[setup-new-user] Error creating workspace membership:', memberError);
        throw new Error(`Membership creation failed: ${memberError.message}`);
      }

      console.log('[setup-new-user] Workspace membership created successfully');
    }

    // Success response
    const response: SetupResponse = {
      success: true,
      profile: profileData || undefined,
      workspace: workspaceData || undefined
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
