// Types for invite-related RPC responses

export interface ValidateInviteResponse {
  success: boolean;
  error?: 'invite_not_found' | 'invite_expired';
  email?: string;
  role?: string;
  workspace_name?: string;
  workspace_avatar?: string | null;
  inviter_name?: string;
  expires_at?: string;
}

export interface AcceptInviteResponse {
  success: boolean;
  error?: 'not_authenticated' | 'invite_not_found' | 'email_mismatch' | 'invite_expired';
  workspace_id?: string;
  already_member?: boolean;
}

export interface DeclineInviteResponse {
  success: boolean;
  error?: 'not_authenticated' | 'invite_not_found' | 'email_mismatch';
}

// Display data structure for UI components
export interface InviteDisplayData {
  email: string;
  role: string;
  workspace: {
    name: string;
    avatar_url?: string | null;
  };
  inviter: {
    name: string;
  };
  expires_at: string;
}
