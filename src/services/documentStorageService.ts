import { supabase } from "@/integrations/supabase/client";
import { ExtractedData } from "./aiProcessingService";

export interface StoredDocument {
  id: string;
  user_id: string;
  file_name: string;
  file_type: string;
  file_size: number;
  file_url?: string;
  processing_status: string;
  extracted_data?: any;
  confidence_score?: number;
  ai_provider?: string;
  template_id?: string;
  created_at: string;
  updated_at: string;
}

class DocumentStorageService {
  async uploadFile(file: File): Promise<{ path: string; url: string }> {
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      throw new Error('Usuário não autenticado');
    }

    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
    const filePath = `${user.id}/${fileName}`;

    const { data, error } = await supabase.storage
      .from('documents')
      .upload(filePath, file);

    if (error) {
      throw new Error(`Erro no upload: ${error.message}`);
    }

    const { data: { publicUrl } } = supabase.storage
      .from('documents')
      .getPublicUrl(filePath);

    return {
      path: data.path,
      url: publicUrl
    };
  }

  async createDocumentRecord(
    fileName: string,
    fileType: string,
    fileSize: number,
    fileUrl?: string
  ): Promise<string> {
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      throw new Error('Usuário não autenticado');
    }

    const { data, error } = await supabase
      .from('processed_documents')
      .insert({
        user_id: user.id,
        file_name: fileName,
        file_type: fileType,
        file_size: fileSize,
        file_url: fileUrl,
        processing_status: 'pending'
      })
      .select('id')
      .single();

    if (error) {
      throw new Error(`Erro ao criar registro: ${error.message}`);
    }

    return data.id;
  }

  async updateDocumentProcessing(
    documentId: string,
    status: 'processing' | 'completed' | 'error',
    extractedData?: ExtractedData,
    confidence?: number,
    provider?: string,
    templateId?: string
  ): Promise<void> {
    const updates: any = {
      processing_status: status,
      updated_at: new Date().toISOString()
    };

    if (extractedData) updates.extracted_data = extractedData;
    if (confidence) updates.confidence_score = confidence;
    if (provider) updates.ai_provider = provider;
    if (templateId) updates.template_id = templateId;

    const { error } = await supabase
      .from('processed_documents')
      .update(updates)
      .eq('id', documentId);

    if (error) {
      throw new Error(`Erro ao atualizar documento: ${error.message}`);
    }
  }

  async getDocument(documentId: string): Promise<StoredDocument | null> {
    const { data, error } = await supabase
      .from('processed_documents')
      .select('*')
      .eq('id', documentId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null; // Not found
      throw new Error(`Erro ao buscar documento: ${error.message}`);
    }

    return data;
  }

  async getUserDocuments(): Promise<StoredDocument[]> {
    const { data, error } = await supabase
      .from('processed_documents')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(`Erro ao buscar documentos: ${error.message}`);
    }

    return data || [];
  }

  async saveFilledForm(
    templateName: string,
    templateCategory: string,
    formData: any,
    documentId?: string
  ): Promise<string> {
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      throw new Error('Usuário não autenticado');
    }

    const { data, error } = await supabase
      .from('filled_forms')
      .insert({
        user_id: user.id,
        template_name: templateName,
        template_category: templateCategory,
        form_data: formData,
        document_id: documentId
      })
      .select('id')
      .single();

    if (error) {
      throw new Error(`Erro ao salvar formulário: ${error.message}`);
    }

    return data.id;
  }

  async getFilledForms(): Promise<any[]> {
    const { data, error } = await supabase
      .from('filled_forms')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(`Erro ao buscar formulários: ${error.message}`);
    }

    return data || [];
  }

  async deleteDocument(documentId: string): Promise<void> {
    // Primeiro, buscar a URL do arquivo para deletar do storage
    const document = await this.getDocument(documentId);
    
    if (document?.file_url) {
      const filePath = document.file_url.split('/').pop();
      if (filePath) {
        await supabase.storage
          .from('documents')
          .remove([`documents/${filePath}`]);
      }
    }

    // Deletar o registro do banco
    const { error } = await supabase
      .from('processed_documents')
      .delete()
      .eq('id', documentId);

    if (error) {
      throw new Error(`Erro ao deletar documento: ${error.message}`);
    }
  }
}

export const documentStorageService = new DocumentStorageService();