-- Script para adicionar políticas RLS de INSERT para músicas, cifras e letras
-- Execute este script no SQL Editor do Supabase

-- 1. Verificar se a função is_user_admin existe (criada no fix-rls-policy.sql)
-- Se não existir, vamos criá-la
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

-- 2. Adicionar política de INSERT para músicas (apenas admins)
DROP POLICY IF EXISTS "Apenas admins podem inserir músicas" ON musicas;
CREATE POLICY "Apenas admins podem inserir músicas" ON musicas
  FOR INSERT 
  WITH CHECK (is_user_admin(auth.uid()));

-- 3. Adicionar política de UPDATE para músicas (apenas admins)
DROP POLICY IF EXISTS "Apenas admins podem atualizar músicas" ON musicas;
CREATE POLICY "Apenas admins podem atualizar músicas" ON musicas
  FOR UPDATE 
  USING (is_user_admin(auth.uid()));

-- 4. Adicionar política de DELETE para músicas (apenas admins)
DROP POLICY IF EXISTS "Apenas admins podem deletar músicas" ON musicas;
CREATE POLICY "Apenas admins podem deletar músicas" ON musicas
  FOR DELETE 
  USING (is_user_admin(auth.uid()));

-- 5. Adicionar política de INSERT para cifras (apenas admins)
DROP POLICY IF EXISTS "Apenas admins podem inserir cifras" ON cifras;
CREATE POLICY "Apenas admins podem inserir cifras" ON cifras
  FOR INSERT 
  WITH CHECK (is_user_admin(auth.uid()));

-- 6. Adicionar política de UPDATE para cifras (apenas admins)
DROP POLICY IF EXISTS "Apenas admins podem atualizar cifras" ON cifras;
CREATE POLICY "Apenas admins podem atualizar cifras" ON cifras
  FOR UPDATE 
  USING (is_user_admin(auth.uid()));

-- 7. Adicionar política de DELETE para cifras (apenas admins)
DROP POLICY IF EXISTS "Apenas admins podem deletar cifras" ON cifras;
CREATE POLICY "Apenas admins podem deletar cifras" ON cifras
  FOR DELETE 
  USING (is_user_admin(auth.uid()));

-- 8. Adicionar política de INSERT para letras (apenas admins)
DROP POLICY IF EXISTS "Apenas admins podem inserir letras" ON letras;
CREATE POLICY "Apenas admins podem inserir letras" ON letras
  FOR INSERT 
  WITH CHECK (is_user_admin(auth.uid()));

-- 9. Adicionar política de UPDATE para letras (apenas admins)
DROP POLICY IF EXISTS "Apenas admins podem atualizar letras" ON letras;
CREATE POLICY "Apenas admins podem atualizar letras" ON letras
  FOR UPDATE 
  USING (is_user_admin(auth.uid()));

-- 10. Adicionar política de DELETE para letras (apenas admins)
DROP POLICY IF EXISTS "Apenas admins podem deletar letras" ON letras;
CREATE POLICY "Apenas admins podem deletar letras" ON letras
  FOR DELETE 
  USING (is_user_admin(auth.uid()));

-- 11. Verificar se as políticas foram criadas
SELECT 
  tablename,
  policyname,
  cmd
FROM pg_policies
WHERE tablename IN ('musicas', 'cifras', 'letras')
ORDER BY tablename, cmd, policyname;

