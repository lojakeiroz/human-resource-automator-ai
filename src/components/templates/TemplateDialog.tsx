
import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Trash2 } from "lucide-react";
import { Template, TemplateField, useTemplates } from "@/hooks/useTemplates";
import { useToast } from "@/hooks/use-toast";

interface TemplateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  template?: Template | null;
  mode: 'create' | 'edit';
}

const fieldTypes = [
  { value: 'text', label: 'Texto' },
  { value: 'email', label: 'Email' },
  { value: 'number', label: 'Número' },
  { value: 'date', label: 'Data' },
  { value: 'select', label: 'Seleção' },
  { value: 'textarea', label: 'Texto Longo' },
  { value: 'checkbox', label: 'Checkbox' },
];

const categories = ['Onboarding', 'Recrutamento', 'Gestão', 'Desligamento'];
const icons = ['Users', 'FileText', 'Award', 'Briefcase', 'User', 'Building'];

export const TemplateDialog = ({ open, onOpenChange, template, mode }: TemplateDialogProps) => {
  const { addTemplate, updateTemplate } = useTemplates();
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    name: '',
    category: '',
    description: '',
    icon: 'FileText',
    fields: [] as TemplateField[]
  });

  useEffect(() => {
    if (template && mode === 'edit') {
      setFormData({
        name: template.name,
        category: template.category,
        description: template.description || '',
        icon: template.icon,
        fields: template.fields
      });
    } else {
      setFormData({
        name: '',
        category: '',
        description: '',
        icon: 'FileText',
        fields: []
      });
    }
  }, [template, mode, open]);

  const addField = () => {
    const newField: TemplateField = {
      id: Date.now().toString(),
      name: '',
      label: '',
      type: 'text',
      required: false,
      placeholder: ''
    };
    setFormData(prev => ({
      ...prev,
      fields: [...prev.fields, newField]
    }));
  };

  const updateField = (index: number, updates: Partial<TemplateField>) => {
    setFormData(prev => ({
      ...prev,
      fields: prev.fields.map((field, i) => 
        i === index ? { ...field, ...updates } : field
      )
    }));
  };

  const removeField = (index: number) => {
    setFormData(prev => ({
      ...prev,
      fields: prev.fields.filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim() || !formData.category || formData.fields.length === 0) {
      toast({
        title: "Erro",
        description: "Preencha todos os campos obrigatórios e adicione pelo menos um campo.",
        variant: "destructive"
      });
      return;
    }

    const templateData = {
      name: formData.name.trim(),
      category: formData.category,
      description: formData.description.trim(),
      icon: formData.icon,
      fields: formData.fields.filter(field => field.name.trim() && field.label.trim())
    };

    if (mode === 'edit' && template) {
      updateTemplate(template.id, templateData);
      toast({
        title: "Sucesso",
        description: "Template atualizado com sucesso!"
      });
    } else {
      addTemplate(templateData);
      toast({
        title: "Sucesso", 
        description: "Template criado com sucesso!"
      });
    }

    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {mode === 'edit' ? 'Editar Template' : 'Novo Template'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nome do Template *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Ex: Ficha de Admissão"
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="category">Categoria *</Label>
              <Select 
                value={formData.category} 
                onValueChange={(value) => setFormData(prev => ({ ...prev, category: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione uma categoria" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map(category => (
                    <SelectItem key={category} value={category}>{category}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="icon">Ícone</Label>
              <Select 
                value={formData.icon} 
                onValueChange={(value) => setFormData(prev => ({ ...prev, icon: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {icons.map(icon => (
                    <SelectItem key={icon} value={icon}>{icon}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="description">Descrição</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Descreva o propósito deste template..."
                rows={2}
              />
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label className="text-lg font-semibold">Campos do Formulário</Label>
              <Button type="button" onClick={addField} size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Adicionar Campo
              </Button>
            </div>

            <div className="space-y-4 max-h-96 overflow-y-auto">
              {formData.fields.map((field, index) => (
                <div key={field.id} className="border rounded-lg p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium">Campo {index + 1}</h4>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeField(index)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label>Nome do Campo</Label>
                      <Input
                        value={field.name}
                        onChange={(e) => updateField(index, { name: e.target.value })}
                        placeholder="Ex: fullName"
                      />
                    </div>
                    <div>
                      <Label>Rótulo</Label>
                      <Input
                        value={field.label}
                        onChange={(e) => updateField(index, { label: e.target.value })}
                        placeholder="Ex: Nome Completo"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label>Tipo</Label>
                      <Select 
                        value={field.type} 
                        onValueChange={(value) => updateField(index, { type: value as TemplateField['type'] })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {fieldTypes.map(type => (
                            <SelectItem key={type.value} value={type.value}>
                              {type.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Placeholder</Label>
                      <Input
                        value={field.placeholder || ''}
                        onChange={(e) => updateField(index, { placeholder: e.target.value })}
                        placeholder="Texto de ajuda..."
                      />
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id={`required-${field.id}`}
                      checked={field.required}
                      onChange={(e) => updateField(index, { required: e.target.checked })}
                      className="rounded"
                    />
                    <Label htmlFor={`required-${field.id}`}>Campo obrigatório</Label>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-end space-x-2 pt-4 border-t">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" className="bg-blue-600 hover:bg-blue-700">
              {mode === 'edit' ? 'Atualizar' : 'Criar'} Template
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
