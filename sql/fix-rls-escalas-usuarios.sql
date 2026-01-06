-- Script para permitir que usuários autenticados vejam dados básicos de outros usuários nas escalas
-- Execute este script no SQL Editor do Supabase

-- IMPORTANTE: Este script adiciona uma política RLS que permite que usuários autenticados
-- vejam dados básicos (nome, email, instrumento) de outros usuários quando estão em escalas.
-- Isso é necessário para que a escala completa apareça na página home para todos os usuários.

-- Cria política que permite usuários autenticados verem dados básicos de outros usuários
-- quando estão relacionados a escalas (para exibir a escala completa)
CREATE POLICY "Usuários podem ver dados básicos em escalas" ON usuarios
  FOR SELECT USING (
    auth.uid() IS NOT NULL AND (
      -- Permite ver o próprio perfil (já coberto pela política existente)
      auth.uid() = id OR
      -- Permite ver dados básicos de outros usuários se estiverem em escalas
      -- Verifica escalas dos últimos 90 dias para garantir que escalas futuras também sejam visíveis
      EXISTS (
        SELECT 1 FROM escalas
        WHERE escalas.usuario_id = usuarios.id
        AND escalas.data >= CURRENT_DATE - INTERVAL '90 days'
      )
    )
  );

-- Comentário explicativo
COMMENT ON POLICY "Usuários podem ver dados básicos em escalas" ON usuarios IS 
'Permite que usuários autenticados vejam dados básicos (nome, email, instrumento) de outros usuários quando estão relacionados a escalas recentes ou futuras, permitindo visualizar a escala completa na página home.';

