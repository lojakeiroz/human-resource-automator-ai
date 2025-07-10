import { useState, useEffect } from "react";
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
import { aiConfigService, AIProviderConfig } from "@/services/aiConfigService";

interface AIProvider {
  id?: string;
  provider: string;
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
  const [providers, setProviders] = useState<AIProvider[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isTesting, setIsTesting] = useState<Record<string, boolean>>({});

  const defaultProviders: AIProvider[] = [
    {
      provider: 'google-vision',
      name: 'Google Cloud Vision',
      enabled: false,
      apiKey: '',
      model: 'text-detection',
      description: 'OCR e reconhecimento de texto em imagens'
    },
    {
      provider: 'openai',
      name: 'OpenAI GPT-4',
      enabled: false,
      apiKey: '',
      model: 'gpt-4o-mini',
      description: 'Processamento de texto e análise inteligente'
    }
  ];

  useEffect(() => {
    loadConfigurations();
  }, []);

  const loadConfigurations = async () => {
    try {
      const configs = await aiConfigService.getConfigs();
      
      // Merge configurações salvas com providers padrão
      const mergedProviders = defaultProviders.map(defaultProvider => {
        const savedConfig = configs.find(config => config.provider === defaultProvider.provider);
        
        if (savedConfig) {
          return {
            ...defaultProvider,
            id: savedConfig.id,
            enabled: savedConfig.is_active,
            apiKey: savedConfig.api_key,
            model: savedConfig.model_name || defaultProvider.model
          };
        }
        
        return defaultProvider;
      });

      setProviders(mergedProviders);
    } catch (error) {
      toast({
        title: "Erro ao carregar configurações",
        description: error instanceof Error ? error.message : "Erro desconhecido",
        variant: "destructive"
      });
    }
  };

  const updateProvider = (provider: string, updates: Partial<AIProvider>) => {
    setProviders(prev => prev.map(p => 
      p.provider === provider ? { ...p, ...updates } : p
    ));
  };

  const toggleApiKeyVisibility = (provider: string) => {
    setShowApiKeys(prev => ({
      ...prev,
      [provider]: !prev[provider]
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

    setIsTesting(prev => ({ ...prev, [provider.provider]: true }));

    try {
      toast({
        title: "Testando conexão...",
        description: `Verificando conectividade com ${provider.name}`,
      });

      const isValid = await aiConfigService.testConnection(
        provider.provider, 
        provider.apiKey, 
        provider.model
      );

      if (isValid) {
        toast({
          title: "Conexão testada com sucesso",
          description: `${provider.name} está funcionando corretamente!`,
        });
      } else {
        toast({
          title: "Falha na conexão",
          description: `Não foi possível conectar com ${provider.name}. Verifique a API Key.`,
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "Erro no teste de conexão",
        description: error instanceof Error ? error.message : "Erro desconhecido",
        variant: "destructive"
      });
    } finally {
      setIsTesting(prev => ({ ...prev, [provider.provider]: false }));
    }
  };

  const saveConfiguration = async () => {
    setIsLoading(true);
    
    try {
      const enabledProviders = providers.filter(p => p.enabled && p.apiKey);
      
      if (enabledProviders.length === 0) {
        toast({
          title: "Nenhum provedor configurado",
          description: "Configure pelo menos um provedor de IA.",
          variant: "destructive"
        });
        return;
      }

      // Salvar cada configuração no Supabase
      for (const provider of providers) {
        if (provider.apiKey) {
          await aiConfigService.saveConfig({
            provider: provider.provider,
            api_key: provider.apiKey,
            model_name: provider.model,
            is_active: provider.enabled
          });
        }
      }

      toast({
        title: "Configuração salva",
        description: `${enabledProviders.length} provedor(es) configurado(s) com sucesso.`,
      });

      // Recarregar configurações para atualizar IDs
      await loadConfigurations();
      
    } catch (error) {
      toast({
        title: "Erro ao salvar configuração",
        description: error instanceof Error ? error.message : "Erro desconhecido",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Configuração de IA</h2>
          <p className="text-gray-600">Configure os provedores de IA para processamento de documentos</p>
        </div>
        <Button 
          onClick={saveConfiguration} 
          disabled={isLoading}
          className="bg-blue-600 hover:bg-blue-700"
        >
          <Save className="h-4 w-4 mr-2" />
          {isLoading ? "Salvando..." : "Salvar Configuração"}
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {providers.map((provider) => (
          <Card key={provider.provider} className="relative">
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
                  onCheckedChange={(enabled) => updateProvider(provider.provider, { enabled })}
                />
              </div>
            </CardHeader>
            
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor={`${provider.provider}-apikey`}>API Key</Label>
                <div className="relative">
                  <Input
                    id={`${provider.provider}-apikey`}
                    type={showApiKeys[provider.provider] ? "text" : "password"}
                    placeholder="Digite sua API Key"
                    value={provider.apiKey}
                    onChange={(e) => updateProvider(provider.provider, { apiKey: e.target.value })}
                    className="pr-10"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3"
                    onClick={() => toggleApiKeyVisibility(provider.provider)}
                  >
                    {showApiKeys[provider.provider] ? 
                      <EyeOff className="h-4 w-4" /> : 
                      <Eye className="h-4 w-4" />
                    }
                  </Button>
                </div>
              </div>

              {provider.endpoint !== undefined && (
                <div className="space-y-2">
                  <Label htmlFor={`${provider.provider}-endpoint`}>Endpoint</Label>
                  <Input
                    id={`${provider.provider}-endpoint`}
                    placeholder="https://api.exemplo.com"
                    value={provider.endpoint}
                    onChange={(e) => updateProvider(provider.provider, { endpoint: e.target.value })}
                  />
                </div>
              )}

              {provider.model && (
                <div className="space-y-2">
                  <Label htmlFor={`${provider.provider}-model`}>Modelo</Label>
                  <Select value={provider.model} onValueChange={(model) => updateProvider(provider.provider, { model })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {provider.provider === 'google-vision' && (
                        <>
                          <SelectItem value="text-detection">Text Detection</SelectItem>
                          <SelectItem value="document-text-detection">Document Text Detection</SelectItem>
                        </>
                      )}
                      {provider.provider === 'openai' && (
                        <>
                          <SelectItem value="gpt-4o-mini">GPT-4o Mini</SelectItem>
                          <SelectItem value="gpt-4o">GPT-4o</SelectItem>
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
                  disabled={!provider.apiKey || isTesting[provider.provider]}
                >
                  <TestTube className="h-4 w-4 mr-2" />
                  {isTesting[provider.provider] ? "Testando..." : "Testar"}
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