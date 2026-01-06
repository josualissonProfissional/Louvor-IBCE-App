# 🎵 Sistema de Organização do Ministério de Louvor IBCE

Sistema web completo para gerenciamento e organização do grupo de louvor da Igreja Batista Central de Eunápolis (IBCE). Desenvolvido para facilitar a administração de escalas, músicas, cifras, letras, disponibilidade dos membros e muito mais.

## 📋 Índice

- [Sobre o Projeto](#sobre-o-projeto)
- [Tecnologias Utilizadas](#tecnologias-utilizadas)
- [Funcionalidades](#funcionalidades)
- [Estrutura do Projeto](#estrutura-do-projeto)
- [Instalação e Configuração](#instalação-e-configuração)
- [Estrutura do Banco de Dados](#estrutura-do-banco-de-dados)
- [Scripts SQL](#scripts-sql)
- [Como Usar](#como-usar)

## 🎯 Sobre o Projeto

Este sistema foi desenvolvido para centralizar e organizar todas as atividades do ministério de louvor, permitindo:

- **Gerenciamento de Escalas**: Criação e visualização de escalas de atuação com músicas, solos, cantores e músicos
- **Biblioteca de Músicas**: Armazenamento de músicas com letras, cifras e links do YouTube
- **Controles de Acessibilidade**: Personalização de visualização de letras e cifras (tamanho da fonte, cor, fonte, negrito)
- **Transposição de Cifras**: Sistema inteligente de transposição de acordes mantendo apenas os acordes coloridos
- **Gerenciamento de Usuários**: Cadastro e administração de membros do ministério
- **Disponibilidade**: Sistema para membros informarem sua disponibilidade para atuação
- **Aniversariantes**: Visualização de aniversariantes do mês no dashboard
- **Calendário Interativo**: Visualização mensal de escalas e dias de atuação

## 🛠️ Tecnologias Utilizadas

### Frontend
- **Next.js 14** - Framework React com App Router
- **React 18** - Biblioteca JavaScript para interfaces
- **TypeScript** - Tipagem estática
- **Tailwind CSS** - Framework CSS utilitário
- **date-fns** - Manipulação de datas

### Backend
- **Next.js API Routes** - API REST integrada
- **Supabase** - Backend as a Service (BaaS)
  - PostgreSQL - Banco de dados
  - Supabase Auth - Autenticação
  - Row Level Security (RLS) - Segurança de dados

### Outras Bibliotecas
- **react-calendar** - Componente de calendário
- **zod** - Validação de schemas
- **clsx** e **tailwind-merge** - Utilitários CSS

## ✨ Funcionalidades

### 🎤 Gestão de Músicas
- Cadastro de músicas com múltiplas versões de letras e cifras
- Títulos personalizados para cada cifra (ex: "Cifra para Baixo", "Cifra para Violão")
- Links do YouTube integrados
- Visualização em modais com controles de acessibilidade
- Busca e filtros avançados

### 📅 Escalas de Atuação
- Criação de escalas por data de atuação
- Escalas com músicas específicas (com solos)
- Escalas gerais (cantores e músicos sem música específica)
- Visualização em calendário mensal
- Dashboard com próxima escala

### 🎸 Visualização de Cifras
- Transposição de acordes por semitons (+/-)
- Preferência por sustenidos (G# em vez de Ab)
- Coloração apenas dos acordes (não das letras)
- Controles de acessibilidade:
  - Tamanho da fonte (12px - 32px)
  - Cor da cifra (padrão: laranja)
  - Família de fonte (15 opções)
  - Texto em negrito
- Accordion responsivo para mobile

### 📝 Visualização de Letras
- Múltiplas versões por música
- Controles de acessibilidade:
  - Tamanho da fonte (12px - 32px)
  - Cor do texto (7 opções)
  - Família de fonte (15 opções)
  - Texto em negrito
- Accordion responsivo para mobile

### 👥 Gerenciamento de Usuários
- Cadastro completo de membros
- Atribuição de instrumentos
- Definição de cargo (cantor, músico, ambos)
- Sistema de permissões (líder/admin)
- Busca e filtros avançados

### 📊 Dashboard
- Próxima escala automaticamente destacada
- Calendário mensal interativo
- Aniversariantes do mês
- Visualização completa de escalas
- Acesso rápido a músicas da escala

### 🎂 Aniversariantes
- Lista de aniversariantes do mês
- Indicadores no calendário
- Informações de instrumento

### 📅 Disponibilidade
- Sistema de calendário para informar disponibilidade
- Visualização para líderes de todas as disponibilidades
- Integração com criação de escalas

## 📁 Estrutura do Projeto

```
Louvor-IBCE/
├── app/                    # Aplicação Next.js (App Router)
│   ├── admin/              # Páginas administrativas
│   │   ├── usuarios/       # Gerenciamento de usuários
│   │   ├── instrumentos/   # Gerenciamento de instrumentos
│   │   ├── dias-atuacao/   # Gerenciamento de dias de atuação
│   │   └── disponibilidade/# Visualização de disponibilidades
│   ├── api/                # API Routes
│   │   ├── musicas/        # Endpoints de músicas
│   │   ├── escalas/        # Endpoints de escalas
│   │   ├── usuarios/       # Endpoints de usuários
│   │   └── ...            # Outros endpoints
│   ├── escalas/            # Páginas de escalas
│   ├── musicas/            # Páginas de músicas
│   ├── disponibilidade/    # Página de disponibilidade
│   ├── login/              # Página de login
│   └── page.tsx            # Dashboard (página inicial)
├── components/             # Componentes React reutilizáveis
│   ├── Header.tsx          # Cabeçalho com navegação
│   ├── MusicaList.tsx      # Lista de músicas
│   ├── EscalaCalendar.tsx  # Calendário de escalas
│   ├── LetraViewerInline.tsx # Visualizador de letras inline
│   ├── CifraViewerInline.tsx # Visualizador de cifras inline
│   └── ...                # Outros componentes
├── lib/                     # Bibliotecas e utilitários
│   ├── auth.ts             # Funções de autenticação
│   ├── cifra-transposer.ts # Lógica de transposição de acordes
│   ├── utils.ts            # Funções utilitárias
│   └── supabase/           # Clientes Supabase
│       ├── client.ts       # Cliente para client-side
│       ├── server.ts       # Cliente para server-side
│       └── admin.ts        # Cliente admin (service role)
├── types/                   # Definições TypeScript
│   ├── index.ts            # Tipos principais
│   └── database.ts         # Tipos do banco de dados
├── sql/                     # Scripts SQL de migração e correção
│   ├── criar-admin.sql     # Script para criar primeiro admin
│   ├── fix-rls-*.sql       # Scripts de correção de políticas RLS
│   └── ...                 # Outros scripts SQL
├── supabase/                # Schema do banco de dados
│   └── schema.sql           # Schema principal
└── ...                     # Arquivos de configuração
```

## 🚀 Instalação e Configuração

### Pré-requisitos

- Node.js 18+ instalado
- Conta no Supabase (gratuita)
- Git (opcional)

### Passo a Passo

1. **Clone o repositório** (ou baixe os arquivos)
   ```bash
   git clone <url-do-repositorio>
   cd Louvor-IBCE
   ```

2. **Instale as dependências**
   ```bash
   npm install
   ```

3. **Configure as variáveis de ambiente**
   
   Crie um arquivo `.env.local` na raiz do projeto com base no `env.example`:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=sua_url_do_supabase
   NEXT_PUBLIC_SUPABASE_ANON_KEY=sua_chave_anonima
   SUPABASE_SERVICE_ROLE_KEY=sua_chave_service_role
   ```
   
   Você encontra essas chaves em: Supabase Dashboard → Settings → API

4. **Configure o banco de dados**
   
   - Acesse o SQL Editor no Supabase Dashboard
   - Execute o arquivo `supabase/schema.sql` para criar todas as tabelas
   - Execute os scripts em `sql/` conforme necessário (veja seção [Scripts SQL](#scripts-sql))

5. **Crie o primeiro administrador**
   
   - Execute o script `sql/criar-admin.sql` seguindo as instruções no arquivo
   - Ou use o script `sql/verificar-usuario.sql` para verificar se foi criado corretamente

6. **Inicie o servidor de desenvolvimento**
   ```bash
   npm run dev
   ```

7. **Acesse a aplicação**
   
   Abra [http://localhost:3000](http://localhost:3000) no navegador

## 🗄️ Estrutura do Banco de Dados

### Tabelas Principais

- **usuarios**: Membros do ministério (vinculado ao Supabase Auth)
- **instrumentos**: Instrumentos musicais disponíveis
- **musicas**: Músicas do repertório
- **cifras**: Cifras das músicas (múltiplas versões por música)
- **letras**: Letras das músicas (múltiplas versões por música)
- **dias_atuacao**: Dias em que há atuação do ministério
- **escalas**: Escalas de atuação (músicas, solos, cantores, músicos)
- **disponibilidade**: Disponibilidade dos membros para atuação

### Relacionamentos

- `usuarios` → `instrumentos` (muitos para um)
- `musicas` → `cifras` (um para muitos)
- `musicas` → `letras` (um para muitos)
- `escalas` → `musicas` (muitos para um, opcional)
- `escalas` → `usuarios` (muitos para um)
- `disponibilidade` → `usuarios` (muitos para um)
- `disponibilidade` → `dias_atuacao` (muitos para um)

### Segurança (RLS)

O projeto utiliza Row Level Security (RLS) do Supabase para garantir que:
- Usuários só vejam seus próprios dados (exceto quando necessário para escalas)
- Apenas administradores possam criar/editar/deletar dados administrativos
- Todos os usuários autenticados possam ver escalas e músicas

## 📜 Scripts SQL

Todos os scripts SQL estão organizados na pasta `sql/`:

### Scripts de Configuração Inicial
- **`criar-admin.sql`**: Cria o primeiro usuário administrador
- **`verificar-usuario.sql`**: Verifica se um usuário foi criado corretamente

### Scripts de Migração
- **`add-nome-usuario.sql`**: Adiciona coluna `nome` na tabela `usuarios`
- **`add-titulo-cifras.sql`**: Adiciona coluna `titulo` na tabela `cifras`
- **`alter-escalas-schema.sql`**: Modifica tabela `escalas` para permitir escalas gerais

### Scripts de Correção RLS
- **`fix-rls-policy.sql`**: Corrige políticas RLS básicas
- **`fix-rls-admin-tables.sql`**: Adiciona políticas para tabelas administrativas
- **`fix-rls-escalas.sql`**: Adiciona políticas para escalas
- **`fix-rls-musicas.sql`**: Adiciona políticas para músicas, cifras e letras
- **`fix-rls-disponibilidade.sql`**: Adiciona políticas para disponibilidade
- **`fix-rls-escalas-usuarios.sql`**: Permite ver dados básicos de usuários em escalas

## 📖 Como Usar

### Para Administradores/Líderes

1. **Gerenciar Usuários**
   - Acesse `/admin/usuarios`
   - Adicione novos membros
   - Atribua instrumentos e permissões

2. **Cadastrar Músicas**
   - Acesse `/musicas/nova`
   - Adicione título, link do YouTube
   - Faça upload ou cole letras e cifras
   - Adicione títulos para cada cifra (opcional)

3. **Criar Escalas**
   - Acesse `/escalas/nova`
   - Selecione a data de atuação
   - Adicione músicas com solos
   - Adicione cantores e músicos na escala geral

4. **Gerenciar Dias de Atuação**
   - Acesse `/admin/dias-atuacao`
   - Adicione os dias em que haverá atuação

### Para Membros

1. **Visualizar Escalas**
   - Acesse a página inicial (dashboard)
   - Veja a próxima escala automaticamente
   - Navegue pelo calendário para ver outras escalas

2. **Consultar Músicas**
   - Acesse `/musicas`
   - Use a busca para encontrar músicas
   - Clique em uma música para ver letras, cifras ou ouvir no YouTube

3. **Informar Disponibilidade**
   - Acesse `/disponibilidade`
   - Marque os dias em que está disponível

4. **Personalizar Visualização**
   - Ao visualizar letras ou cifras, use os controles de acessibilidade
   - Ajuste tamanho, cor, fonte e estilo conforme necessário
   - Para cifras, use os botões +/- para transpor

## 🎨 Recursos de Acessibilidade

O sistema foi desenvolvido com foco em acessibilidade:

- **Controles de Fonte**: Tamanho ajustável de 12px a 32px
- **Cores Personalizáveis**: 7 opções de cores para texto/cifras
- **Famílias de Fonte**: 15 opções incluindo fontes do Google
- **Modo Escuro**: Suporte completo a tema claro/escuro
- **Responsividade**: Interface adaptada para mobile, tablet e desktop
- **Accordion Mobile**: Controles colapsáveis em dispositivos móveis

## 🔐 Segurança

- Autenticação via Supabase Auth
- Row Level Security (RLS) em todas as tabelas
- Separação de permissões (usuário comum vs. administrador)
- Validação de dados no frontend e backend
- Proteção contra SQL Injection (via Supabase)

## 📝 Notas Importantes

- O campo `senha` na tabela `usuarios` é apenas para referência. O login real é feito via Supabase Auth
- As políticas RLS são essenciais para o funcionamento correto do sistema
- Execute os scripts SQL na ordem correta (verifique dependências nos comentários)
- O sistema suporta múltiplas versões de letras e cifras por música

## 🤝 Contribuindo

Este é um projeto interno do Ministério de Louvor IBCE. Para sugestões ou melhorias, entre em contato com os desenvolvedores.

## 📄 Licença

Este projeto é de uso interno do Ministério de Louvor IBCE.

---

**Desenvolvido com ❤️ para o Ministério de Louvor IBCE**


