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
    const baseUrl = "https://app.copydrive.ai";
    const inviteLink = hasAccount 
      ? `${baseUrl}/accept-invite?token=${token}`
      : `${baseUrl}/signup-invite?token=${token}`;

    const roleName = role === 'admin' ? 'Administrador' : 'Editor';

    const emailHtml = `
      <!DOCTYPE html>
      <html lang="pt-BR">
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Convite para Workspace - CopyDrive</title>
          <style>
            * {
              margin: 0;
              padding: 0;
              box-sizing: border-box;
            }
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Helvetica Neue', Arial, sans-serif;
              line-height: 1.6;
              color: #262626;
              background-color: #f9f9f9;
              padding: 20px 0;
            }
            .email-wrapper {
              max-width: 600px;
              margin: 0 auto;
              background-color: #ffffff;
              border-radius: 16px;
              overflow: hidden;
              box-shadow: 0 4px 24px rgba(0, 0, 0, 0.08);
            }
            .header {
              background: linear-gradient(135deg, #FF5100 0%, #FF7A3D 100%);
              padding: 48px 40px;
              text-align: center;
              position: relative;
            }
            .logo {
              width: 120px;
              height: auto;
              margin-bottom: 16px;
            }
            .header h1 {
              color: #ffffff;
              font-size: 28px;
              font-weight: 700;
              margin: 0;
              letter-spacing: -0.5px;
            }
            .header p {
              color: rgba(255, 255, 255, 0.95);
              font-size: 16px;
              margin-top: 8px;
            }
            .content {
              padding: 40px;
            }
            .greeting {
              font-size: 18px;
              color: #262626;
              margin-bottom: 24px;
            }
            .message {
              font-size: 16px;
              color: #404040;
              line-height: 1.7;
              margin-bottom: 24px;
            }
            .workspace-card {
              background: linear-gradient(135deg, #FFF5F0 0%, #FFE8DB 100%);
              border-left: 4px solid #FF5100;
              padding: 24px;
              border-radius: 12px;
              margin: 32px 0;
            }
            .workspace-name {
              font-size: 20px;
              font-weight: 700;
              color: #FF5100;
              margin-bottom: 12px;
            }
            .workspace-info {
              display: flex;
              align-items: center;
              gap: 8px;
              font-size: 15px;
              color: #404040;
              margin-bottom: 8px;
            }
            .workspace-info strong {
              color: #262626;
            }
            .role-badge {
              display: inline-block;
              background-color: #FF5100;
              color: white;
              padding: 6px 14px;
              border-radius: 20px;
              font-size: 14px;
              font-weight: 600;
              margin-top: 8px;
            }
            .cta-container {
              text-align: center;
              margin: 40px 0;
            }
            .cta-button {
              display: inline-block;
              background: linear-gradient(135deg, #FF5100 0%, #FF6B2C 100%);
              color: white;
              text-decoration: none;
              padding: 16px 48px;
              border-radius: 12px;
              font-size: 16px;
              font-weight: 700;
              box-shadow: 0 6px 20px rgba(255, 81, 0, 0.3);
              transition: transform 0.2s ease, box-shadow 0.2s ease;
            }
            .cta-button:hover {
              transform: translateY(-2px);
              box-shadow: 0 8px 24px rgba(255, 81, 0, 0.4);
            }
            .note {
              background-color: #f9f9f9;
              border-radius: 8px;
              padding: 16px;
              margin-top: 32px;
              font-size: 14px;
              color: #737373;
              line-height: 1.6;
            }
            .footer {
              background-color: #f9f9f9;
              padding: 32px 40px;
              text-align: center;
              border-top: 1px solid #e5e5e5;
            }
            .footer-logo {
              font-size: 18px;
              font-weight: 700;
              color: #FF5100;
              margin-bottom: 8px;
            }
            .footer-text {
              font-size: 13px;
              color: #737373;
              margin-top: 8px;
            }
            .divider {
              height: 1px;
              background: linear-gradient(90deg, transparent, #e5e5e5, transparent);
              margin: 32px 0;
            }
            @media only screen and (max-width: 600px) {
              .email-wrapper {
                border-radius: 0;
                margin: 0;
              }
              .header, .content, .footer {
                padding: 32px 24px;
              }
              .header h1 {
                font-size: 24px;
              }
              .workspace-card {
                padding: 20px;
              }
              .cta-button {
                padding: 14px 32px;
                font-size: 15px;
              }
            }
          </style>
        </head>
        <body>
          <div class="email-wrapper">
            <div class="header">
              <h1>🎯 Convite para Workspace</h1>
              <p>Você foi convidado para colaborar!</p>
            </div>
            
            <div class="content">
              <p class="greeting">Olá! 👋</p>
              
              <p class="message">
                <strong>${inviter_name}</strong> convidou você para fazer parte do workspace no <strong>CopyDrive</strong>, a plataforma completa para gestão de copys e projetos de marketing.
              </p>

              <div class="workspace-card">
                <div class="workspace-name">${workspace_name}</div>
                <div class="workspace-info">
                  <span>👤</span>
                  <span><strong>Convidado por:</strong> ${inviter_name}</span>
                </div>
                <div class="workspace-info">
                  <span>🎭</span>
                  <span><strong>Seu cargo:</strong></span>
                </div>
                <span class="role-badge">${roleName}</span>
              </div>

              ${!hasAccount ? `
                <p class="message">
                  Como você ainda não possui uma conta no CopyDrive, será necessário criar uma antes de aceitar o convite. O processo é rápido e simples! 🚀
                </p>
              ` : `
                <p class="message">
                  Clique no botão abaixo para aceitar o convite e começar a colaborar imediatamente!
                </p>
              `}

              <div class="cta-container">
                <a href="${inviteLink}" class="cta-button">
                  ${hasAccount ? '✓ Aceitar Convite' : '🚀 Criar Conta e Aceitar'}
                </a>
              </div>

              <div class="divider"></div>

              <div class="note">
                <strong>⏱️ Importante:</strong> Este convite é válido por 7 dias. Após este período, será necessário solicitar um novo convite.
                <br><br>
                Se você não deseja fazer parte deste workspace, pode simplesmente ignorar este email. Nenhuma ação adicional será necessária.
              </div>
            </div>
            
            <div class="footer">
              <div class="footer-logo">CopyDrive</div>
              <div class="footer-text">
                Sistema completo de gestão de copys e projetos
              </div>
              <div class="footer-text" style="margin-top: 16px; font-size: 12px;">
                © ${new Date().getFullYear()} CopyDrive. Todos os direitos reservados.
              </div>
            </div>
          </div>
        </body>
      </html>
    `;

    const { error } = await resend.emails.send({
      from: "CopyDrive <nao-responda@copydrive.ai>",
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