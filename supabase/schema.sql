-- Schema do banco de dados para o Ministério de Louvor IBCE
-- Execute este script no SQL Editor do Supabase

-- Tabela de instrumentos
CREATE TABLE IF NOT EXISTS instrumentos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome VARCHAR(100) NOT NULL UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de usuários
CREATE TABLE IF NOT EXISTS usuarios (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email VARCHAR(255) NOT NULL UNIQUE,
  senha VARCHAR(255) NOT NULL, -- Em produção, considerar remover este campo
  data_nascimento DATE NOT NULL,
  cargo VARCHAR(20) NOT NULL CHECK (cargo IN ('cantor', 'musico', 'ambos')),
  lider BOOLEAN DEFAULT FALSE,
  instrumento_id UUID REFERENCES instrumentos(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de músicas
CREATE TABLE IF NOT EXISTS musicas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  titulo VARCHAR(255) NOT NULL,
  link_youtube TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de cifras
CREATE TABLE IF NOT EXISTS cifras (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  texto TEXT NOT NULL,
  musica_id UUID NOT NULL REFERENCES musicas(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de letras
CREATE TABLE IF NOT EXISTS letras (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  texto TEXT NOT NULL,
  musica_id UUID NOT NULL REFERENCES musicas(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de dias de atuação
CREATE TABLE IF NOT EXISTS dias_atuacao (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  data DATE NOT NULL UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de escalas
CREATE TABLE IF NOT EXISTS escalas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  data DATE NOT NULL,
  musica_id UUID NOT NULL REFERENCES musicas(id) ON DELETE CASCADE,
  usuario_id UUID NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  funcao VARCHAR(20) NOT NULL CHECK (funcao IN ('cantor', 'musico', 'solo')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(data, musica_id, usuario_id, funcao)
);

-- Tabela de disponibilidade
CREATE TABLE IF NOT EXISTS disponibilidade (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_id UUID NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  data DATE NOT NULL,
  status VARCHAR(20) NOT NULL CHECK (status IN ('disponivel', 'indisponivel')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(usuario_id, data)
);

-- Índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_usuarios_email ON usuarios(email);
CREATE INDEX IF NOT EXISTS idx_musicas_titulo ON musicas(titulo);
CREATE INDEX IF NOT EXISTS idx_cifras_musica_id ON cifras(musica_id);
CREATE INDEX IF NOT EXISTS idx_letras_musica_id ON letras(musica_id);
CREATE INDEX IF NOT EXISTS idx_escalas_data ON escalas(data);
CREATE INDEX IF NOT EXISTS idx_escalas_usuario_id ON escalas(usuario_id);
CREATE INDEX IF NOT EXISTS idx_disponibilidade_usuario_id ON disponibilidade(usuario_id);
CREATE INDEX IF NOT EXISTS idx_disponibilidade_data ON disponibilidade(data);
CREATE INDEX IF NOT EXISTS idx_dias_atuacao_data ON dias_atuacao(data);

-- Função para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers para atualizar updated_at
CREATE TRIGGER update_usuarios_updated_at BEFORE UPDATE ON usuarios
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_musicas_updated_at BEFORE UPDATE ON musicas
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_cifras_updated_at BEFORE UPDATE ON cifras
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_letras_updated_at BEFORE UPDATE ON letras
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_escalas_updated_at BEFORE UPDATE ON escalas
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_disponibilidade_updated_at BEFORE UPDATE ON disponibilidade
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Políticas RLS (Row Level Security)
-- Habilitar RLS em todas as tabelas
ALTER TABLE instrumentos ENABLE ROW LEVEL SECURITY;
ALTER TABLE usuarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE musicas ENABLE ROW LEVEL SECURITY;
ALTER TABLE cifras ENABLE ROW LEVEL SECURITY;
ALTER TABLE letras ENABLE ROW LEVEL SECURITY;
ALTER TABLE dias_atuacao ENABLE ROW LEVEL SECURITY;
ALTER TABLE escalas ENABLE ROW LEVEL SECURITY;
ALTER TABLE disponibilidade ENABLE ROW LEVEL SECURITY;

-- Políticas para instrumentos (todos podem ler, apenas admin pode escrever)
CREATE POLICY "Instrumentos são públicos para leitura" ON instrumentos
  FOR SELECT USING (true);

CREATE POLICY "Apenas admins podem inserir instrumentos" ON instrumentos
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM usuarios
      WHERE usuarios.id = auth.uid() AND usuarios.lider = true
    )
  );

-- Políticas para usuários (apenas admin pode ver todos, usuário pode ver seu próprio perfil)
CREATE POLICY "Usuários podem ver seu próprio perfil" ON usuarios
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Admins podem ver todos os usuários" ON usuarios
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM usuarios
      WHERE usuarios.id = auth.uid() AND usuarios.lider = true
    )
  );

-- Políticas para músicas (todos autenticados podem ler)
CREATE POLICY "Músicas são públicas para usuários autenticados" ON musicas
  FOR SELECT USING (auth.uid() IS NOT NULL);

-- Políticas para cifras e letras (públicas para leitura)
CREATE POLICY "Cifras são públicas" ON cifras
  FOR SELECT USING (true);

CREATE POLICY "Letras são públicas" ON letras
  FOR SELECT USING (true);

-- Políticas para dias de atuação (todos podem ler)
CREATE POLICY "Dias de atuação são públicos" ON dias_atuacao
  FOR SELECT USING (true);

-- Políticas para escalas (todos autenticados podem ler)
CREATE POLICY "Escalas são públicas para usuários autenticados" ON escalas
  FOR SELECT USING (auth.uid() IS NOT NULL);

-- Políticas para disponibilidade (usuário pode ver e editar apenas a sua)
CREATE POLICY "Usuários podem ver sua própria disponibilidade" ON disponibilidade
  FOR SELECT USING (auth.uid() = usuario_id);

CREATE POLICY "Usuários podem inserir sua própria disponibilidade" ON disponibilidade
  FOR INSERT WITH CHECK (auth.uid() = usuario_id);

CREATE POLICY "Usuários podem atualizar sua própria disponibilidade" ON disponibilidade
  FOR UPDATE USING (auth.uid() = usuario_id);

-- Nota: As políticas de escrita (INSERT, UPDATE, DELETE) para tabelas administrativas
-- devem ser implementadas via API routes que verifica permissões de admin






