import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { useAdminCheck } from '@/hooks/useAdminCheck';
import { QuestionsList } from '@/components/admin/QuestionsList';
import { QuestionForm, QuestionFormData } from '@/components/admin/QuestionForm';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Plus, LogOut, Shield } from 'lucide-react';

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

const Admin = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { isAdmin, loading: authLoading, user } = useAdminCheck();
  const [questions, setQuestions] = useState<Question[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!authLoading && !isAdmin) {
      navigate('/admin-login');
    }
  }, [isAdmin, authLoading, navigate]);

  useEffect(() => {
    if (isAdmin) {
      loadQuestions();
    }
  }, [isAdmin]);

  const loadQuestions = async () => {
    try {
      const { data, error } = await supabase
        .from('questions')
        .select('*')
        .order('order_position', { ascending: true });

      if (error) throw error;
      
      const formattedQuestions: Question[] = (data || []).map(q => ({
        ...q,
        options: Array.isArray(q.options) ? q.options : JSON.parse(q.options as string),
      }));
      
      setQuestions(formattedQuestions);
    } catch (error) {
      console.error('Error loading questions:', error);
      toast({
        title: 'Erro ao carregar perguntas',
        description: 'Tente novamente mais tarde',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/');
  };

  const handleEdit = (question: Question) => {
    const correctAnswerLetter = ['A', 'B', 'C', 'D'][question.correct_index];
    setEditingQuestion(question);
    setIsDialogOpen(true);
  };

  const handleNewQuestion = () => {
    setEditingQuestion(null);
    setIsDialogOpen(true);
  };

  const handleSubmit = async (data: QuestionFormData) => {
    setIsSaving(true);
    try {
      const options = [data.option_a, data.option_b, data.option_c, data.option_d];
      const correctIndex = ['A', 'B', 'C', 'D'].indexOf(data.correct_answer);

      if (editingQuestion) {
        // Update existing question
        const { error } = await supabase
          .from('questions')
          .update({
            question: data.question,
            options,
            correct_index: correctIndex,
            category: data.category,
            difficulty: data.difficulty,
            souls: data.souls,
          })
          .eq('id', editingQuestion.id);

        if (error) throw error;

        toast({
          title: 'Pergunta atualizada',
          description: 'As alterações foram salvas com sucesso',
        });
      } else {
        // Create new question
        const maxPosition = questions.length > 0 
          ? Math.max(...questions.map(q => q.order_position))
          : 0;

        const { error } = await supabase.from('questions').insert({
          question: data.question,
          options,
          correct_index: correctIndex,
          category: data.category,
          difficulty: data.difficulty,
          souls: data.souls,
          order_position: maxPosition + 1,
        });

        if (error) throw error;

        toast({
          title: 'Pergunta criada',
          description: 'A nova pergunta foi adicionada com sucesso',
        });
      }

      setIsDialogOpen(false);
      setEditingQuestion(null);
      loadQuestions();
    } catch (error) {
      console.error('Error saving question:', error);
      toast({
        title: 'Erro ao salvar',
        description: 'Não foi possível salvar a pergunta',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Carregando...</p>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return null;
  }

  const formInitialData = editingQuestion
    ? {
        question: editingQuestion.question,
        option_a: editingQuestion.options[0],
        option_b: editingQuestion.options[1],
        option_c: editingQuestion.options[2],
        option_d: editingQuestion.options[3],
        correct_answer: ['A', 'B', 'C', 'D'][editingQuestion.correct_index] as 'A' | 'B' | 'C' | 'D',
        category: editingQuestion.category as 'money' | 'income' | 'expenses',
        difficulty: editingQuestion.difficulty,
        souls: editingQuestion.souls,
      }
    : undefined;

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background/95 to-primary/5">
      <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                <Shield className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl font-bold">Painel Admin</h1>
                <p className="text-xs sm:text-sm text-muted-foreground">
                  {user?.email}
                </p>
              </div>
            </div>
            <Button variant="outline" onClick={handleLogout} className="w-full sm:w-auto">
              <LogOut className="w-4 h-4 mr-2" />
              Sair
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 sm:py-8">
        <div className="mb-6 sm:mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h2 className="text-2xl sm:text-3xl font-bold">Gerenciar Perguntas</h2>
              <p className="text-sm sm:text-base text-muted-foreground mt-1">
                Total: {questions.length} questões
              </p>
            </div>
            <Button onClick={handleNewQuestion} className="w-full sm:w-auto">
              <Plus className="w-4 h-4 mr-2" />
              Nova Pergunta
            </Button>
          </div>
        </div>

        <QuestionsList
          questions={questions}
          onEdit={handleEdit}
          onRefresh={loadQuestions}
        />
      </main>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingQuestion ? 'Editar Pergunta' : 'Nova Pergunta'}
            </DialogTitle>
          </DialogHeader>
          <QuestionForm
            initialData={formInitialData}
            onSubmit={handleSubmit}
            onCancel={() => {
              setIsDialogOpen(false);
              setEditingQuestion(null);
            }}
            isLoading={isSaving}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Admin;
