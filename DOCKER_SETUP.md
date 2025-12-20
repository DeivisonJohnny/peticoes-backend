# Resumo da Configuração Docker

## Arquivos Criados/Modificados

### ✅ Dockerfile
- Base: `node:20-slim` (Debian slim)
- Chrome instalado com todas as dependências necessárias
- Otimizado para produção
- Suporta Puppeteer completamente

### ✅ docker-compose.yml
- Serviço PostgreSQL configurado
- Serviço API configurado
- Healthcheck para PostgreSQL
- Volumes para persistência (uploads, templates, banco de dados)
- Dependências entre serviços configuradas

### ✅ .dockerignore
- Otimiza o build excluindo arquivos desnecessários
- Reduz o tamanho do contexto de build

### ✅ env.example
- Template com todas as variáveis de ambiente necessárias
- Documentação das configurações

### ✅ DEPLOY.md
- Guia completo de deploy
- Instruções passo a passo
- Comandos úteis
- Troubleshooting

### ✅ validate-docker.sh
- Script de validação pré-deploy
- Verifica requisitos e configurações

## Estrutura de Deploy

```
VPS Hostinger
├── ~/worx-backend/
│   ├── .env (criar a partir de env.example)
│   ├── docker-compose.yml
│   ├── Dockerfile
│   ├── src/
│   ├── prisma/
│   ├── templates/
│   └── uploads/ (criado automaticamente)
```

## Variáveis de Ambiente Necessárias

```env
POSTGRES_USER=postgres
POSTGRES_PASSWORD=<senha_segura>
POSTGRES_DB=peticoes
DATABASE_URL=postgresql://postgres:<senha>@peticoes-postgres:5432/peticoes

PORT=3000
NODE_ENV=production

JWT_SECRET=<chave_secreta>
```

## Comandos Principais

### Validação Local
```bash
./validate-docker.sh
```

### Build e Deploy
```bash
docker-compose up -d --build
```

### Migrações
```bash
docker-compose exec api npx prisma migrate deploy
```

### Logs
```bash
docker-compose logs -f api
```

## Características Importantes

1. **Chrome/Puppeteer**: Totalmente configurado com todas as dependências
2. **Debian Slim**: Imagem leve mas completa
3. **Persistência**: Volumes para uploads, templates e banco de dados
4. **Healthcheck**: PostgreSQL verificado antes da API iniciar
5. **Produção**: Configurado para ambiente de produção

## Próximos Passos

1. ✅ Configuração Docker completa
2. ⏭️ Testar localmente com `./validate-docker.sh`
3. ⏭️ Fazer deploy na VPS seguindo `DEPLOY.md`
4. ⏭️ Configurar domínio e HTTPS (opcional)

