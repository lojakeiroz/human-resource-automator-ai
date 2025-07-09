
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, Edit, Trash2, FileText, Users, Award, Eye } from "lucide-react";
import { useTemplates } from "@/hooks/useTemplates";
import { TemplateDialog } from "./TemplateDialog";
import { TemplatePreview } from "./TemplatePreview";
import { useToast } from "@/hooks/use-toast";

const TemplateManager = () => {
  const { templates, deleteTemplate } = useTemplates();
  const { toast } = useToast();
  
  const [selectedCategory, setSelectedCategory] = useState<string>('Todos');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<any>(null);
  const [previewTemplate, setPreviewTemplate] = useState<any>(null);
  const [dialogMode, setDialogMode] = useState<'create' | 'edit'>('create');
  
  const categories = ['Todos', 'Onboarding', 'Recrutamento', 'Gestão', 'Desligamento'];
  
  const filteredTemplates = selectedCategory === 'Todos' 
    ? templates 
    : templates.filter(t => t.category === selectedCategory);

  const getIcon = (iconName: string) => {
    const icons: any = {
      Users,
      FileText,
      Award,
    };
    return icons[iconName] || FileText;
  };

  const handleCreateNew = () => {
    setEditingTemplate(null);
    setDialogMode('create');
    setDialogOpen(true);
  };

  const handleEdit = (template: any) => {
    setEditingTemplate(template);
    setDialogMode('edit');
    setDialogOpen(true);
  };

  const handlePreview = (template: any) => {
    setPreviewTemplate(template);
    setPreviewOpen(true);
  };

  const handleDelete = (template: any) => {
    if (window.confirm(`Tem certeza que deseja excluir o template "${template.name}"?`)) {
      deleteTemplate(template.id);
      toast({
        title: "Template excluído",
        description: `O template "${template.name}" foi excluído com sucesso.`
      });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">Gerenciar Templates</h2>
        <Button onClick={handleCreateNew} className="bg-blue-600 hover:bg-blue-700">
          <Plus className="h-4 w-4 mr-2" />
          Novo Template
        </Button>
      </div>

      {/* Category Filter */}
      <div className="flex space-x-2">
        {categories.map((category) => (
          <Button
            key={category}
            variant={selectedCategory === category ? "default" : "outline"}
            size="sm"
            onClick={() => setSelectedCategory(category)}
            className={selectedCategory === category ? "bg-blue-600 hover:bg-blue-700" : ""}
          >
            {category}
          </Button>
        ))}
      </div>

      {/* Templates Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredTemplates.map((template) => {
          const IconComponent = getIcon(template.icon);
          return (
            <Card key={template.id} className="hover:shadow-lg transition-shadow duration-200">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <div className="bg-blue-50 p-2 rounded-lg">
                      <IconComponent className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">{template.name}</CardTitle>
                      <Badge variant="secondary" className="mt-1">
                        {template.category}
                      </Badge>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {template.description && (
                    <p className="text-sm text-gray-600 line-clamp-2">
                      {template.description}
                    </p>
                  )}
                  
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Campos:</span>
                    <span className="font-medium">{template.fields.length}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Uso (último mês):</span>
                    <span className="font-medium">{template.usage}</span>
                  </div>
                  
                  <div className="flex space-x-2 pt-4">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="flex-1"
                      onClick={() => handlePreview(template)}
                    >
                      <Eye className="h-4 w-4 mr-1" />
                      Preview
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="flex-1"
                      onClick={() => handleEdit(template)}
                    >
                      <Edit className="h-4 w-4 mr-1" />
                      Editar
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="text-red-600 hover:text-red-700"
                      onClick={() => handleDelete(template)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Template Dialog */}
      <TemplateDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        template={editingTemplate}
        mode={dialogMode}
      />

      {/* Template Preview */}
      <TemplatePreview
        open={previewOpen}
        onOpenChange={setPreviewOpen}
        template={previewTemplate}
      />
    </div>
  );
};

export default TemplateManager;
