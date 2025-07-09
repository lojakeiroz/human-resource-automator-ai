import { useState } from 'react';
import { useToast } from './use-toast';

export interface ExtractedData {
  [key: string]: string | number | boolean;
}

export interface ProcessingResult {
  success: boolean;
  data: ExtractedData;
  confidence: number;
  provider: string;
}

const useAIProcessing = () => {
  const [isProcessing, setIsProcessing] = useState(false);
  const { toast } = useToast();

  const processWithGoogleVision = async (file: File): Promise<ExtractedData> => {
    // Simular processamento com Google Vision
    return new Promise((resolve) => {
      setTimeout(() => {
        // Dados extraídos simulados baseados no tipo de documento
        const mockData: ExtractedData = {
          fullName: "João Silva Santos",
          email: "joao.silva@email.com",
          cpf: "123.456.789-00",
          birthDate: "1990-05-15",
          phone: "(11) 99999-9999",
          address: "Rua das Flores, 123, São Paulo, SP",
          position: "Desenvolvedor Full Stack",
          experience: "5 anos",
          salary: "R$ 8.000,00",
          education: "Bacharelado em Ciência da Computação"
        };
        resolve(mockData);
      }, 2000);
    });
  };

  const processWithOpenAI = async (text: string): Promise<ExtractedData> => {
    // Simular processamento com OpenAI
    return new Promise((resolve) => {
      setTimeout(() => {
        const mockData: ExtractedData = {
          skills: "React, TypeScript, Node.js, Python",
          languages: "Português, Inglês",
          certifications: "AWS Solutions Architect",
          summary: "Profissional experiente em desenvolvimento web"
        };
        resolve(mockData);
      }, 1500);
    });
  };

  const extractDataFromFile = async (file: File): Promise<ProcessingResult> => {
    setIsProcessing(true);
    
    try {
      // Verificar provedores configurados
      const savedProviders = localStorage.getItem('ai-providers');
      const providers = savedProviders ? JSON.parse(savedProviders) : [];
      const enabledProviders = providers.filter((p: any) => p.enabled && p.apiKey);

      if (enabledProviders.length === 0) {
        throw new Error('Nenhum provedor de IA configurado');
      }

      let extractedData: ExtractedData = {};
      let confidence = 0;
      let usedProvider = '';

      // Tentar processar com Google Vision primeiro (para OCR)
      const googleProvider = enabledProviders.find((p: any) => p.id === 'google-vision');
      if (googleProvider) {
        const visionData = await processWithGoogleVision(file);
        extractedData = { ...extractedData, ...visionData };
        confidence = Math.max(confidence, 0.85);
        usedProvider = 'Google Vision';
      }

      // Processar com OpenAI para análise adicional
      const openaiProvider = enabledProviders.find((p: any) => p.id === 'openai');
      if (openaiProvider) {
        const aiData = await processWithOpenAI('texto extraído');
        extractedData = { ...extractedData, ...aiData };
        confidence = Math.max(confidence, 0.90);
        usedProvider += usedProvider ? ' + OpenAI' : 'OpenAI';
      }

      toast({
        title: "Dados extraídos com sucesso",
        description: `${Object.keys(extractedData).length} campos identificados`,
      });

      return {
        success: true,
        data: extractedData,
        confidence,
        provider: usedProvider
      };

    } catch (error) {
      toast({
        title: "Erro no processamento",
        description: error instanceof Error ? error.message : "Erro desconhecido",
        variant: "destructive"
      });

      return {
        success: false,
        data: {},
        confidence: 0,
        provider: ''
      };
    } finally {
      setIsProcessing(false);
    }
  };

  const fillTemplate = (templateFields: any[], extractedData: ExtractedData) => {
    const filledFields: Record<string, any> = {};

    templateFields.forEach(field => {
      // Mapear campos baseado em nomes similares
      const fieldName = field.name.toLowerCase();
      const dataKeys = Object.keys(extractedData);
      
      // Tentar encontrar correspondência exata
      let matchedKey = dataKeys.find(key => key.toLowerCase() === fieldName);
      
      // Tentar correspondência parcial
      if (!matchedKey) {
        matchedKey = dataKeys.find(key => 
          key.toLowerCase().includes(fieldName) || 
          fieldName.includes(key.toLowerCase())
        );
      }

      if (matchedKey) {
        filledFields[field.name] = extractedData[matchedKey];
      }
    });

    return filledFields;
  };

  return {
    isProcessing,
    extractDataFromFile,
    fillTemplate
  };
};

export default useAIProcessing;