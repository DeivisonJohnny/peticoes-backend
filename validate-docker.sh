#!/bin/bash

# Script de validação do Docker antes do deploy
# Este script valida se o Docker está configurado corretamente

set -e

echo "🔍 Validando configuração Docker..."

# Cores para output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Verificar se Docker está instalado
if ! command -v docker &> /dev/null; then
    echo -e "${RED}❌ Docker não está instalado${NC}"
    exit 1
fi
echo -e "${GREEN}✅ Docker instalado${NC}"

# Verificar se Docker Compose está instalado
if ! command -v docker-compose &> /dev/null && ! docker compose version &> /dev/null; then
    echo -e "${RED}❌ Docker Compose não está instalado${NC}"
    exit 1
fi
echo -e "${GREEN}✅ Docker Compose instalado${NC}"

# Verificar se arquivo .env existe
if [ ! -f .env ]; then
    echo -e "${YELLOW}⚠️  Arquivo .env não encontrado${NC}"
    echo -e "${YELLOW}   Criando .env a partir de env.example...${NC}"
    if [ -f env.example ]; then
        cp env.example .env
        echo -e "${YELLOW}   Por favor, edite o arquivo .env com suas configurações${NC}"
    else
        echo -e "${RED}❌ Arquivo env.example não encontrado${NC}"
        exit 1
    fi
else
    echo -e "${GREEN}✅ Arquivo .env encontrado${NC}"
fi

# Verificar se Dockerfile existe
if [ ! -f Dockerfile ]; then
    echo -e "${RED}❌ Dockerfile não encontrado${NC}"
    exit 1
fi
echo -e "${GREEN}✅ Dockerfile encontrado${NC}"

# Verificar se docker-compose.yml existe
if [ ! -f docker-compose.yml ]; then
    echo -e "${RED}❌ docker-compose.yml não encontrado${NC}"
    exit 1
fi
echo -e "${GREEN}✅ docker-compose.yml encontrado${NC}"

# Validar sintaxe do docker-compose.yml
echo "🔍 Validando sintaxe do docker-compose.yml..."
if docker-compose config > /dev/null 2>&1 || docker compose config > /dev/null 2>&1; then
    echo -e "${GREEN}✅ docker-compose.yml válido${NC}"
else
    echo -e "${RED}❌ Erro na sintaxe do docker-compose.yml${NC}"
    exit 1
fi

# Verificar se as portas estão disponíveis
echo "🔍 Verificando disponibilidade de portas..."
if lsof -Pi :3000 -sTCP:LISTEN -t >/dev/null 2>&1; then
    echo -e "${YELLOW}⚠️  Porta 3000 já está em uso${NC}"
else
    echo -e "${GREEN}✅ Porta 3000 disponível${NC}"
fi

if lsof -Pi :5434 -sTCP:LISTEN -t >/dev/null 2>&1; then
    echo -e "${YELLOW}⚠️  Porta 5434 já está em uso${NC}"
else
    echo -e "${GREEN}✅ Porta 5434 disponível${NC}"
fi

echo ""
echo -e "${GREEN}✅ Validação concluída!${NC}"
echo ""
echo "Próximos passos:"
echo "1. Edite o arquivo .env com suas configurações"
echo "2. Execute: docker-compose up -d --build"
echo "3. Execute as migrações: docker-compose exec api npx prisma migrate deploy"
echo "4. Verifique os logs: docker-compose logs -f api"

