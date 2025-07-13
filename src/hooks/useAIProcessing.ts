import { useState } from 'react';
import { useToast } from './use-toast';
import { aiProcessingService, ExtractedData, ProcessingResult } from '@/services/aiProcessingService';
import { documentStorageService } from '@/services/documentStorageService';

const useAIProcessing = () => {
  const [isProcessing, setIsProcessing] = useState(false);
  const { toast } = useToast();

  const extractDataFromFile = async (file: File): Promise<ProcessingResult & { documentId?: string }> => {
    setIsProcessing(true);
    let documentId: string | undefined;
    
    try {
      // 1. Upload do arquivo para Supabase Storage
      const { url } = await documentStorageService.uploadFile(file);
      
      // 2. Criar registro do documento no banco
      documentId = await documentStorageService.createDocumentRecord(
        file.name,
        file.type,
        file.size,
        url
      );

      // 3. Atualizar status para "processing"
      await documentStorageService.updateDocumentProcessing(documentId, 'processing');

      // 4. Processar com IA
      const result = await aiProcessingService.processDocument(file);

      if (result.success) {
        // 5. Atualizar com dados extraídos
        await documentStorageService.updateDocumentProcessing(
          documentId,
          'completed',
          result.data,
          result.confidence,
          result.provider
        );

        toast({
          title: "Dados extraídos com sucesso",
          description: `${Object.keys(result.data).length} campos identificados com ${(result.confidence * 100).toFixed(1)}% de confiança`,
        });
      } else {
        // 6. Marcar como erro se falhou
        await documentStorageService.updateDocumentProcessing(documentId, 'failed');
        
        throw new Error(result.error || 'Erro no processamento');
      }

      return { ...result, documentId };

    } catch (error) {
      if (documentId) {
        await documentStorageService.updateDocumentProcessing(documentId, 'failed');
      }

      toast({
        title: "Erro no processamento",
        description: error instanceof Error ? error.message : "Erro desconhecido",
        variant: "destructive"
      });

      return {
        success: false,
        data: {},
        confidence: 0,
        provider: '',
        error: error instanceof Error ? error.message : 'Erro desconhecido'
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