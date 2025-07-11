
import Header from "@/components/layout/Header";
import StatsGrid from "@/components/dashboard/StatsGrid";
import DocumentUpload from "@/components/upload/DocumentUpload";
import ProcessingChart from "@/components/dashboard/ProcessingChart";
import AIProviderStatus from "@/components/dashboard/AIProviderStatus";
import TemplateManager from "@/components/templates/TemplateManager";
import AIConfigPanel from "@/components/ai/AIConfigPanel";
import AuthModal from "@/components/auth/AuthModal";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/hooks/useAuth";

const Index = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-lg">Carregando...</div>
      </div>
    );
  }

  if (!user) {
    return <AuthModal />;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Dashboard - Sistema de Extração RH
          </h1>
          <p className="text-gray-600">
            Processamento inteligente de documentos com IA para otimizar processos de RH
          </p>
        </div>

        <Tabs defaultValue="dashboard" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4 lg:w-auto lg:grid-cols-4">
            <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
            <TabsTrigger value="upload">Upload</TabsTrigger>
            <TabsTrigger value="templates">Templates</TabsTrigger>
            <TabsTrigger value="ai-config">Config IA</TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard" className="space-y-6">
            <StatsGrid />
            
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <ProcessingChart />
              <AIProviderStatus />
            </div>
          </TabsContent>

          <TabsContent value="upload" className="space-y-6">
            <DocumentUpload />
          </TabsContent>

          <TabsContent value="templates" className="space-y-6">
            <TemplateManager />
          </TabsContent>

          <TabsContent value="ai-config" className="space-y-6">
            <AIConfigPanel />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default Index;
