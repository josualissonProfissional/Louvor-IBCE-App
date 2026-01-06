-- Script para adicionar coluna "nome" na tabela usuarios
-- Execute este script no SQL Editor do Supabase

-- Adicionar coluna nome
ALTER TABLE usuarios 
ADD COLUMN IF NOT EXISTS nome VARCHAR(255);

-- Comentário na coluna
COMMENT ON COLUMN usuarios.nome IS 'Nome completo do usuário';

-- Verificar se a coluna foi adicionada
SELECT 
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_name = 'usuarios' AND column_name = 'nome';


