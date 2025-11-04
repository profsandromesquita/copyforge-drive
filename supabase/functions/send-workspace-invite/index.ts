import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.7";
import { Resend } from "https://esm.sh/resend@4.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));
const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface InviteRequest {
  workspace_id: string;
  email: string;
  role: string;
  token: string;
  workspace_name: string;
  inviter_name: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { workspace_id, email, role, token, workspace_name, inviter_name }: InviteRequest = await req.json();
    
    console.log("Sending invite email to:", email);

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    // Check if user already has an account
    const { data: existingUser } = await supabase
      .from('profiles')
      .select('id')
      .eq('email', email)
      .single();

    const hasAccount = !!existingUser;
    const baseUrl = req.headers.get("origin") || "http://localhost:8080";
    const inviteLink = hasAccount 
      ? `${baseUrl}/accept-invite?token=${token}`
      : `${baseUrl}/signup-invite?token=${token}`;

    const roleName = role === 'admin' ? 'Administrador' : 'Editor';

    const emailHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
            .content { background: #ffffff; padding: 30px; border: 1px solid #e5e7eb; border-top: none; }
            .button { display: inline-block; background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; margin: 20px 0; font-weight: 600; }
            .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 14px; }
            .info-box { background: #f3f4f6; padding: 15px; border-radius: 6px; margin: 20px 0; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🎉 Convite para Workspace</h1>
            </div>
            <div class="content">
              <p>Olá!</p>
              <p><strong>${inviter_name}</strong> convidou você para fazer parte do workspace <strong>${workspace_name}</strong>.</p>
              
              <div class="info-box">
                <p style="margin: 0;"><strong>Cargo oferecido:</strong> ${roleName}</p>
              </div>

              ${!hasAccount ? `
                <p>Como você ainda não possui uma conta, precisará criar uma antes de aceitar o convite.</p>
              ` : ''}

              <div style="text-align: center;">
                <a href="${inviteLink}" class="button">
                  ${hasAccount ? 'Aceitar Convite' : 'Criar Conta e Aceitar'}
                </a>
              </div>

              <p style="color: #6b7280; font-size: 14px; margin-top: 30px;">
                Este convite expira em 7 dias. Se você não deseja fazer parte deste workspace, pode simplesmente ignorar este email.
              </p>
            </div>
            <div class="footer">
              <p>CopyDrive - Sistema de Gestão de Copys</p>
            </div>
          </div>
        </body>
      </html>
    `;

    const { error } = await resend.emails.send({
      from: "CopyDrive <onboarding@resend.dev>",
      to: [email],
      subject: `Convite para workspace: ${workspace_name}`,
      html: emailHtml,
    });

    if (error) {
      console.error("Error sending email:", error);
      throw error;
    }

    console.log("Email sent successfully to:", email);

    return new Response(
      JSON.stringify({ success: true, hasAccount }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          ...corsHeaders,
        },
      }
    );
  } catch (error: any) {
    console.error("Error in send-workspace-invite function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);