#!/bin/bash
set -e

APP_NAME="semana-academica"
DOCKER_COMPOSE="docker compose -f docker-compose.yml"

echo "🚀 Deploy da aplicação $APP_NAME iniciado..."

# 1. Puxar últimas alterações
echo "📥 Atualizando repositório Git..."
git pull origin main

# 2. Construir imagens
# echo "🐳 Construindo containers..."
# $DOCKER_COMPOSE build --no-cache

# 3. Subir containers
echo "📦 Subindo containers..."
# $DOCKER_COMPOSE up -d
$DOCKER_COMPOSE up -d --build

# 4. Limpar imagens antigas
# echo "🧹 Limpando imagens não usadas..."
# docker image prune -f

# 5. Checar logs da aplicação
echo "📜 Logs recentes do app:"
docker logs --tail=30 ${APP_NAME}

echo "✅ Deploy finalizado com sucesso!"
