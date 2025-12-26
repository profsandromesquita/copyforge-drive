// Utilitário para gerenciar tokens de convite pendentes
const PENDING_INVITE_KEY = 'pendingInviteToken';

export const savePendingInvite = (token: string) => {
  localStorage.setItem(PENDING_INVITE_KEY, token);
  console.log('[InviteUtils] Saved pending invite token');
};

export const getPendingInvite = (): string | null => {
  return localStorage.getItem(PENDING_INVITE_KEY);
};

export const clearPendingInvite = () => {
  localStorage.removeItem(PENDING_INVITE_KEY);
  console.log('[InviteUtils] Cleared pending invite token');
};
