
import { useState, useCallback } from "react";
import { Upload, FileText, Image, Volume2, X, Bot } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useTemplates } from "@/hooks/useTemplates";
import useAIProcessing from "@/hooks/useAIProcessing";
import FormPreview from "@/components/forms/FormPreview";
import { documentStorageService } from "@/services/documentStorageService";

interface UploadedFile {
  id: string;
  name: string;
  size: number;
  type: string;
  status: 'uploading' | 'processing' | 'completed' | 'error';
  progress: number;
  extractedData?: Record<string, any>;
  file: File;
  documentId?: string;
}

const DocumentUpload = () => {
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<string>('');
  const [extractedData, setExtractedData] = useState<Record<string, any> | null>(null);
  const [showForm, setShowForm] = useState(false);
  const { toast } = useToast();
  const { templates } = useTemplates();
  const { extractDataFromFile, fillTemplate, isProcessing } = useAIProcessing();

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const processFile = async (file: File) => {
    const fileId = Date.now().toString();
    const uploadedFile: UploadedFile = {
      id: fileId,
      name: file.name,
      size: file.size,
      type: file.type,
      status: 'uploading',
      progress: 0,
      file,
    };

    setFiles(prev => [...prev, uploadedFile]);

    // Upload e processamento com IA em uma única operação
    const uploadInterval = setInterval(() => {
      setFiles(prev => prev.map(f => {
        if (f.id === fileId && f.status === 'uploading') {
          const newProgress = f.progress + 20;
          if (newProgress >= 100) {
            clearInterval(uploadInterval);
            processWithAI(fileId, file);
            return { ...f, status: 'processing', progress: 0 };
          }
          return { ...f, progress: newProgress };
        }
        return f;
      }));
    }, 300);
  };

  const processWithAI = async (fileId: string, file: File) => {
    try {
      const result = await extractDataFromFile(file);
      
      setFiles(prev => prev.map(f => 
        f.id === fileId 
          ? { 
              ...f, 
              status: result.success ? 'completed' : 'error', 
              progress: 100, 
              extractedData: result.data,
              documentId: result.documentId
            }
          : f
      ));

      if (result.success) {
        setExtractedData(result.data);
      }
    } catch (error) {
      setFiles(prev => prev.map(f => 
        f.id === fileId 
          ? { ...f, status: 'error', progress: 0 }
          : f
      ));
    }
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const droppedFiles = Array.from(e.dataTransfer.files);
    droppedFiles.forEach(processFile);
  }, []);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      Array.from(e.target.files).forEach(processFile);
    }
  };

  const removeFile = (fileId: string) => {
    setFiles(prev => prev.filter(f => f.id !== fileId));
  };

  const generateForm = () => {
    if (!selectedTemplate || !extractedData) {
      toast({
        title: "Dados insuficientes",
        description: "Selecione um template e processe um documento primeiro.",
        variant: "destructive"
      });
      return;
    }

    const template = templates.find(t => t.id === selectedTemplate);
    if (template) {
      const filledData = fillTemplate(template.fields, extractedData);
      setExtractedData({ ...extractedData, ...filledData });
      setShowForm(true);
    }
  };

  const getFileIcon = (type: string) => {
    if (type.startsWith('image/')) return Image;
    if (type.startsWith('audio/')) return Volume2;
    return FileText;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'uploading': return 'bg-blue-100 text-blue-800';
      case 'processing': return 'bg-yellow-100 text-yellow-800';
      case 'completed': return 'bg-green-100 text-green-800';
      case 'error': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="space-y-6">
      {/* Template Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Bot className="h-5 w-5" />
            <span>Seleção de Template</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-4">
            <div className="flex-1">
              <Select value={selectedTemplate} onValueChange={setSelectedTemplate}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o template para preenchimento automático" />
                </SelectTrigger>
                <SelectContent>
                  {templates.map(template => (
                    <SelectItem key={template.id} value={template.id}>
                      {template.name} - {template.category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button 
              onClick={generateForm}
              disabled={!selectedTemplate || !extractedData || isProcessing}
            >
              Gerar Formulário
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Upload Area */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Upload className="h-5 w-5" />
            <span>Upload de Documentos</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div
            className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
              isDragging 
                ? 'border-blue-400 bg-blue-50' 
                : 'border-gray-300 hover:border-gray-400'
            }`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Arraste e solte seus documentos aqui
            </h3>
            <p className="text-gray-600 mb-4">
              Suportamos PDF, imagens (JPG, PNG) e áudio (MP3, WAV)
            </p>
            <input
              type="file"
              multiple
              accept=".pdf,.jpg,.jpeg,.png,.mp3,.wav,.m4a"
              onChange={handleFileSelect}
              className="hidden"
              id="file-upload"
            />
            <Button 
              variant="outline" 
              className="cursor-pointer"
              onClick={() => document.getElementById('file-upload')?.click()}
            >
              Selecionar Arquivos
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Files List */}
      {files.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Documentos em Processamento</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {files.map((file) => {
                const FileIcon = getFileIcon(file.type);
                return (
                  <div key={file.id} className="flex items-center space-x-4 p-4 border rounded-lg">
                    <FileIcon className="h-8 w-8 text-gray-500 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {file.name}
                        </p>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeFile(file.id)}
                          className="text-gray-400 hover:text-gray-600"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                      <p className="text-xs text-gray-500 mb-2">
                        {formatFileSize(file.size)}
                      </p>
                      <div className="flex items-center space-x-2">
                        <div className="flex-1 bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                            style={{ width: `${file.progress}%` }}
                          />
                        </div>
                        <Badge className={getStatusColor(file.status)}>
                          {file.status === 'uploading' && 'Enviando'}
                          {file.status === 'processing' && 'Processando IA'}
                          {file.status === 'completed' && 'Concluído'}
                          {file.status === 'error' && 'Erro'}
                        </Badge>
                      </div>
                      {file.extractedData && (
                        <div className="mt-2 text-xs text-green-600">
                          ✓ {Object.keys(file.extractedData).length} campos extraídos pela IA
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Form Preview */}
      {showForm && selectedTemplate && extractedData && (
        <FormPreview
          template={templates.find(t => t.id === selectedTemplate)!}
          extractedData={extractedData}
          onSave={async (data) => {
            try {
              const template = templates.find(t => t.id === selectedTemplate)!;
              const processedFile = files.find(f => f.status === 'completed');
              
              await documentStorageService.saveFilledForm(
                template.name,
                template.category,
                data,
                processedFile?.documentId
              );
              
              toast({
                title: "Formulário salvo",
                description: "Dados salvos com sucesso no banco de dados!"
              });
            } catch (error) {
              toast({
                title: "Erro ao salvar",
                description: error instanceof Error ? error.message : "Erro desconhecido",
                variant: "destructive"
              });
            }
          }}
        />
      )}
    </div>
  );
};

export default DocumentUpload;
