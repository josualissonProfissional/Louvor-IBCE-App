-- Script para corrigir as políticas RLS que estão causando erro 500
-- Execute este script no SQL Editor do Supabase

-- 1. Primeiro, vamos remover as políticas antigas que podem estar causando problemas
DROP POLICY IF EXISTS "Usuários podem ver seu próprio perfil" ON usuarios;
DROP POLICY IF EXISTS "Admins podem ver todos os usuários" ON usuarios;

-- 2. Criar uma função auxiliar para verificar se o usuário é admin
-- Esta função usa SECURITY DEFINER para contornar RLS temporariamente
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

-- 3. Recriar as políticas corrigidas
-- Política para usuários verem seu próprio perfil
CREATE POLICY "Usuários podem ver seu próprio perfil" ON usuarios
  FOR SELECT 
  USING (auth.uid() = id);

-- Política para admins verem todos os usuários (usando a função auxiliar)
CREATE POLICY "Admins podem ver todos os usuários" ON usuarios
  FOR SELECT 
  USING (is_user_admin(auth.uid()));

-- 4. Verificar se as políticas foram criadas corretamente
SELECT 
  schemaname,
  tablename,
  policyname,
  cmd,
  qual
FROM pg_policies
WHERE tablename = 'usuarios'
ORDER BY policyname;

