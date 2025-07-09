
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Zap, Activity, DollarSign } from "lucide-react";

const providers = [
  {
    name: "OpenAI GPT-4",
    status: "active",
    usage: 78,
    cost: "$234.56",
    requests: "2,847",
    latency: "1.2s",
  },
  {
    name: "Google Cloud Vision",
    status: "active",
    usage: 65,
    cost: "$189.34",
    requests: "1,923",
    latency: "0.8s",
  },
  {
    name: "Azure Cognitive",
    status: "warning",
    usage: 92,
    cost: "$345.78",
    requests: "3,156",
    latency: "2.1s",
  },
  {
    name: "AWS Textract",
    status: "active",
    usage: 43,
    cost: "$123.45",
    requests: "1,234",
    latency: "1.5s",
  },
];

const AIProviderStatus = () => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'warning': return 'bg-yellow-100 text-yellow-800';
      case 'error': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getUsageColor = (usage: number) => {
    if (usage >= 90) return 'bg-red-500';
    if (usage >= 70) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Zap className="h-5 w-5" />
          <span>Status dos Provedores IA</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {providers.map((provider, index) => (
            <div key={index} className="border rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-semibold text-gray-900">{provider.name}</h4>
                <Badge className={getStatusColor(provider.status)}>
                  {provider.status === 'active' && 'Ativo'}
                  {provider.status === 'warning' && 'Atenção'}
                  {provider.status === 'error' && 'Erro'}
                </Badge>
              </div>
              
              <div className="grid grid-cols-2 gap-4 mb-3">
                <div className="flex items-center space-x-2">
                  <Activity className="h-4 w-4 text-gray-400" />
                  <span className="text-sm text-gray-600">Requisições: {provider.requests}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <DollarSign className="h-4 w-4 text-gray-400" />
                  <span className="text-sm text-gray-600">Custo: {provider.cost}</span>
                </div>
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Uso da Cota</span>
                  <span className="font-medium">{provider.usage}%</span>
                </div>
                <Progress 
                  value={provider.usage} 
                  className="h-2"
                  // @ts-ignore
                  style={{'--progress-background': getUsageColor(provider.usage)}}
                />
              </div>
              
              <div className="text-xs text-gray-500 mt-2">
                Latência média: {provider.latency}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default AIProviderStatus;
