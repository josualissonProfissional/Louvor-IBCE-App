-- Script para criar o primeiro administrador
-- Execute este script no SQL Editor do Supabase APÓS criar o usuário no Authentication

-- IMPORTANTE: Antes de executar este script:
-- 1. Acesse Authentication > Users no painel do Supabase
-- 2. Clique em "Add User" e crie um usuário com email e senha
-- 3. Copie o ID do usuário criado (UUID)
-- 4. Substitua os valores abaixo pelos seus dados

-- Substitua estes valores:
-- 'ID_DO_USUARIO_AQUI' - Cole o ID do usuário criado no Authentication
-- 'seu-email@exemplo.com' - O email do usuário
-- 'senha_usada_no_auth' - A senha usada (apenas para referência, não é usada para login)
-- '1990-01-01' - Data de nascimento (formato: YYYY-MM-DD)
-- 'ambos' - Cargo: 'cantor', 'musico' ou 'ambos'

INSERT INTO usuarios (
  id,
  email,
  senha,
  data_nascimento,
  cargo,
  lider
) VALUES (
  'ID_DO_USUARIO_AQUI',           -- Substitua pelo ID do usuário do Authentication
  'josualisson17@gmail.com',         -- Substitua pelo email
  '96197466eE@',           -- Substitua pela senha (apenas referência)
  '2026-01-01',                    -- Substitua pela data de nascimento
  'ambos',                         -- 'cantor', 'musico' ou 'ambos'
  true                             -- true = administrador/líder
);

-- Após executar, você poderá fazer login com o email e senha criados no Authentication

