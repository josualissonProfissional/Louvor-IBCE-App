# Script para rodar a aplicação Louvor IBCE

Write-Host "=== Configurando e rodando aplicação Louvor IBCE ===" -ForegroundColor Cyan

# 1. Verificar/criar .env.local
Write-Host "`n[1/4] Verificando arquivo .env.local..." -ForegroundColor Yellow
if (-not (Test-Path .env.local)) {
    if (Test-Path .env) {
        Copy-Item .env .env.local
        Write-Host "✓ Arquivo .env.local criado a partir do .env" -ForegroundColor Green
    } else {
        Write-Host "✗ ERRO: Arquivo .env não encontrado!" -ForegroundColor Red
        Write-Host "   Crie um arquivo .env.local com as variáveis do env.example" -ForegroundColor Red
        exit 1
    }
} else {
    Write-Host "✓ Arquivo .env.local já existe" -ForegroundColor Green
}

# 2. Verificar dependências
Write-Host "`n[2/4] Verificando dependências..." -ForegroundColor Yellow
if (-not (Test-Path node_modules)) {
    Write-Host "Instalando dependências (isso pode levar alguns minutos)..." -ForegroundColor Yellow
    npm install
    if ($LASTEXITCODE -ne 0) {
        Write-Host "✗ ERRO ao instalar dependências!" -ForegroundColor Red
        exit 1
    }
    Write-Host "✓ Dependências instaladas" -ForegroundColor Green
} else {
    Write-Host "✓ Dependências já instaladas" -ForegroundColor Green
}

# 3. Verificar schema do banco
Write-Host "`n[3/4] Verificando banco de dados..." -ForegroundColor Yellow
Write-Host "⚠ IMPORTANTE: Certifique-se de que executou o schema.sql no Supabase!" -ForegroundColor Yellow
Write-Host "   Arquivo: supabase/schema.sql" -ForegroundColor Gray
Write-Host "   Execute no SQL Editor do seu projeto Supabase" -ForegroundColor Gray

# 4. Rodar aplicação
Write-Host "`n[4/4] Iniciando servidor de desenvolvimento..." -ForegroundColor Yellow
Write-Host "`n✓ Aplicação rodando em http://localhost:3000" -ForegroundColor Green
Write-Host "`nPressione Ctrl+C para parar o servidor`n" -ForegroundColor Cyan

npm run dev





