
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Template } from "@/hooks/useTemplates";

interface TemplatePreviewProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  template: Template | null;
}

export const TemplatePreview = ({ open, onOpenChange, template }: TemplatePreviewProps) => {
  if (!template) return null;

  const renderField = (field: any) => {
    const commonProps = {
      id: field.name,
      placeholder: field.placeholder,
      disabled: true
    };

    switch (field.type) {
      case 'textarea':
        return <Textarea {...commonProps} rows={3} />;
      case 'select':
        return (
          <Select disabled>
            <SelectTrigger>
              <SelectValue placeholder={field.placeholder || "Selecione uma opção"} />
            </SelectTrigger>
            <SelectContent>
              {field.options?.map((option: string, index: number) => (
                <SelectItem key={index} value={option}>{option}</SelectItem>
              )) || <SelectItem value="option1">Opção 1</SelectItem>}
            </SelectContent>
          </Select>
        );
      case 'checkbox':
        return (
          <div className="flex items-center space-x-2">
            <Checkbox id={field.name} disabled />
            <Label htmlFor={field.name} className="text-sm text-gray-600">
              {field.placeholder || 'Marque esta opção'}
            </Label>
          </div>
        );
      default:
        return <Input {...commonProps} type={field.type} />;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <span>Preview: {template.name}</span>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="font-semibold text-gray-900">Informações do Template</h3>
            <div className="mt-2 space-y-1 text-sm text-gray-600">
              <p><strong>Categoria:</strong> {template.category}</p>
              <p><strong>Campos:</strong> {template.fields.length}</p>
              {template.description && (
                <p><strong>Descrição:</strong> {template.description}</p>
              )}
            </div>
          </div>

          <div className="space-y-4">
            <h4 className="font-semibold text-gray-900">Campos do Formulário</h4>
            <form className="space-y-4">
              {template.fields.map((field) => (
                <div key={field.id} className="space-y-2">
                  <Label htmlFor={field.name} className="flex items-center space-x-1">
                    <span>{field.label}</span>
                    {field.required && <span className="text-red-500">*</span>}
                  </Label>
                  {renderField(field)}
                </div>
              ))}
            </form>
          </div>

          <div className="flex justify-end pt-4 border-t">
            <Button onClick={() => onOpenChange(false)}>
              Fechar Preview
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
