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

    // Step 2: Check if user already has a workspace
    console.log('[setup-new-user] Checking for existing workspace...');
    const { data: existingMemberships, error: membershipCheckError } = await supabaseAdmin
      .from('workspace_members')
      .select('workspace_id')
      .eq('user_id', userId)
      .limit(1);

    const existingMembership = existingMemberships?.[0];

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
      // Check if user already has a workspace by created_by
      console.log('[setup-new-user] Checking for workspace created by user...');
      const { data: ownedWorkspace } = await supabaseAdmin
        .from('workspaces')
        .select('id, name')
        .eq('created_by', userId)
        .maybeSingle();

      if (ownedWorkspace) {
        // Workspace exists but no membership - create membership
        workspaceData = ownedWorkspace;
        console.log('[setup-new-user] Found existing workspace without membership:', workspaceData);
        
        const { error: memberError } = await supabaseAdmin
          .from('workspace_members')
          .insert({
            workspace_id: ownedWorkspace.id,
            user_id: userId,
            role: 'owner',
            invited_by: userId
          });

        if (memberError) {
          // Ignore duplicate errors
          if (memberError.code === '23505') {
            console.log('[setup-new-user] Membership already exists (duplicate key), continuing...');
          } else {
            console.error('[setup-new-user] Error creating membership:', memberError);
            throw new Error(`Membership creation failed: ${memberError.message}`);
          }
        } else {
          console.log('[setup-new-user] Membership created for existing workspace');
        }
      } else {
        // Step 3: Create workspace with robust error handling
        console.log('[setup-new-user] Creating new workspace...');
        
        try {
          const { data: newWorkspace, error: workspaceError } = await supabaseAdmin
            .from('workspaces')
            .insert({
              name: 'Meu Workspace',
              created_by: userId
            })
            .select('id, name')
            .single();

          if (workspaceError) {
            console.log('[setup-new-user] Workspace creation error:', workspaceError);
            
            // If duplicate error, workspace might exist, try to fetch it
            if (workspaceError.code === '23505') {
              console.log('[setup-new-user] Duplicate key conflict, searching for existing workspace...');
              
              // Try multiple queries to find the workspace
              let existingWs = null;
              
              // First try: search by created_by
              const { data: wsByCreator } = await supabaseAdmin
                .from('workspaces')
                .select('id, name')
                .eq('created_by', userId)
                .maybeSingle();
              
              if (wsByCreator) {
                existingWs = wsByCreator;
                console.log('[setup-new-user] Found workspace by creator:', existingWs);
              } else {
                // Second try: check if there's a membership (maybe workspace was created but trigger failed)
                console.log('[setup-new-user] No workspace found by creator, checking memberships...');
                const { data: membershipData } = await supabaseAdmin
                  .from('workspace_members')
                  .select('workspace_id, workspaces(id, name)')
                  .eq('user_id', userId)
                  .maybeSingle();
                
                if (membershipData?.workspaces) {
                  const ws = Array.isArray(membershipData.workspaces) 
                    ? membershipData.workspaces[0] 
                    : membershipData.workspaces;
                  existingWs = ws as { id: string; name: string };
                  console.log('[setup-new-user] Found workspace through membership:', existingWs);
                }
              }
              
              if (existingWs) {
                workspaceData = existingWs;
                console.log('[setup-new-user] Using existing workspace:', workspaceData);
              } else {
                // Last resort: create workspace with unique name
                console.log('[setup-new-user] No workspace found after conflict, creating with unique name...');
                const uniqueName = `Meu Workspace ${Date.now()}`;
                const { data: retryWorkspace, error: retryError } = await supabaseAdmin
                  .from('workspaces')
                  .insert({
                    name: uniqueName,
                    created_by: userId
                  })
                  .select('id, name')
                  .single();
                
                if (retryError) {
                  console.error('[setup-new-user] Failed to create workspace even with unique name:', retryError);
                  throw new Error(`Workspace creation failed after retry: ${retryError.message}`);
                }
                
                workspaceData = retryWorkspace;
                console.log('[setup-new-user] Created workspace with unique name:', workspaceData);
              }
            } else {
              console.error('[setup-new-user] Non-duplicate workspace creation error:', workspaceError);
              throw new Error(`Workspace creation failed: ${workspaceError.message}`);
            }
          } else {
            workspaceData = newWorkspace;
            console.log('[setup-new-user] Workspace created successfully:', workspaceData);
          }

          // Step 4: Add user as owner (only if workspace was just created)
          if (workspaceData) {
            console.log('[setup-new-user] Adding user as workspace owner...');
            const { error: memberError } = await supabaseAdmin
              .from('workspace_members')
              .insert({
                workspace_id: workspaceData.id,
                user_id: userId,
                role: 'owner',
                invited_by: userId
              });

            if (memberError) {
              // Ignore duplicate errors
              if (memberError.code === '23505') {
                console.log('[setup-new-user] Membership already exists (duplicate key), continuing...');
              } else {
                console.error('[setup-new-user] Error creating workspace membership:', memberError);
                throw new Error(`Membership creation failed: ${memberError.message}`);
              }
            } else {
              console.log('[setup-new-user] Workspace membership created successfully');
            }
          }
        } catch (error) {
          console.error('[setup-new-user] Error in workspace creation flow:', error);
          throw error;
        }
      }
    }
    
    // Verify subscription was created by trigger
    if (workspaceData) {
      const { data: subscription } = await supabaseAdmin
        .from('workspace_subscriptions')
        .select('id')
        .eq('workspace_id', workspaceData.id)
        .maybeSingle();
      
      console.log('[setup-new-user] Subscription check:', subscription ? 'exists' : 'not found');
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
