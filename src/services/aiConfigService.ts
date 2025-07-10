import { supabase } from "@/integrations/supabase/client";

export interface AIProviderConfig {
  id?: string;
  provider: string;
  api_key: string;
  model_name?: string;
  is_active: boolean;
}

class AIConfigService {
  async saveConfig(config: AIProviderConfig): Promise<string> {
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      throw new Error('Usuário não autenticado');
    }

    const { data, error } = await supabase
      .from('ai_configs')
      .upsert({
        user_id: user.id,
        provider: config.provider,
        api_key: config.api_key,
        model_name: config.model_name,
        is_active: config.is_active
      })
      .select('id')
      .single();

    if (error) {
      throw new Error(`Erro ao salvar configuração: ${error.message}`);
    }

    return data.id;
  }

  async getConfigs(): Promise<AIProviderConfig[]> {
    const { data, error } = await supabase
      .from('ai_configs')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(`Erro ao buscar configurações: ${error.message}`);
    }

    return data || [];
  }

  async getActiveConfigs(): Promise<AIProviderConfig[]> {
    const { data, error } = await supabase
      .from('ai_configs')
      .select('*')
      .eq('is_active', true);

    if (error) {
      throw new Error(`Erro ao buscar configurações ativas: ${error.message}`);
    }

    return data || [];
  }

  async updateConfig(id: string, updates: Partial<AIProviderConfig>): Promise<void> {
    const { error } = await supabase
      .from('ai_configs')
      .update(updates)
      .eq('id', id);

    if (error) {
      throw new Error(`Erro ao atualizar configuração: ${error.message}`);
    }
  }

  async deleteConfig(id: string): Promise<void> {
    const { error } = await supabase
      .from('ai_configs')
      .delete()
      .eq('id', id);

    if (error) {
      throw new Error(`Erro ao deletar configuração: ${error.message}`);
    }
  }

  async testConnection(provider: string, apiKey: string, model?: string): Promise<boolean> {
    try {
      if (provider === 'openai') {
        const response = await fetch('https://api.openai.com/v1/models', {
          headers: {
            'Authorization': `Bearer ${apiKey}`
          }
        });
        return response.ok;
      }

      if (provider === 'google-vision') {
        const response = await fetch(`https://vision.googleapis.com/v1/images:annotate?key=${apiKey}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            requests: [{
              image: { content: '' },
              features: [{ type: 'TEXT_DETECTION', maxResults: 1 }]
            }]
          })
        });
        // Google retorna 400 para conteúdo vazio, mas se a chave for válida, o erro será diferente
        return response.status !== 401 && response.status !== 403;
      }

      return false;
    } catch {
      return false;
    }
  }
}

export const aiConfigService = new AIConfigService();