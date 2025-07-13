import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ExtractedData {
  [key: string]: string | number | boolean;
}

interface ProcessingResult {
  success: boolean;
  data: ExtractedData;
  confidence: number;
  provider: string;
  error?: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
    );

    // Get the authenticated user
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
    if (userError || !user) {
      throw new Error('Usuário não autenticado');
    }

    const formData = await req.formData();
    const file = formData.get('file') as File;
    const text = formData.get('text') as string;

    if (!file && !text) {
      throw new Error('Arquivo ou texto é obrigatório');
    }

    // Get active AI configurations for the user
    const { data: configs, error: configError } = await supabaseClient
      .from('ai_configs')
      .select('*')
      .eq('user_id', user.id)
      .eq('is_active', true);

    if (configError) {
      throw new Error(`Erro ao buscar configurações: ${configError.message}`);
    }

    if (!configs || configs.length === 0) {
      throw new Error('Nenhuma configuração de IA ativa encontrada. Configure suas APIs na aba Config IA.');
    }

    let allExtractedData: ExtractedData = {};
    let highestConfidence = 0;
    let usedProviders: string[] = [];

    // Process with Google Vision if available and file is provided
    const googleConfig = configs.find(config => config.provider === 'google-vision');
    if (googleConfig && file) {
      try {
        const base64 = await fileToBase64(file);
        const visionData = await processWithGoogleVision(googleConfig.api_key, base64);
        allExtractedData = { ...allExtractedData, ...visionData };
        highestConfidence = Math.max(highestConfidence, 0.85);
        usedProviders.push('Google Vision');
      } catch (error) {
        console.error('Erro no Google Vision:', error);
      }
    }

    // Process with OpenAI if available
    const openaiConfig = configs.find(config => config.provider === 'openai');
    if (openaiConfig) {
      try {
        let textToProcess = text;
        if (!textToProcess && Object.keys(allExtractedData).length > 0) {
          textToProcess = Object.values(allExtractedData).join(' ');
        }
        
        if (textToProcess) {
          const aiData = await processWithOpenAI(
            openaiConfig.api_key,
            openaiConfig.model_name || 'gpt-4o-mini',
            textToProcess
          );
          allExtractedData = { ...allExtractedData, ...aiData };
          highestConfidence = Math.max(highestConfidence, 0.90);
          usedProviders.push('OpenAI');
        }
      } catch (error) {
        console.error('Erro no OpenAI:', error);
      }
    }

    if (Object.keys(allExtractedData).length === 0) {
      throw new Error('Nenhum dado foi extraído do documento');
    }

    const result: ProcessingResult = {
      success: true,
      data: allExtractedData,
      confidence: highestConfidence,
      provider: usedProviders.join(' + ')
    };

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in process-document function:', error);
    
    const result: ProcessingResult = {
      success: false,
      data: {},
      confidence: 0,
      provider: '',
      error: error instanceof Error ? error.message : 'Erro desconhecido'
    };

    return new Response(JSON.stringify(result), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

async function fileToBase64(file: File): Promise<string> {
  const arrayBuffer = await file.arrayBuffer();
  const base64 = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)));
  return base64;
}

async function processWithGoogleVision(apiKey: string, base64: string): Promise<ExtractedData> {
  const response = await fetch(`https://vision.googleapis.com/v1/images:annotate?key=${apiKey}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      requests: [{
        image: { content: base64 },
        features: [{ type: 'DOCUMENT_TEXT_DETECTION', maxResults: 1 }]
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

  return extractDataFromText(textAnnotation);
}

async function processWithOpenAI(apiKey: string, model: string, text: string): Promise<ExtractedData> {
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
          Extraia informações estruturadas do texto fornecido e retorne APENAS um JSON válido.
          Foque em dados como: nome completo (fullName), email, telefone (phone), CPF, endereço (address), cargo (position), experiência (experience), salário (salary), educação (education), habilidades (skills).
          Retorne apenas o JSON, sem explicações.`
        },
        { role: 'user', content: text }
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
    return extractDataFromText(content);
  }
}

function extractDataFromText(text: string): ExtractedData {
  const data: ExtractedData = {};

  const patterns = {
    email: /[\w\.-]+@[\w\.-]+\.\w+/g,
    phone: /\(?\d{2}\)?\s?\d{4,5}[-\s]?\d{4}/g,
    cpf: /\d{3}\.?\d{3}\.?\d{3}[-]?\d{2}/g,
    date: /\d{1,2}\/\d{1,2}\/\d{4}/g,
    salary: /R\$\s?\d{1,3}(?:\.\d{3})*(?:,\d{2})?/g,
  };

  const emailMatch = text.match(patterns.email);
  if (emailMatch) data.email = emailMatch[0];

  const phoneMatch = text.match(patterns.phone);
  if (phoneMatch) data.phone = phoneMatch[0];

  const cpfMatch = text.match(patterns.cpf);
  if (cpfMatch) data.cpf = cpfMatch[0];

  const dateMatch = text.match(patterns.date);
  if (dateMatch) data.birthDate = dateMatch[0];

  const salaryMatch = text.match(patterns.salary);
  if (salaryMatch) data.salary = salaryMatch[0];

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