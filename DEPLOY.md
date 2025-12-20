# Guia de Deploy - API Worx

Este documento descreve o processo de deploy da API em uma VPS usando Docker. Compatível com qualquer provedor: Hostinger, Oracle Cloud, AWS, DigitalOcean, etc.

## Pré-requisitos

- VPS com acesso SSH (qualquer provedor: Hostinger, Oracle Cloud, AWS, DigitalOcean, etc.)
- Docker instalado na VPS
- Docker Compose instalado na VPS
- Domínio configurado (opcional, para produção)

### Compatibilidade de Arquitetura

✅ **AMD64/x86_64**: Totalmente suportado (Chrome oficial)  
✅ **ARM64**: Totalmente suportado (Chromium)  
✅ **ARM**: Totalmente suportado (Chromium)

O Dockerfile detecta automaticamente a arquitetura e instala o navegador apropriado.

## Estrutura Docker

### Dockerfile

O Dockerfile utiliza:
- **Base**: `node:20-slim` (Debian slim)
- **Navegador**: 
  - **AMD64/x86_64**: Google Chrome (oficial)
  - **ARM/ARM64**: Chromium (compatível)
  - Detecção automática da arquitetura
- **Dependências**: Todas as bibliotecas necessárias para o navegador funcionar corretamente
- **Multi-arquitetura**: Funciona em qualquer VPS (Hostinger, Oracle Cloud, AWS, DigitalOcean, etc.)

### Docker Compose

O `docker-compose.yml` inclui:
- **PostgreSQL**: Banco de dados (porta 5434)
- **API**: Aplicação NestJS (porta 3000)

## Passos para Deploy

### 1. Preparação na VPS

```bash
# Conectar via SSH
ssh usuario@seu-servidor.com

# Instalar Docker (se não estiver instalado)
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Instalar Docker Compose
sudo apt-get update
sudo apt-get install docker-compose-plugin

# Criar diretório do projeto
mkdir -p ~/worx-backend
cd ~/worx-backend
```

### 2. Transferir Código para a VPS

```bash
# Na sua máquina local, usar rsync ou scp
rsync -avz --exclude 'node_modules' --exclude '.git' \
  /caminho/local/backend/ usuario@seu-servidor.com:~/worx-backend/

# Ou usar git (recomendado)
git clone seu-repositorio.git ~/worx-backend
cd ~/worx-backend
```

### 3. Configurar Variáveis de Ambiente

```bash
# Na VPS, criar arquivo .env
cd ~/worx-backend
nano .env
```

Copie o conteúdo do `.env.example` e ajuste os valores:

```env
POSTGRES_USER=postgres
POSTGRES_PASSWORD=senha_segura_aqui
POSTGRES_DB=peticoes
DATABASE_URL=postgresql://postgres:senha_segura_aqui@peticoes-postgres:5432/peticoes

PORT=3000
NODE_ENV=production

JWT_SECRET=chave_jwt_super_secreta_aqui
```

**IMPORTANTE**: 
- Use uma senha forte para o PostgreSQL
- Use uma chave JWT segura e única (pode gerar com: `openssl rand -base64 32`)

### 4. Executar Migrações do Prisma

```bash
# Dentro do container ou localmente antes do build
# Opção 1: Executar migrações antes de subir os containers
docker-compose run --rm api npx prisma migrate deploy

# Opção 2: Executar após os containers estarem rodando
docker-compose exec api npx prisma migrate deploy
```

### 5. Iniciar os Containers

```bash
# Build e start dos containers
docker-compose up -d --build

# Verificar logs
docker-compose logs -f api

# Verificar status
docker-compose ps
```

### 6. Executar Seed (Opcional)

```bash
# Se precisar popular o banco com dados iniciais
docker-compose exec api npx prisma db seed
```

### 7. Configurar Nginx (Recomendado para Produção)

Se quiser usar um domínio e HTTPS:

```nginx
# /etc/nginx/sites-available/worx-api
server {
    listen 80;
    server_name api.seudominio.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

```bash
# Ativar configuração
sudo ln -s /etc/nginx/sites-available/worx-api /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx

# Configurar SSL com Let's Encrypt
sudo certbot --nginx -d api.seudominio.com
```

## Comandos Úteis

### Gerenciamento de Containers

```bash
# Parar containers
docker-compose down

# Parar e remover volumes (CUIDADO: apaga dados)
docker-compose down -v

# Reiniciar containers
docker-compose restart

# Ver logs
docker-compose logs -f api
docker-compose logs -f peticoes-postgres

# Entrar no container da API
docker-compose exec api sh

# Executar comandos no container
docker-compose exec api pnpm prisma studio
docker-compose exec api pnpm prisma migrate dev
```

### Backup do Banco de Dados

```bash
# Criar backup
docker-compose exec peticoes-postgres pg_dump -U postgres peticoes > backup_$(date +%Y%m%d_%H%M%S).sql

# Restaurar backup
docker-compose exec -T peticoes-postgres psql -U postgres peticoes < backup.sql
```

### Atualização da Aplicação

```bash
# 1. Fazer pull das mudanças
git pull origin main

# 2. Rebuild e restart
docker-compose up -d --build

# 3. Executar migrações (se houver)
docker-compose exec api npx prisma migrate deploy
```

## Monitoramento

### Verificar Saúde dos Containers

```bash
# Status dos containers
docker-compose ps

# Uso de recursos
docker stats

# Logs em tempo real
docker-compose logs -f
```

### Verificar Aplicação

```bash
# Testar endpoint de saúde (se existir)
curl http://localhost:3000

# Verificar Swagger
curl http://localhost:3000/api
```

## Troubleshooting

### Problemas com Chrome/Puppeteer

Se houver problemas com o Puppeteer, verifique:
- O Chrome está instalado: `docker-compose exec api google-chrome --version`
- As dependências estão corretas: verificar logs do container

### Problemas de Conexão com Banco

```bash
# Verificar se o PostgreSQL está rodando
docker-compose ps peticoes-postgres

# Testar conexão
docker-compose exec api npx prisma db pull

# Ver logs do PostgreSQL
docker-compose logs peticoes-postgres
```

### Problemas de Permissão

```bash
# Ajustar permissões do diretório uploads
sudo chown -R $USER:$USER ~/worx-backend/uploads
chmod -R 755 ~/worx-backend/uploads
```

## Segurança

1. **Nunca commite o arquivo `.env`**
2. **Use senhas fortes** para PostgreSQL e JWT_SECRET
3. **Configure firewall** na VPS:
   ```bash
   sudo ufw allow 22/tcp  # SSH
   sudo ufw allow 80/tcp  # HTTP
   sudo ufw allow 443/tcp # HTTPS
   sudo ufw enable
   ```
4. **Use HTTPS** em produção (Let's Encrypt)
5. **Mantenha o Docker atualizado**

## Estrutura de Diretórios na VPS

```
~/worx-backend/
├── .env
├── docker-compose.yml
├── Dockerfile
├── package.json
├── prisma/
├── src/
├── templates/
└── uploads/  # Criado automaticamente
```

## Notas Importantes

- O diretório `uploads` é mapeado como volume para persistir os PDFs gerados
- O diretório `templates` também é mapeado para manter os templates acessíveis
- O banco de dados persiste em um volume Docker (`peticoes_postgres_data`)
- A aplicação roda na porta 3000 por padrão (ajustável via `.env`)

