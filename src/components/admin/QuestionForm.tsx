import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';

const questionSchema = z.object({
  question: z.string().min(10, 'A pergunta deve ter no mínimo 10 caracteres').max(200, 'A pergunta deve ter no máximo 200 caracteres'),
  option_a: z.string().min(1, 'Alternativa A é obrigatória').max(100, 'Máximo 100 caracteres'),
  option_b: z.string().min(1, 'Alternativa B é obrigatória').max(100, 'Máximo 100 caracteres'),
  option_c: z.string().min(1, 'Alternativa C é obrigatória').max(100, 'Máximo 100 caracteres'),
  option_d: z.string().min(1, 'Alternativa D é obrigatória').max(100, 'Máximo 100 caracteres'),
  correct_answer: z.enum(['A', 'B', 'C', 'D']),
  category: z.enum(['money', 'income', 'expenses']),
  difficulty: z.number().min(1).max(5),
  souls: z.number().min(50).max(500),
});

export type QuestionFormData = z.infer<typeof questionSchema>;

interface QuestionFormProps {
  initialData?: Partial<QuestionFormData>;
  onSubmit: (data: QuestionFormData) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
}

const categoryLabels = {
  money: 'Dinheiro',
  income: 'Renda',
  expenses: 'Gastos',
};

export const QuestionForm = ({ initialData, onSubmit, onCancel, isLoading }: QuestionFormProps) => {
  const form = useForm<QuestionFormData>({
    resolver: zodResolver(questionSchema),
    defaultValues: {
      question: initialData?.question || '',
      option_a: initialData?.option_a || '',
      option_b: initialData?.option_b || '',
      option_c: initialData?.option_c || '',
      option_d: initialData?.option_d || '',
      correct_answer: initialData?.correct_answer || 'A',
      category: initialData?.category || 'money',
      difficulty: initialData?.difficulty || 1,
      souls: initialData?.souls || 100,
    },
  });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="question"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Pergunta</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Digite a pergunta aqui..."
                  className="resize-none"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="option_a"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Alternativa A</FormLabel>
                <FormControl>
                  <Input placeholder="Opção A" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="option_b"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Alternativa B</FormLabel>
                <FormControl>
                  <Input placeholder="Opção B" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="option_c"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Alternativa C</FormLabel>
                <FormControl>
                  <Input placeholder="Opção C" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="option_d"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Alternativa D</FormLabel>
                <FormControl>
                  <Input placeholder="Opção D" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="correct_answer"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Resposta Correta</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione a resposta" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="A">A</SelectItem>
                    <SelectItem value="B">B</SelectItem>
                    <SelectItem value="C">C</SelectItem>
                    <SelectItem value="D">D</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="category"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Categoria</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione a categoria" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="money">{categoryLabels.money}</SelectItem>
                    <SelectItem value="income">{categoryLabels.income}</SelectItem>
                    <SelectItem value="expenses">{categoryLabels.expenses}</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="difficulty"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Dificuldade: {field.value}</FormLabel>
              <FormControl>
                <Slider
                  min={1}
                  max={5}
                  step={1}
                  value={[field.value]}
                  onValueChange={(vals) => field.onChange(vals[0])}
                  className="w-full"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="souls"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Souls (Pontos)</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  min={50}
                  max={500}
                  step={50}
                  {...field}
                  onChange={(e) => field.onChange(parseInt(e.target.value))}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex gap-3 justify-end pt-4">
          <Button type="button" variant="outline" onClick={onCancel} disabled={isLoading}>
            Cancelar
          </Button>
          <Button type="submit" disabled={isLoading}>
            {isLoading ? 'Salvando...' : 'Salvar Pergunta'}
          </Button>
        </div>
      </form>
    </Form>
  );
};
