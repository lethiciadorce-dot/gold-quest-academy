import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { Pencil, Trash2, GripVertical } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface Question {
  id: string;
  question: string;
  options: string[];
  correct_index: number;
  category: string;
  difficulty: number;
  souls: number;
  order_position: number;
}

interface QuestionsListProps {
  questions: Question[];
  onEdit: (question: Question) => void;
  onRefresh: () => void;
}

const categoryLabels: Record<string, string> = {
  money: 'Dinheiro',
  income: 'Renda',
  expenses: 'Gastos',
};

const categoryColors: Record<string, string> = {
  money: 'bg-yellow-500/20 text-yellow-700 dark:text-yellow-300',
  income: 'bg-green-500/20 text-green-700 dark:text-green-300',
  expenses: 'bg-red-500/20 text-red-700 dark:text-red-300',
};

export const QuestionsList = ({ questions, onEdit, onRefresh }: QuestionsListProps) => {
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const { toast } = useToast();

  const handleDelete = async () => {
    if (!deleteId) return;

    setIsDeleting(true);
    try {
      const { error } = await supabase.from('questions').delete().eq('id', deleteId);

      if (error) throw error;

      toast({
        title: 'Pergunta excluída',
        description: 'A pergunta foi removida com sucesso',
      });

      onRefresh();
    } catch (error) {
      console.error('Error deleting question:', error);
      toast({
        title: 'Erro ao excluir',
        description: 'Não foi possível excluir a pergunta',
        variant: 'destructive',
      });
    } finally {
      setIsDeleting(false);
      setDeleteId(null);
    }
  };

  if (questions.length === 0) {
    return (
      <div className="text-center py-12 bg-card/50 rounded-lg border border-dashed">
        <p className="text-muted-foreground text-base sm:text-lg">
          Nenhuma pergunta cadastrada ainda.
        </p>
        <p className="text-sm text-muted-foreground mt-2">
          Clique em "Nova Pergunta" para adicionar a primeira.
        </p>
      </div>
    );
  }

  return (
    <>
      {/* Mobile view - Cards */}
      <div className="block sm:hidden space-y-4">
        {questions.map((question) => (
          <div
            key={question.id}
            className="bg-card border rounded-lg p-4 space-y-3"
          >
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm line-clamp-2 break-words">
                  {question.question}
                </p>
                <div className="flex flex-wrap gap-2 mt-2">
                  <Badge className={categoryColors[question.category]}>
                    {categoryLabels[question.category]}
                  </Badge>
                  <Badge variant="outline" className="text-xs">
                    {question.souls} souls
                  </Badge>
                  <Badge variant="outline" className="text-xs">
                    Dif. {question.difficulty}
                  </Badge>
                </div>
              </div>
              <GripVertical className="w-5 h-5 text-muted-foreground flex-shrink-0" />
            </div>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => onEdit(question)}
                className="flex-1"
              >
                <Pencil className="w-4 h-4 mr-1" />
                Editar
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setDeleteId(question.id)}
                className="flex-1 text-destructive hover:text-destructive"
              >
                <Trash2 className="w-4 h-4 mr-1" />
                Excluir
              </Button>
            </div>
          </div>
        ))}
      </div>

      {/* Desktop view - Table */}
      <div className="hidden sm:block rounded-lg border overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12"></TableHead>
              <TableHead className="min-w-[300px]">Pergunta</TableHead>
              <TableHead className="w-32">Categoria</TableHead>
              <TableHead className="w-24 text-center">Souls</TableHead>
              <TableHead className="w-24 text-center">Dif.</TableHead>
              <TableHead className="w-32 text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {questions.map((question) => (
              <TableRow key={question.id}>
                <TableCell>
                  <GripVertical className="w-5 h-5 text-muted-foreground cursor-move" />
                </TableCell>
                <TableCell className="font-medium">
                  <div className="line-clamp-2 break-words pr-2">
                    {question.question}
                  </div>
                </TableCell>
                <TableCell>
                  <Badge className={categoryColors[question.category]}>
                    {categoryLabels[question.category]}
                  </Badge>
                </TableCell>
                <TableCell className="text-center">{question.souls}</TableCell>
                <TableCell className="text-center">{question.difficulty}</TableCell>
                <TableCell>
                  <div className="flex gap-2 justify-end">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => onEdit(question)}
                    >
                      <Pencil className="w-4 h-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setDeleteId(question.id)}
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir esta pergunta? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} disabled={isDeleting}>
              {isDeleting ? 'Excluindo...' : 'Excluir'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};
