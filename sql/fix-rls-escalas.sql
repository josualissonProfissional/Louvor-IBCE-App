-- Script para adicionar políticas RLS de INSERT, UPDATE e DELETE para escalas
-- Execute este script no SQL Editor do Supabase

-- 1. Verificar se a função is_user_admin existe
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

-- 2. Políticas para escalas
DROP POLICY IF EXISTS "Apenas admins podem inserir escalas" ON escalas;
CREATE POLICY "Apenas admins podem inserir escalas" ON escalas
  FOR INSERT 
  WITH CHECK (is_user_admin(auth.uid()));

DROP POLICY IF EXISTS "Apenas admins podem atualizar escalas" ON escalas;
CREATE POLICY "Apenas admins podem atualizar escalas" ON escalas
  FOR UPDATE 
  USING (is_user_admin(auth.uid()));

DROP POLICY IF EXISTS "Apenas admins podem deletar escalas" ON escalas;
CREATE POLICY "Apenas admins podem deletar escalas" ON escalas
  FOR DELETE 
  USING (is_user_admin(auth.uid()));

-- 3. Verificar políticas criadas
SELECT 
  tablename,
  policyname,
  cmd
FROM pg_policies
WHERE tablename = 'escalas'
ORDER BY cmd, policyname;

