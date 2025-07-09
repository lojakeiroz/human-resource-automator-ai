
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, Edit, Trash2, FileText, Users, Award } from "lucide-react";

interface Template {
  id: string;
  name: string;
  category: string;
  fields: number;
  usage: number;
  icon: any;
}

const templates: Template[] = [
  {
    id: '1',
    name: 'Ficha de Admissão',
    category: 'Onboarding',
    fields: 24,
    usage: 89,
    icon: Users,
  },
  {
    id: '2',
    name: 'Avaliação de Currículo',
    category: 'Recrutamento',
    fields: 18,
    usage: 156,
    icon: FileText,
  },
  {
    id: '3',
    name: 'Formulário de Benefícios',
    category: 'Gestão',
    fields: 16,
    usage: 67,
    icon: Award,
  },
  {
    id: '4',
    name: 'Termo de Rescisão',
    category: 'Desligamento',
    fields: 12,
    usage: 34,
    icon: FileText,
  },
];

const TemplateManager = () => {
  const [selectedCategory, setSelectedCategory] = useState<string>('Todos');
  
  const categories = ['Todos', 'Onboarding', 'Recrutamento', 'Gestão', 'Desligamento'];
  
  const filteredTemplates = selectedCategory === 'Todos' 
    ? templates 
    : templates.filter(t => t.category === selectedCategory);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">Gerenciar Templates</h2>
        <Button className="bg-blue-600 hover:bg-blue-700">
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
        {filteredTemplates.map((template) => (
          <Card key={template.id} className="hover:shadow-lg transition-shadow duration-200">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div className="bg-blue-50 p-2 rounded-lg">
                    <template.icon className="h-5 w-5 text-blue-600" />
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
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Campos:</span>
                  <span className="font-medium">{template.fields}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Uso (último mês):</span>
                  <span className="font-medium">{template.usage}</span>
                </div>
                
                <div className="flex space-x-2 pt-4">
                  <Button variant="outline" size="sm" className="flex-1">
                    <Edit className="h-4 w-4 mr-1" />
                    Editar
                  </Button>
                  <Button variant="outline" size="sm" className="text-red-600 hover:text-red-700">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default TemplateManager;
