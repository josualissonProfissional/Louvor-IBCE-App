-- Script para modificar a tabela escalas para permitir escalas gerais (sem música)
-- Execute este script no SQL Editor do Supabase

-- 1. Remover a constraint NOT NULL de musica_id
ALTER TABLE escalas 
  ALTER COLUMN musica_id DROP NOT NULL;

-- 2. Remover a constraint UNIQUE antiga
ALTER TABLE escalas 
  DROP CONSTRAINT IF EXISTS escalas_data_musica_id_usuario_id_funcao_key;

-- 3. Criar nova constraint UNIQUE que considera NULL
-- Para escalas com música: único por (data, musica_id, usuario_id, funcao)
-- Para escalas gerais (sem música): único por (data, usuario_id, funcao) onde musica_id IS NULL
CREATE UNIQUE INDEX escalas_musica_unique 
  ON escalas(data, musica_id, usuario_id, funcao) 
  WHERE musica_id IS NOT NULL;

CREATE UNIQUE INDEX escalas_geral_unique 
  ON escalas(data, usuario_id, funcao) 
  WHERE musica_id IS NULL;

-- 4. Adicionar constraint CHECK para garantir que:
-- - Se tem música, a função pode ser 'solo', 'cantor' ou 'musico'
-- - Se não tem música (escala geral), a função deve ser 'cantor' ou 'musico' (não pode ser 'solo')
ALTER TABLE escalas 
  DROP CONSTRAINT IF EXISTS escalas_funcao_check;

ALTER TABLE escalas 
  ADD CONSTRAINT escalas_funcao_check 
  CHECK (
    (musica_id IS NOT NULL AND funcao IN ('cantor', 'musico', 'solo')) OR
    (musica_id IS NULL AND funcao IN ('cantor', 'musico'))
  );

-- 5. Verificar a estrutura
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'escalas'
ORDER BY ordinal_position;


