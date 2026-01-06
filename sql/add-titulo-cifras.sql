-- Script para adicionar campo de título na tabela de cifras
-- Execute este script no SQL Editor do Supabase

-- Adicionar coluna titulo na tabela cifras
ALTER TABLE cifras 
ADD COLUMN IF NOT EXISTS titulo VARCHAR(255);

-- Comentário na coluna
COMMENT ON COLUMN cifras.titulo IS 'Título opcional da cifra (ex: Cifra para Baixo, Cifra para Violão)';


