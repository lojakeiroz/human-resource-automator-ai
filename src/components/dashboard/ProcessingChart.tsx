
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";

const data = [
  { name: 'Jan', curriculums: 145, contratos: 89, folhasPagamento: 67, outros: 234 },
  { name: 'Fev', curriculums: 178, contratos: 123, folhasPagamento: 89, outros: 267 },
  { name: 'Mar', curriculums: 234, contratos: 156, folhasPagamento: 98, outros: 289 },
  { name: 'Abr', curriculums: 267, contratos: 178, folhasPagamento: 112, outros: 334 },
  { name: 'Mai', curriculums: 289, contratos: 201, folhasPagamento: 134, outros: 378 },
  { name: 'Jun', curriculums: 334, contratos: 234, folhasPagamento: 156, outros: 423 },
];

const ProcessingChart = () => {
  return (
    <Card className="col-span-2">
      <CardHeader>
        <CardTitle>Documentos Processados por Tipo</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="curriculums" stackId="a" fill="#3b82f6" name="Currículos" />
              <Bar dataKey="contratos" stackId="a" fill="#10b981" name="Contratos" />
              <Bar dataKey="folhasPagamento" stackId="a" fill="#f59e0b" name="Folhas de Pagamento" />
              <Bar dataKey="outros" stackId="a" fill="#8b5cf6" name="Outros" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
};

export default ProcessingChart;
