# Sistema de Geração de Petições - Backend

![GitHub repo size](https://img.shields.io/github/repo-size/Worxbase/peticoes-backend)
![GitHub language count](https://img.shields.io/github/languages/count/Worxbase/peticoes-backend)
![GitHub top language](https://img.shields.io/github/languages/top/Worxbase/peticoes-backend)
![GitHub last commit](https://img.shields.io/github/last-commit/Worxbase/peticoes-backend)

Este repositório contém o código-fonte para o backend do sistema de gestão de documentos jurídicos. A aplicação é construída com uma arquitetura de Monolito Modular, seguindo os princípios de Clean Code e SOLID.

## 📚 Índice

- [🎯 Objetivo](#-objetivo)
- [✨ Features (MVP)](#-features-mvp)
- [🏗️ Arquitetura e Stack Tecnológica](#️-arquitetura-e-stack-tecnológica)
- [🚀 Rodando o Projeto Localmente](#-rodando-o-projeto-localmente)
  - [Pré-requisitos](#pré-requisitos)
  - [Instalação](#instalação)
- [🔧 Variáveis de Ambiente](#-variáveis-de-ambiente)
- [📖 Documentação da API](#-documentação-da-api)
- [🧪 Testes](#-testes)
- [📜 Scripts Disponíveis](#-scripts-disponíveis)
- [🤝 Contribuindo](#-contribuindo)
- [📄 Licença](#-licença)

## 🎯 Objetivo

Automatizar e otimizar o processo de geração de petições jurídicas, proporcionando:

- Padronização dos documentos
- Redução de erros humanos
- Aumento da produtividade
- Gestão centralizada de templates e dados
- Rastreabilidade das petições geradas

## ✨ Features (MVP)

- [x] **Módulo de Usuários:** CRUD completo com autenticação segura (Soft Delete implementado)
- [ ] **Módulo de Clientes:** CRUD completo dos clientes do escritório
- [ ] **Módulo de Templates:** Gerenciamento dos modelos de documentos
- [ ] **Funcionalidade Principal:** Geração de documentos em PDF a partir dos templates, preenchidos com dados de clientes e informações dinâmicas

## 🏗️ Arquitetura e Stack Tecnológica

- **Padrão Arquitetural:** Monolito Modular
- **Princípios:** Clean Code, SOLID
- **Framework:** [NestJS](https://nestjs.com/)
- **Linguagem:** [TypeScript](https://www.typescriptlang.org/)
- **ORM:** [Prisma](https://www.prisma.io/)
- **Banco de Dados:** [PostgreSQL](https://www.postgresql.org/)
- **Containerização:** [Docker](https://www.docker.com/)
- **Documentação da API:** [Swagger (OpenAPI)](https://swagger.io/)

## 🚀 Rodando o Projeto Localmente

### Pré-requisitos

- [Node.js](https://nodejs.org/) (versão LTS recomendada)
- [pnpm](https://pnpm.io/)
- [Docker](https://www.docker.com/products/docker-desktop/) e Docker Compose

### Instalação

1. **Clone o Repositório**

   ```bash
   git clone https://github.com/Worxbase/peticoes-backend.git
   cd peticoes-backend
   ```

2. **Instale as Dependências**

   ```bash
   pnpm install
   ```

3. **Configure o Ambiente**

   Crie uma cópia do arquivo de exemplo `.env.example` e renomeie para `.env`.

   ```bash
   cp .env.example .env
   ```

   Edite o arquivo `.env` com suas configurações locais. Veja a seção [Variáveis de Ambiente](#-variáveis-de-ambiente) para mais detalhes.

4. **Inicie o Banco de Dados**

   ```bash
   docker compose up -d
   ```

5. **Execute as Migrações**

   ```bash
   pnpm prisma migrate dev
   ```

6. **Inicie a Aplicação**
   ```bash
   pnpm run start:dev
   ```
   A API estará disponível em `http://localhost:3000`

## 🔧 Variáveis de Ambiente

O arquivo `.env` é usado para configurar a aplicação. As seguintes variáveis são necessárias:

- `DATABASE_URL`: A URL de conexão para o banco de dados PostgreSQL.
- `POSTGRES_USER`: O nome de usuário para o banco de dados.
- `POSTGRES_PASSWORD`: A senha para o banco de dados.
- `POSTGRES_DB`: O nome do banco de dados.

## 📖 Documentação da API

A documentação da API está disponível em formato Swagger UI e OpenAPI JSON.

- **Swagger UI:** `http://localhost:3000/api`
- **OpenAPI JSON:** `http://localhost:3000/api-json`

## 🧪 Testes

Execute os testes para garantir a qualidade do código.

```bash
# Testes unitários
pnpm test

# Testes e2e
pnpm test:e2e

# Cobertura de testes
pnpm test:cov
```

## 📜 Scripts Disponíveis

- `pnpm start`: Inicia a aplicação em modo produção.
- `pnpm start:dev`: Inicia a aplicação em modo desenvolvimento com hot-reload.
- `pnpm start:debug`: Inicia a aplicação em modo debug.
- `pnpm build`: Compila o código TypeScript para JavaScript.
- `pnpm lint`: Executa a verificação de lint no código.
- `pnpm format`: Formata o código usando Prettier.

## 🤝 Contribuindo

Contribuições são bem-vindas! Siga os passos abaixo para contribuir:

1. Faça um fork do projeto.
2. Crie uma nova branch (`git checkout -b feature/nova-feature`).
3. Faça commit de suas mudanças (`git commit -m 'Adiciona nova feature'`).
4. Faça push para a branch (`git push origin feature/nova-feature`).
5. Abra um Pull Request.

## 📄 Licença

Este projeto está sob a licença MIT. Veja o arquivo `LICENSE` para mais detalhes.