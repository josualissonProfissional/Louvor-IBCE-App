-- Script para adicionar políticas RLS de INSERT, UPDATE e DELETE para tabelas administrativas
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

-- 2. Políticas para instrumentos
DROP POLICY IF EXISTS "Apenas admins podem inserir instrumentos" ON instrumentos;
CREATE POLICY "Apenas admins podem inserir instrumentos" ON instrumentos
  FOR INSERT 
  WITH CHECK (is_user_admin(auth.uid()));

DROP POLICY IF EXISTS "Apenas admins podem atualizar instrumentos" ON instrumentos;
CREATE POLICY "Apenas admins podem atualizar instrumentos" ON instrumentos
  FOR UPDATE 
  USING (is_user_admin(auth.uid()));

DROP POLICY IF EXISTS "Apenas admins podem deletar instrumentos" ON instrumentos;
CREATE POLICY "Apenas admins podem deletar instrumentos" ON instrumentos
  FOR DELETE 
  USING (is_user_admin(auth.uid()));

-- 3. Políticas para dias_atuacao
DROP POLICY IF EXISTS "Apenas admins podem inserir dias de atuação" ON dias_atuacao;
CREATE POLICY "Apenas admins podem inserir dias de atuação" ON dias_atuacao
  FOR INSERT 
  WITH CHECK (is_user_admin(auth.uid()));

DROP POLICY IF EXISTS "Apenas admins podem atualizar dias de atuação" ON dias_atuacao;
CREATE POLICY "Apenas admins podem atualizar dias de atuação" ON dias_atuacao
  FOR UPDATE 
  USING (is_user_admin(auth.uid()));

DROP POLICY IF EXISTS "Apenas admins podem deletar dias de atuação" ON dias_atuacao;
CREATE POLICY "Apenas admins podem deletar dias de atuação" ON dias_atuacao
  FOR DELETE 
  USING (is_user_admin(auth.uid()));

-- 4. Políticas para usuarios (INSERT, UPDATE, DELETE)
DROP POLICY IF EXISTS "Apenas admins podem inserir usuários" ON usuarios;
CREATE POLICY "Apenas admins podem inserir usuários" ON usuarios
  FOR INSERT 
  WITH CHECK (is_user_admin(auth.uid()));

DROP POLICY IF EXISTS "Apenas admins podem atualizar usuários" ON usuarios;
CREATE POLICY "Apenas admins podem atualizar usuários" ON usuarios
  FOR UPDATE 
  USING (is_user_admin(auth.uid()));

DROP POLICY IF EXISTS "Apenas admins podem deletar usuários" ON usuarios;
CREATE POLICY "Apenas admins podem deletar usuários" ON usuarios
  FOR DELETE 
  USING (is_user_admin(auth.uid()));

-- 5. Verificar políticas criadas
SELECT 
  tablename,
  policyname,
  cmd
FROM pg_policies
WHERE tablename IN ('instrumentos', 'dias_atuacao', 'usuarios')
ORDER BY tablename, cmd, policyname;


