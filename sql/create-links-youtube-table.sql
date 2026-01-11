-- Tabela para armazenar múltiplos links do YouTube por música
CREATE TABLE IF NOT EXISTS links_youtube (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  musica_id UUID NOT NULL REFERENCES musicas(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  titulo VARCHAR(255), -- Título opcional para identificar o link (ex: "Versão original", "Cover", etc.)
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índice para melhor performance
CREATE INDEX IF NOT EXISTS idx_links_youtube_musica_id ON links_youtube(musica_id);

-- Trigger para atualizar updated_at automaticamente
CREATE TRIGGER update_links_youtube_updated_at
  BEFORE UPDATE ON links_youtube
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- RLS Policies para links_youtube
ALTER TABLE links_youtube ENABLE ROW LEVEL SECURITY;

-- Policy: Todos podem ler links do YouTube
CREATE POLICY "Links do YouTube são públicos para leitura"
  ON links_youtube
  FOR SELECT
  USING (true);

-- Policy: Apenas admins podem inserir links
CREATE POLICY "Apenas admins podem inserir links do YouTube"
  ON links_youtube
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM usuarios
      WHERE usuarios.id = auth.uid()
      AND usuarios.lider = true
    )
  );

-- Policy: Apenas admins podem atualizar links
CREATE POLICY "Apenas admins podem atualizar links do YouTube"
  ON links_youtube
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM usuarios
      WHERE usuarios.id = auth.uid()
      AND usuarios.lider = true
    )
  );

-- Policy: Apenas admins podem deletar links
CREATE POLICY "Apenas admins podem deletar links do YouTube"
  ON links_youtube
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM usuarios
      WHERE usuarios.id = auth.uid()
      AND usuarios.lider = true
    )
  );
