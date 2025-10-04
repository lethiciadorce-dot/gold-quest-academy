-- Create enum for user roles
CREATE TYPE public.app_role AS ENUM ('admin', 'player');

-- Create questions table
CREATE TABLE public.questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  question TEXT NOT NULL,
  options JSONB NOT NULL,
  correct_index INTEGER NOT NULL CHECK (correct_index >= 0 AND correct_index <= 3),
  category TEXT NOT NULL,
  difficulty INTEGER NOT NULL CHECK (difficulty >= 1 AND difficulty <= 5),
  souls INTEGER NOT NULL DEFAULT 100,
  order_position INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS on questions
ALTER TABLE public.questions ENABLE ROW LEVEL SECURITY;

-- Create user_roles table
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  role app_role NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(user_id, role)
);

-- Enable RLS on user_roles
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Create security definer function to check roles
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- RLS Policies for questions table
-- Anyone can view questions
CREATE POLICY "Anyone can view questions"
ON public.questions
FOR SELECT
USING (true);

-- Only admins can insert questions
CREATE POLICY "Only admins can insert questions"
ON public.questions
FOR INSERT
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Only admins can update questions
CREATE POLICY "Only admins can update questions"
ON public.questions
FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Only admins can delete questions
CREATE POLICY "Only admins can delete questions"
ON public.questions
FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for user_roles table
-- Users can only view their own roles
CREATE POLICY "Users can view their own roles"
ON public.user_roles
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Trigger to update updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_questions_updated_at
BEFORE UPDATE ON public.questions
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Enable realtime for questions
ALTER TABLE public.questions REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.questions;

-- Migrate existing questions from the hardcoded array
INSERT INTO public.questions (question, options, correct_index, category, difficulty, souls, order_position) VALUES
('O que é inflação?', '["Aumento de preços", "Diminuição de preços", "Estabilidade de preços", "Queda do dólar"]', 0, 'money', 1, 100, 1),
('Qual a importância da reserva de emergência?', '["Comprar luxos", "Cobrir imprevistos", "Investir em ações", "Pagar dívidas"]', 1, 'money', 2, 150, 2),
('O que são juros compostos?', '["Juros simples", "Juros sobre juros", "Taxa fixa", "Desconto"]', 1, 'income', 2, 150, 3),
('Qual a diferença entre renda ativa e passiva?', '["Trabalho vs investimento", "Salário vs pensão", "Fixo vs variável", "Mensal vs anual"]', 0, 'income', 3, 200, 4),
('O que é diversificação de investimentos?', '["Investir tudo em um lugar", "Espalhar investimentos", "Guardar dinheiro", "Gastar menos"]', 1, 'income', 3, 200, 5),
('Como calcular seu patrimônio líquido?', '["Bens - Dívidas", "Renda - Gastos", "Salário - Contas", "Ativos + Passivos"]', 0, 'expenses', 2, 150, 6),
('O que é a regra 50-30-20?', '["Distribuição de gastos", "Taxa de juros", "Limite de crédito", "Meta de poupança"]', 0, 'expenses', 3, 200, 7),
('Qual a importância de um planejamento financeiro?', '["Gastar menos", "Organizar finanças", "Evitar impostos", "Aumentar salário"]', 1, 'expenses', 2, 150, 8),
('O que são despesas fixas?', '["Gastos mensais regulares", "Compras ocasionais", "Luxos", "Investimentos"]', 0, 'expenses', 1, 100, 9),
('Como criar um orçamento pessoal?', '["Listar receitas e despesas", "Ganhar mais", "Gastar menos", "Investir tudo"]', 0, 'expenses', 2, 150, 10);