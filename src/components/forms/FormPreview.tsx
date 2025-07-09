import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Save, RefreshCw, Wand2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Template, TemplateField } from "@/hooks/useTemplates";

interface FormPreviewProps {
  template: Template;
  extractedData?: Record<string, any>;
  onSave?: (data: Record<string, any>) => void;
}

const FormPreview = ({ template, extractedData, onSave }: FormPreviewProps) => {
  const [formData, setFormData] = useState<Record<string, any>>(extractedData || {});
  const { toast } = useToast();

  const updateField = (fieldName: string, value: any) => {
    setFormData(prev => ({ ...prev, [fieldName]: value }));
  };

  const resetForm = () => {
    setFormData({});
    toast({
      title: "Formulário limpo",
      description: "Todos os campos foram resetados."
    });
  };

  const fillWithExtractedData = () => {
    if (extractedData) {
      setFormData(extractedData);
      toast({
        title: "Dados preenchidos",
        description: "Formulário preenchido com dados extraídos."
      });
    }
  };

  const saveForm = () => {
    const requiredFields = template.fields.filter(field => field.required);
    const missingFields = requiredFields.filter(field => !formData[field.name]);

    if (missingFields.length > 0) {
      toast({
        title: "Campos obrigatórios",
        description: `Preencha: ${missingFields.map(f => f.label).join(', ')}`,
        variant: "destructive"
      });
      return;
    }

    onSave?.(formData);
    toast({
      title: "Formulário salvo",
      description: "Dados salvos com sucesso!"
    });
  };

  const renderField = (field: TemplateField) => {
    const value = formData[field.name] || '';
    const hasExtractedData = extractedData && extractedData[field.name];

    switch (field.type) {
      case 'textarea':
        return (
          <Textarea
            id={field.name}
            value={value}
            onChange={(e) => updateField(field.name, e.target.value)}
            placeholder={field.placeholder}
            className={hasExtractedData ? "border-green-300 bg-green-50" : ""}
          />
        );

      case 'select':
        return (
          <Select value={value} onValueChange={(val) => updateField(field.name, val)}>
            <SelectTrigger className={hasExtractedData ? "border-green-300 bg-green-50" : ""}>
              <SelectValue placeholder={field.placeholder || "Selecione uma opção"} />
            </SelectTrigger>
            <SelectContent>
              {field.options?.map(option => (
                <SelectItem key={option} value={option}>
                  {option}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        );

      case 'checkbox':
        return (
          <div className="flex items-center space-x-2">
            <Checkbox
              id={field.name}
              checked={!!value}
              onCheckedChange={(checked) => updateField(field.name, checked)}
              className={hasExtractedData ? "border-green-300" : ""}
            />
            <Label htmlFor={field.name} className="text-sm">
              {field.label}
            </Label>
          </div>
        );

      default:
        return (
          <Input
            id={field.name}
            type={field.type}
            value={value}
            onChange={(e) => updateField(field.name, e.target.value)}
            placeholder={field.placeholder}
            className={hasExtractedData ? "border-green-300 bg-green-50" : ""}
          />
        );
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center space-x-2">
              <span>{template.name}</span>
              <Badge variant="secondary">{template.category}</Badge>
            </CardTitle>
            {template.description && (
              <p className="text-sm text-gray-600 mt-1">{template.description}</p>
            )}
          </div>
          <div className="flex space-x-2">
            {extractedData && (
              <Button
                variant="outline"
                size="sm"
                onClick={fillWithExtractedData}
              >
                <Wand2 className="h-4 w-4 mr-2" />
                Preencher IA
              </Button>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={resetForm}
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Limpar
            </Button>
            <Button onClick={saveForm}>
              <Save className="h-4 w-4 mr-2" />
              Salvar
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {template.fields.map((field) => (
            <div key={field.id} className="space-y-2">
              {field.type !== 'checkbox' && (
                <Label htmlFor={field.name} className="flex items-center space-x-1">
                  <span>{field.label}</span>
                  {field.required && <span className="text-red-500">*</span>}
                  {extractedData && extractedData[field.name] && (
                    <Badge variant="outline" className="ml-2 text-xs bg-green-100 text-green-800">
                      IA
                    </Badge>
                  )}
                </Label>
              )}
              {renderField(field)}
            </div>
          ))}
        </div>

        {extractedData && (
          <div className="mt-6 p-4 bg-blue-50 rounded-lg">
            <h4 className="font-medium text-blue-900 mb-2">Dados Extraídos pela IA</h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
              {Object.entries(extractedData).map(([key, value]) => (
                <div key={key} className="text-blue-700">
                  <span className="font-medium">{key}:</span> {String(value)}
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default FormPreview;