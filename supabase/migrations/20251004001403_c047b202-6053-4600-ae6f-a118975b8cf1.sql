-- Fix the security warning by explicitly setting search_path in has_role function
DROP FUNCTION IF EXISTS public.has_role(_user_id UUID, _role app_role) CASCADE;

CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- Recreate the policies that were dropped
CREATE POLICY "Only admins can insert questions"
ON public.questions
FOR INSERT
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Only admins can update questions"
ON public.questions
FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Only admins can delete questions"
ON public.questions
FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));