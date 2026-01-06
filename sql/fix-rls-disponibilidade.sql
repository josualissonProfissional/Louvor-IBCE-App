-- Script para adicionar política RLS que permite admins verem todas as disponibilidades
-- Execute este script no SQL Editor do Supabase

-- 1. Verificar se a função is_user_admin existe (já deve existir de outros scripts)
CREATE OR REPLACE FUNCTION is_user_admin(user_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM usuarios
    WHERE id = user_id AND lider = true
  );
END;
$$;

-- 2. Adicionar política para admins verem todas as disponibilidades
DROP POLICY IF EXISTS "Admins podem ver todas as disponibilidades" ON disponibilidade;
CREATE POLICY "Admins podem ver todas as disponibilidades" ON disponibilidade
  FOR SELECT 
  USING (is_user_admin(auth.uid()));

-- 3. Verificar políticas criadas
SELECT 
  tablename,
  policyname,
  cmd
FROM pg_policies
WHERE tablename = 'disponibilidade'
ORDER BY cmd, policyname;


