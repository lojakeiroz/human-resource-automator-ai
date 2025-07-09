
import { useState } from 'react';

export interface TemplateField {
  id: string;
  name: string;
  label: string;
  type: 'text' | 'email' | 'number' | 'date' | 'select' | 'textarea' | 'checkbox';
  required: boolean;
  placeholder?: string;
  options?: string[]; // Para campos select
}

export interface Template {
  id: string;
  name: string;
  category: string;
  description?: string;
  fields: TemplateField[];
  usage: number;
  icon: string;
  createdAt: Date;
  updatedAt: Date;
}

const initialTemplates: Template[] = [
  {
    id: '1',
    name: 'Ficha de Admissão',
    category: 'Onboarding',
    description: 'Formulário completo para admissão de novos funcionários',
    fields: [
      { id: '1', name: 'fullName', label: 'Nome Completo', type: 'text', required: true },
      { id: '2', name: 'email', label: 'Email', type: 'email', required: true },
      { id: '3', name: 'cpf', label: 'CPF', type: 'text', required: true },
      { id: '4', name: 'birthDate', label: 'Data de Nascimento', type: 'date', required: true },
    ],
    usage: 89,
    icon: 'Users',
    createdAt: new Date('2024-01-15'),
    updatedAt: new Date('2024-01-15'),
  },
  {
    id: '2',
    name: 'Avaliação de Currículo',
    category: 'Recrutamento',
    description: 'Template para análise e avaliação de currículos',
    fields: [
      { id: '1', name: 'candidateName', label: 'Nome do Candidato', type: 'text', required: true },
      { id: '2', name: 'position', label: 'Cargo Pretendido', type: 'text', required: true },
      { id: '3', name: 'experience', label: 'Anos de Experiência', type: 'number', required: true },
    ],
    usage: 156,
    icon: 'FileText',
    createdAt: new Date('2024-01-10'),
    updatedAt: new Date('2024-01-20'),
  },
  {
    id: '3',
    name: 'Formulário de Benefícios',
    category: 'Gestão',
    description: 'Cadastro e gestão de benefícios dos funcionários',
    fields: [
      { id: '1', name: 'employeeName', label: 'Nome do Funcionário', type: 'text', required: true },
      { id: '2', name: 'healthPlan', label: 'Plano de Saúde', type: 'checkbox', required: false },
    ],
    usage: 67,
    icon: 'Award',
    createdAt: new Date('2024-01-05'),
    updatedAt: new Date('2024-01-25'),
  },
];

export const useTemplates = () => {
  const [templates, setTemplates] = useState<Template[]>(initialTemplates);

  const addTemplate = (template: Omit<Template, 'id' | 'usage' | 'createdAt' | 'updatedAt'>) => {
    const newTemplate: Template = {
      ...template,
      id: Date.now().toString(),
      usage: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    setTemplates(prev => [...prev, newTemplate]);
    return newTemplate;
  };

  const updateTemplate = (id: string, updates: Partial<Template>) => {
    setTemplates(prev => 
      prev.map(template => 
        template.id === id 
          ? { ...template, ...updates, updatedAt: new Date() }
          : template
      )
    );
  };

  const deleteTemplate = (id: string) => {
    setTemplates(prev => prev.filter(template => template.id !== id));
  };

  const getTemplate = (id: string) => {
    return templates.find(template => template.id === id);
  };

  return {
    templates,
    addTemplate,
    updateTemplate,
    deleteTemplate,
    getTemplate,
  };
};
