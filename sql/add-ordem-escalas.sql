-- Adiciona campo ordem na tabela escalas para permitir reordenar músicas
-- Execute este script no SQL Editor do Supabase

-- Adiciona coluna ordem (permite NULL para escalas antigas)
ALTER TABLE escalas 
ADD COLUMN IF NOT EXISTS ordem INTEGER;

-- Cria índice para melhor performance
CREATE INDEX IF NOT EXISTS idx_escalas_ordem ON escalas(data, ordem);

-- Atualiza escalas existentes: define ordem baseada na ordem de criação
-- Para escalas com música, ordena por created_at
-- Para escalas gerais (sem música), mantém ordem NULL
UPDATE escalas
SET ordem = subquery.row_num
FROM (
  SELECT 
    id,
    ROW_NUMBER() OVER (
      PARTITION BY data, musica_id 
      ORDER BY created_at ASC
    ) as row_num
  FROM escalas
  WHERE musica_id IS NOT NULL
) AS subquery
WHERE escalas.id = subquery.id AND escalas.musica_id IS NOT NULL;

-- Define valores padrão para novas escalas com música
-- A ordem será definida automaticamente na API ao criar a escala
