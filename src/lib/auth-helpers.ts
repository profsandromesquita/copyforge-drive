import { User } from "@supabase/supabase-js";

/**
 * Checks if a user was created via OAuth provider only (no password set).
 * This is useful for showing prompts to set a fallback password.
 */
export const isOAuthOnlyUser = (user: User | null): boolean => {
  if (!user) return false;

  // Check app_metadata for provider info
  const appMetadata = user.app_metadata;
  
  // If primary provider is not 'email', user signed up via OAuth
  const provider = appMetadata?.provider;
  const providers = appMetadata?.providers as string[] | undefined;

  // User is OAuth-only if:
  // 1. Primary provider is 'google' (or other OAuth)
  // 2. AND 'email' is NOT in the providers array
  if (provider && provider !== 'email') {
    // Check if email provider was added later (user set password)
    if (providers && providers.includes('email')) {
      return false; // User has both OAuth and email/password
    }
    return true; // OAuth only
  }

  return false;
};

/**
 * Gets the primary OAuth provider name for display purposes.
 */
export const getOAuthProviderName = (user: User | null): string | null => {
  if (!user) return null;

  const provider = user.app_metadata?.provider;
  
  const providerNames: Record<string, string> = {
    google: 'Google',
    github: 'GitHub',
    facebook: 'Facebook',
    twitter: 'Twitter',
    apple: 'Apple',
  };

  return providerNames[provider] || provider || null;
};

/**
 * Checks if user has password authentication enabled.
 */
export const hasPasswordAuth = (user: User | null): boolean => {
  if (!user) return false;

  const providers = user.app_metadata?.providers as string[] | undefined;
  return providers?.includes('email') || user.app_metadata?.provider === 'email';
};
