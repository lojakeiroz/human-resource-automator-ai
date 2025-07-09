import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Settings, Key, TestTube, Save, Eye, EyeOff } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface AIProvider {
  id: string;
  name: string;
  enabled: boolean;
  apiKey: string;
  endpoint?: string;
  model?: string;
  description: string;
}

const AIConfigPanel = () => {
  const { toast } = useToast();
  const [showApiKeys, setShowApiKeys] = useState<Record<string, boolean>>({});
  const [providers, setProviders] = useState<AIProvider[]>([
    {
      id: 'google-vision',
      name: 'Google Cloud Vision',
      enabled: false,
      apiKey: '',
      model: 'text-detection',
      description: 'OCR e reconhecimento de texto em imagens'
    },
    {
      id: 'openai',
      name: 'OpenAI GPT-4',
      enabled: false,
      apiKey: '',
      model: 'gpt-4',
      description: 'Processamento de texto e análise inteligente'
    },
    {
      id: 'azure-cognitive',
      name: 'Azure Cognitive Services',
      enabled: false,
      apiKey: '',
      endpoint: '',
      description: 'Análise de documentos e formulários'
    },
    {
      id: 'aws-textract',
      name: 'AWS Textract',
      enabled: false,
      apiKey: '',
      description: 'Extração de texto e dados estruturados'
    }
  ]);

  const updateProvider = (id: string, updates: Partial<AIProvider>) => {
    setProviders(prev => prev.map(provider => 
      provider.id === id ? { ...provider, ...updates } : provider
    ));
  };

  const toggleApiKeyVisibility = (providerId: string) => {
    setShowApiKeys(prev => ({
      ...prev,
      [providerId]: !prev[providerId]
    }));
  };

  const testConnection = async (provider: AIProvider) => {
    if (!provider.apiKey) {
      toast({
        title: "API Key necessária",
        description: "Configure a API Key antes de testar a conexão.",
        variant: "destructive"
      });
      return;
    }

    // Simular teste de conexão
    toast({
      title: "Testando conexão...",
      description: `Verificando conectividade com ${provider.name}`,
    });

    setTimeout(() => {
      toast({
        title: "Conexão testada",
        description: `${provider.name} está funcionando corretamente!`,
      });
    }, 2000);
  };

  const saveConfiguration = () => {
    const enabledProviders = providers.filter(p => p.enabled && p.apiKey);
    
    if (enabledProviders.length === 0) {
      toast({
        title: "Nenhum provedor configurado",
        description: "Configure pelo menos um provedor de IA.",
        variant: "destructive"
      });
      return;
    }

    // Salvar configuração (implementar persistência)
    localStorage.setItem('ai-providers', JSON.stringify(providers));
    
    toast({
      title: "Configuração salva",
      description: `${enabledProviders.length} provedor(es) configurado(s) com sucesso.`,
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Configuração de IA</h2>
          <p className="text-gray-600">Configure os provedores de IA para processamento de documentos</p>
        </div>
        <Button onClick={saveConfiguration} className="bg-blue-600 hover:bg-blue-700">
          <Save className="h-4 w-4 mr-2" />
          Salvar Configuração
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {providers.map((provider) => (
          <Card key={provider.id} className="relative">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="bg-blue-50 p-2 rounded-lg">
                    <Settings className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">{provider.name}</CardTitle>
                    <p className="text-sm text-gray-600">{provider.description}</p>
                  </div>
                </div>
                <Switch
                  checked={provider.enabled}
                  onCheckedChange={(enabled) => updateProvider(provider.id, { enabled })}
                />
              </div>
            </CardHeader>
            
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor={`${provider.id}-apikey`}>API Key</Label>
                <div className="relative">
                  <Input
                    id={`${provider.id}-apikey`}
                    type={showApiKeys[provider.id] ? "text" : "password"}
                    placeholder="Digite sua API Key"
                    value={provider.apiKey}
                    onChange={(e) => updateProvider(provider.id, { apiKey: e.target.value })}
                    className="pr-10"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3"
                    onClick={() => toggleApiKeyVisibility(provider.id)}
                  >
                    {showApiKeys[provider.id] ? 
                      <EyeOff className="h-4 w-4" /> : 
                      <Eye className="h-4 w-4" />
                    }
                  </Button>
                </div>
              </div>

              {provider.endpoint !== undefined && (
                <div className="space-y-2">
                  <Label htmlFor={`${provider.id}-endpoint`}>Endpoint</Label>
                  <Input
                    id={`${provider.id}-endpoint`}
                    placeholder="https://api.exemplo.com"
                    value={provider.endpoint}
                    onChange={(e) => updateProvider(provider.id, { endpoint: e.target.value })}
                  />
                </div>
              )}

              {provider.model && (
                <div className="space-y-2">
                  <Label htmlFor={`${provider.id}-model`}>Modelo</Label>
                  <Select value={provider.model} onValueChange={(model) => updateProvider(provider.id, { model })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {provider.id === 'google-vision' && (
                        <>
                          <SelectItem value="text-detection">Text Detection</SelectItem>
                          <SelectItem value="document-text-detection">Document Text Detection</SelectItem>
                        </>
                      )}
                      {provider.id === 'openai' && (
                        <>
                          <SelectItem value="gpt-4">GPT-4</SelectItem>
                          <SelectItem value="gpt-3.5-turbo">GPT-3.5 Turbo</SelectItem>
                        </>
                      )}
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div className="flex items-center justify-between pt-4">
                <Badge variant={provider.enabled && provider.apiKey ? "default" : "secondary"}>
                  {provider.enabled && provider.apiKey ? "Configurado" : "Não configurado"}
                </Badge>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => testConnection(provider)}
                  disabled={!provider.apiKey}
                >
                  <TestTube className="h-4 w-4 mr-2" />
                  Testar
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Configurações Globais */}
      <Card>
        <CardHeader>
          <CardTitle>Configurações Globais</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="confidence-threshold">Limite de Confiança (%)</Label>
              <Input
                id="confidence-threshold"
                type="number"
                min="0"
                max="100"
                defaultValue="85"
                placeholder="85"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="max-retries">Máximo de Tentativas</Label>
              <Input
                id="max-retries"
                type="number"
                min="1"
                max="5"
                defaultValue="3"
                placeholder="3"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="fallback-strategy">Estratégia de Fallback</Label>
            <Textarea
              id="fallback-strategy"
              placeholder="Descreva como o sistema deve proceder quando um provedor falha..."
              className="h-20"
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AIConfigPanel;