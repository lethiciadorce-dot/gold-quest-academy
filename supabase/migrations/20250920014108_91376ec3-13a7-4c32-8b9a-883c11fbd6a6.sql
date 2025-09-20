-- Create table for quiz scores
CREATE TABLE public.quiz_scores (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  player_name TEXT NOT NULL,
  score INTEGER NOT NULL,
  completed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.quiz_scores ENABLE ROW LEVEL SECURITY;

-- Create policies for public access (since no authentication required)
CREATE POLICY "Anyone can view quiz scores" 
ON public.quiz_scores 
FOR SELECT 
USING (true);

CREATE POLICY "Anyone can insert quiz scores" 
ON public.quiz_scores 
FOR INSERT 
WITH CHECK (true);

-- Enable realtime for live updates
ALTER TABLE public.quiz_scores REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.quiz_scores;