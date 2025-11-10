export interface CheckoutParams {
  workspace_id: string;
  user_id: string;
  email: string;
  name: string;
  phone?: string | null;
  source?: 'upgrade_modal' | 'onboarding' | 'admin';
}

/**
 * Constrói URL de checkout com parâmetros de tracking e pré-preenchimento
 * 
 * @param baseUrl - URL base do checkout (ex: https://payment.ticto.app/OFERTA123)
 * @param params - Parâmetros para tracking e pré-preenchimento
 * @returns URL completa com query parameters
 */
export function buildCheckoutUrl(baseUrl: string, params: CheckoutParams): string {
  try {
    const url = new URL(baseUrl);
    
    // Adicionar parâmetros de tracking
    url.searchParams.set('workspace_id', params.workspace_id);
    url.searchParams.set('user_id', params.user_id);
    
    // Adicionar fonte se fornecida
    if (params.source) {
      url.searchParams.set('source', params.source);
    }
    
    // Adicionar dados de pré-preenchimento (padrão Ticto)
    if (params.email) {
      url.searchParams.set('email', params.email);
    }
    
    if (params.name) {
      url.searchParams.set('name', params.name);
    }
    
    if (params.phone) {
      url.searchParams.set('phone', params.phone);
    }
    
    return url.toString();
  } catch (error) {
    console.error('Erro ao construir URL de checkout:', error);
    // Em caso de erro, retornar URL original
    return baseUrl;
  }
}
