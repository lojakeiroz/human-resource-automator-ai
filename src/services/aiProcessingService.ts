import { supabase } from "@/integrations/supabase/client";

export interface ExtractedData {
  [key: string]: string | number | boolean;
}

export interface ProcessingResult {
  success: boolean;
  data: ExtractedData;
  confidence: number;
  provider: string;
  error?: string;
}

export interface AIConfig {
  id: string;
  provider: string;
  api_key: string;
  model_name?: string;
  is_active: boolean;
}

class AIProcessingService {
  async getActiveAIConfigs(): Promise<AIConfig[]> {
    const { data: configs, error } = await supabase
      .from('ai_configs')
      .select('*')
      .eq('is_active', true);

    if (error) {
      throw new Error(`Erro ao buscar configurações de IA: ${error.message}`);
    }

    return configs || [];
  }

  async processWithOpenAI(apiKey: string, model: string, text: string): Promise<ExtractedData> {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: model || 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: `Você é um especialista em extração de dados de documentos de RH. 
            Extraia informações estruturadas do texto fornecido e retorne em formato JSON.
            Foque em dados como: nome completo, email, telefone, CPF, endereço, cargo, experiência, salário, educação, habilidades.`
          },
          {
            role: 'user',
            content: text
          }
        ],
        temperature: 0.1,
      }),
    });

    if (!response.ok) {
      throw new Error(`Erro na API OpenAI: ${response.statusText}`);
    }

    const result = await response.json();
    const content = result.choices[0]?.message?.content;

    try {
      return JSON.parse(content);
    } catch {
      // Se não conseguir parsear JSON, extrair dados manualmente
      return this.extractDataFromText(content);
    }
  }

  async processWithGoogleVision(apiKey: string, file: File): Promise<ExtractedData> {
    const base64 = await this.fileToBase64(file);
    
    const response = await fetch(`https://vision.googleapis.com/v1/images:annotate?key=${apiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        requests: [{
          image: {
            content: base64.split(',')[1] // Remove data:image/...;base64,
          },
          features: [{
            type: 'DOCUMENT_TEXT_DETECTION',
            maxResults: 1
          }]
        }]
      }),
    });

    if (!response.ok) {
      throw new Error(`Erro na API Google Vision: ${response.statusText}`);
    }

    const result = await response.json();
    const textAnnotation = result.responses[0]?.fullTextAnnotation?.text;
    
    if (!textAnnotation) {
      throw new Error('Nenhum texto encontrado no documento');
    }

    return this.extractDataFromText(textAnnotation);
  }

  private async fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = error => reject(error);
    });
  }

  private extractDataFromText(text: string): ExtractedData {
    const data: ExtractedData = {};

    // Regex patterns para extrair informações comuns
    const patterns = {
      email: /[\w\.-]+@[\w\.-]+\.\w+/g,
      phone: /\(?\d{2}\)?\s?\d{4,5}[-\s]?\d{4}/g,
      cpf: /\d{3}\.?\d{3}\.?\d{3}[-]?\d{2}/g,
      date: /\d{1,2}\/\d{1,2}\/\d{4}/g,
      salary: /R\$\s?\d{1,3}(?:\.\d{3})*(?:,\d{2})?/g,
    };

    // Extrair email
    const emailMatch = text.match(patterns.email);
    if (emailMatch) data.email = emailMatch[0];

    // Extrair telefone
    const phoneMatch = text.match(patterns.phone);
    if (phoneMatch) data.phone = phoneMatch[0];

    // Extrair CPF
    const cpfMatch = text.match(patterns.cpf);
    if (cpfMatch) data.cpf = cpfMatch[0];

    // Extrair data de nascimento
    const dateMatch = text.match(patterns.date);
    if (dateMatch) data.birthDate = dateMatch[0];

    // Extrair salário
    const salaryMatch = text.match(patterns.salary);
    if (salaryMatch) data.salary = salaryMatch[0];

    // Tentar extrair nome (primeira linha que não seja muito específica)
    const lines = text.split('\n').filter(line => line.trim().length > 0);
    for (const line of lines) {
      if (line.length > 5 && line.length < 50 && 
          !line.includes('@') && !line.match(/\d{3}/)) {
        data.fullName = line.trim();
        break;
      }
    }

    return data;
  }

  async processDocument(file: File): Promise<ProcessingResult> {
    try {
      const formData = new FormData();
      formData.append('file', file);

      const { data, error } = await supabase.functions.invoke('process-document', {
        body: formData,
      });

      if (error) {
        console.error('Erro na Edge Function:', error);
        return {
          success: false,
          data: {},
          confidence: 0,
          provider: '',
          error: error.message || 'Erro desconhecido'
        };
      }

      return data || {
        success: false,
        data: {},
        confidence: 0,
        provider: '',
        error: 'Nenhum dado retornado'
      };

    } catch (error) {
      return {
        success: false,
        data: {},
        confidence: 0,
        provider: '',
        error: error instanceof Error ? error.message : 'Erro desconhecido'
      };
    }
  }
}

export const aiProcessingService = new AIProcessingService();