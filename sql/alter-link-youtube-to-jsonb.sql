-- Script para alterar o campo link_youtube para armazenar múltiplos links em formato JSONB
-- Isso substitui a necessidade da tabela links_youtube separada

-- 1. Adicionar uma nova coluna temporária do tipo JSONB
ALTER TABLE musicas ADD COLUMN IF NOT EXISTS link_youtube_new JSONB DEFAULT '[]'::jsonb;

-- 2. Migrar dados existentes do campo link_youtube (text) para o novo campo (JSONB)
-- Se houver um link antigo, converte para formato JSONB
-- Usa uma função auxiliar para tentar fazer parse de JSON de forma segura
DO $$
DECLARE
  musica_record RECORD;
  link_jsonb JSONB;
BEGIN
  FOR musica_record IN 
    SELECT id, link_youtube 
    FROM musicas 
    WHERE link_youtube IS NOT NULL 
      AND link_youtube != '' 
      AND link_youtube != 'null'
  LOOP
    BEGIN
      -- Tenta fazer parse como JSONB
      link_jsonb := musica_record.link_youtube::jsonb;
      
      -- Se chegou aqui, é JSON válido
      -- Verifica se já é um array
      IF jsonb_typeof(link_jsonb) = 'array' THEN
        UPDATE musicas 
        SET link_youtube_new = link_jsonb 
        WHERE id = musica_record.id;
      ELSE
        -- É um objeto JSON, converte para array
        UPDATE musicas 
        SET link_youtube_new = jsonb_build_array(link_jsonb)
        WHERE id = musica_record.id;
      END IF;
    EXCEPTION WHEN OTHERS THEN
      -- Se falhar o parse, é uma string simples (URL), converte para array JSONB
      UPDATE musicas 
      SET link_youtube_new = jsonb_build_array(
        jsonb_build_object(
          'url', musica_record.link_youtube,
          'titulo', NULL,
          'id', 'legacy-' || musica_record.id::text
        )
      )
      WHERE id = musica_record.id;
    END;
  END LOOP;
  
  -- Para músicas sem link_youtube ou com valores vazios, define como array vazio
  UPDATE musicas
  SET link_youtube_new = '[]'::jsonb
  WHERE link_youtube IS NULL 
     OR link_youtube = '' 
     OR link_youtube = 'null'
     OR link_youtube_new IS NULL;
END $$;

-- 3. Migrar dados da tabela links_youtube (se existir) para o novo campo
-- Combina os links antigos com os novos da tabela links_youtube
UPDATE musicas m
SET link_youtube_new = COALESCE(
  (
    SELECT jsonb_agg(
      jsonb_build_object(
        'url', ly.url,
        'titulo', ly.titulo,
        'id', ly.id::text
      )
      ORDER BY ly.created_at
    )
    FROM links_youtube ly
    WHERE ly.musica_id = m.id
  ),
  link_youtube_new
)
WHERE EXISTS (
  SELECT 1 FROM links_youtube ly WHERE ly.musica_id = m.id
);

-- 4. Para músicas que não têm link_youtube definido, garantir que seja um array vazio
UPDATE musicas
SET link_youtube_new = '[]'::jsonb
WHERE link_youtube_new IS NULL;

-- 5. Remover a coluna antiga
ALTER TABLE musicas DROP COLUMN IF EXISTS link_youtube;

-- 6. Renomear a nova coluna para o nome original
ALTER TABLE musicas RENAME COLUMN link_youtube_new TO link_youtube;

-- 7. Adicionar constraint para garantir que sempre seja um array
ALTER TABLE musicas ADD CONSTRAINT check_link_youtube_is_array 
  CHECK (jsonb_typeof(link_youtube) = 'array');

-- 8. Criar índice GIN para melhor performance em consultas JSONB
CREATE INDEX IF NOT EXISTS idx_musicas_link_youtube_gin ON musicas USING GIN (link_youtube);

-- 9. Comentário explicativo
COMMENT ON COLUMN musicas.link_youtube IS 'Array JSONB contendo objetos com url, titulo e id. Formato: [{"url": "...", "titulo": "...", "id": "..."}, ...]';
