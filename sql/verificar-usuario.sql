-- Script para verificar se o usuário foi criado corretamente
-- Execute este script no SQL Editor do Supabase

-- 1. Verificar se o usuário existe na tabela auth.users
SELECT 
  id,
  email,
  created_at,
  confirmed_at
FROM auth.users
WHERE email = 'josualisson17@gmail.com';

-- 2. Verificar se o usuário existe na tabela usuarios
SELECT 
  id,
  email,
  cargo,
  lider,
  data_nascimento,
  created_at
FROM usuarios
WHERE email = 'josualisson17@gmail.com';

-- 3. Verificar se os IDs correspondem
SELECT 
  au.id as auth_user_id,
  au.email as auth_email,
  u.id as usuario_id,
  u.email as usuario_email,
  u.lider,
  CASE 
    WHEN au.id = u.id THEN '✅ IDs correspondem'
    ELSE '❌ IDs NÃO correspondem'
  END as status
FROM auth.users au
LEFT JOIN usuarios u ON au.id = u.id
WHERE au.email = 'josualisson17@gmail.com';

-- 4. Testar se as políticas RLS permitem a leitura
-- Execute este como o usuário autenticado (não como admin)
-- Isso simula o que acontece quando getCurrentUser() é chamado
SET request.jwt.claim.sub = '51206994-1fc7-4dec-a7af-135b064a7531';
SELECT * FROM usuarios WHERE id = '51206994-1fc7-4dec-a7af-135b064a7531';


