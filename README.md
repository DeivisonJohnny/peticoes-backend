# Sistema de Petições - API Backend

API REST desenvolvida em NestJS para gerenciar clientes, templates de documentos e geração automática de petições jurídicas.

## 📋 Índice

- [Visão Geral](#-visão-geral)
- [Tecnologias](#-tecnologias)
- [Começando](#-começando)
- [Estrutura da API](#-estrutura-da-api)
- [Autenticação](#-autenticação)
- [Endpoints Principais](#-endpoints-principais)
- [Modelos de Dados](#-modelos-de-dados)
- [Tratamento de Erros](#-tratamento-de-erros)
- [Variáveis de Ambiente](#-variáveis-de-ambiente)

---

## 🎯 Visão Geral

Esta API permite:
- **Autenticação** de usuários (advogados e administradores)
- **Gerenciamento de clientes** (cadastro, edição, consulta)
- **Templates de documentos** (modelos de petições)
- **Geração de documentos** em PDF baseados em templates Handlebars
- **Histórico de documentos** gerados por cliente

### URL Base

```
http://localhost:3000
```

### Documentação Interativa (Swagger)

Acesse a documentação completa e teste os endpoints em:

```
http://localhost:3000/api
```

---

## 🛠 Tecnologias

- **NestJS** - Framework Node.js
- **Prisma ORM** - Gerenciamento de banco de dados
- **PostgreSQL** - Banco de dados
- **JWT** - Autenticação
- **Swagger** - Documentação da API
- **Puppeteer** - Geração de PDFs
- **Handlebars** - Templates de documentos

---

## 🚀 Começando

### Pré-requisitos

- Node.js 18+
- pnpm
- Docker e Docker Compose

### Instalação

1. **Clone o repositório**

```bash
git clone <repo-url>
cd backend
```

2. **Instale as dependências**

```bash
pnpm install
```

3. **Configure as variáveis de ambiente**

Crie um arquivo `.env` na raiz do projeto:

```env
DATABASE_URL="postgresql://user:password@localhost:5434/peticoes?schema=public"
PORT=3000
JWT_SECRET=your-secret-key-here
NODE_ENV=development
```

4. **Inicie o banco de dados**

```bash
docker-compose up -d
```

5. **Execute as migrations**

```bash
pnpm prisma migrate dev
```

6. **Execute o seed (opcional)**

Popula o banco com templates de documentos e cria um usuário admin padrão:

```bash
pnpm prisma db seed
```

**Credenciais do admin padrão:**
- Email: `admin@example.com`
- Senha: `12345678`

> ⚠️ **Importante:** Altere essas credenciais em produção!

7. **Inicie o servidor**

```bash
pnpm start:dev
```

A API estará disponível em `http://localhost:3000` 🎉

---

## 📚 Estrutura da API

### Módulos Principais

| Módulo | Rota Base | Descrição |
|--------|-----------|-----------|
| **Auth** | `/auth` | Autenticação e login |
| **Users** | `/users` | Gerenciamento de usuários |
| **Clients** | `/clients` | Gerenciamento de clientes |
| **Document Templates** | `/document-templates` | Templates de documentos |
| **Documents** | `/documents` | Geração de documentos |
| **Generated Documents** | `/generated-documents` | Documentos gerados e download |

### Templates de Documentos Disponíveis

O sistema possui **10 templates** de documentos jurídicos prontos para geração:

1. **Procuração e Declaração Judicial**
2. **Contrato de Honorários**
3. **Autodeclaração Rural**
4. **Procuração Pessoa Física**
5. **LOAS - Benefício para Deficiente**
6. **Declaração de Não Recebimento**
7. **LOAS - Auxílio-Doença**
8. **LOAS - Idoso**
9. **Procuração INSS**
10. **Termo de Representação INSS**

Cada template possui:
- Arquivo `.hbs` (Handlebars) com o layout do documento
- Arquivo `payloadSchema.json` com a estrutura de dados esperada
- Gerador dedicado que converte dados em PDF

### Estrutura do Código

```
src/
├── auth/                      # Autenticação JWT
├── users/                     # Gerenciamento de usuários
├── clients/                   # CRUD de clientes
├── documents/
│   ├── adapters/             # Adaptação de payloads
│   │   └── payload.adapter.ts
│   ├── generators/           # Geradores de PDF
│   │   ├── procuracao-declaracao-judiciais.generator.ts
│   │   ├── contrato-honorarios.generator.ts
│   │   └── ...
│   ├── dto/                  # DTOs de requisição
│   ├── documents.service.ts  # Lógica de negócio
│   └── documents.controller.ts
├── generated-documents/       # Histórico e download
└── prisma/                   # Database e ORM

templates/
├── assets/                   # Imagens e fontes
└── [template-name]/
    ├── template.hbs         # Layout do documento
    └── payloadSchema.json   # Estrutura de dados
```

---

## 🔐 Autenticação

A API utiliza **JWT (JSON Web Tokens)** com cookies HTTP-only para autenticação.

### Como autenticar

1. **Login**

```http
POST /auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "senha123"
}
```

**Resposta:**
```json
{
  "message": "Login bem-sucedido"
}
```

O token JWT é retornado automaticamente em um cookie `access_token` com as seguintes propriedades:
- `httpOnly: true` - Não acessível via JavaScript
- `secure: true` - Apenas HTTPS (em produção)
- `sameSite: 'strict'` - Proteção CSRF
- Duração: 8 horas

2. **Logout**

```http
POST /auth/logout
```

**Resposta:**
```json
{
  "message": "Logout realizado com sucesso"
}
```

O cookie `access_token` é removido automaticamente do navegador.

3. **Usando o token**

O navegador enviará automaticamente o cookie em requisições subsequentes. Para requisições via axios/fetch, configure:

```javascript
// Axios
axios.defaults.withCredentials = true;

// Fetch
fetch('http://localhost:3000/users', {
  credentials: 'include'
});
```

### Rotas Protegidas

Todas as rotas exceto `/auth/login` e `/auth/logout` requerem autenticação. Se o token for inválido ou estiver expirado, você receberá:

```json
{
  "statusCode": 401,
  "message": "Unauthorized"
}
```

---

## 🔗 Endpoints Principais

### 📍 Clientes (`/clients`)

#### Listar todos os clientes

```http
GET /clients?page=1&limit=10&name=João&cpfCnpj=123&email=exemplo@email.com&phone=1234&orderBy=alfabetica
```

**Query params opcionais:**
- `page` - Número da página (padrão: 1)
- `limit` - Itens por página (padrão: 10)
- `name` - Filtrar por nome (busca parcial, case-insensitive)
- `cpfCnpj` - Filtrar por CPF ou CNPJ (busca parcial)
- `email` - Filtrar por email (busca parcial, case-insensitive)
- `phone` - Filtrar por telefone (busca parcial, case-insensitive)
- `orderBy` - Ordenação dos resultados: `alfabetica` (ordem alfabética por nome) ou `recente` (mais recentes primeiro, padrão)

**Resposta paginada:**
```json
{
  "data": [
    {
      "id": "clxxx123",
      "name": "João da Silva",
      "cpf": "123.456.789-00",
      "email": "joao@email.com",
      "phone": "(11) 98765-4321",
      "isActive": true,
      "createdAt": "2025-11-12T10:00:00.000Z"
    }
  ],
  "meta": {
    "totalItems": 50,
    "currentPage": 1,
    "itemsPerPage": 10,
    "totalPages": 5
  }
}
```

#### Buscar cliente por ID

```http
GET /clients/:id
```

#### Criar novo cliente

```http
POST /clients
Content-Type: application/json

{
  "name": "Maria Santos",
  "cpf": "987.654.321-00",
  "email": "maria@email.com",
  "phone": "(11) 91234-5678",
  "address": "Rua Exemplo, 123",
  "dateOfBirth": "1990-05-15",
  "rg": "12.345.678-9",
  "maritalStatus": "Solteira",
  "nationality": "Brasileira"
}
```

**Campos obrigatórios:**
- `name` (string)
- `cpf` OU `cnpj` (string)

**Validações:**
- CPF/CNPJ devem ser únicos
- Email deve ser único (se fornecido)
- CPF/CNPJ são validados

#### Atualizar cliente

```http
PATCH /clients/:id
Content-Type: application/json

{
  "phone": "(11) 99999-8888",
  "address": "Nova Rua, 456"
}
```

#### Desativar cliente

```http
DELETE /clients/:id
```

> ⚠️ Isso marca o cliente como `isActive: false`, não deleta permanentemente.

#### Status de documentos do cliente

```http
GET /clients/:id/document-status
```

Retorna o status de geração de todos os templates de documentos para um cliente específico.

**Resposta:**
```json
[
  {
    "templateId": "tmpl_123",
    "title": "Procuração e Declaração Judicial",
    "status": "gerado",
    "lastGenerated": {
      "generatedDocumentId": "doc_456",
      "createdAt": "2025-10-20T15:30:00.000Z",
      "generatorName": "Dra. Maria Santos",
      "dataSnapshot": {
        "numeroProcesso": "0001234-56.2025.8.26.0100",
        "vara": "1ª Vara Cível"
      }
    }
  },
  {
    "templateId": "tmpl_789",
    "title": "Contrato de Honorários",
    "status": "nao_gerado",
    "lastGenerated": null
  }
]
```

**Status possíveis:**
- `gerado` - Documento já foi gerado para este cliente (inclui detalhes da última geração)
- `nao_gerado` - Documento ainda não foi gerado

---

### 📄 Templates de Documentos (`/document-templates`)

#### Listar templates

```http
GET /document-templates
```

**Resposta:**
```json
[
  {
    "id": "tmpl_123",
    "title": "Procuração e Declaração Judicial",
    "payloadSchema": { /* JSON Schema */ },
    "createdAt": "2025-10-01T00:00:00.000Z"
  }
]
```

#### Buscar template por ID

```http
GET /document-templates/:id
```

#### Criar template

```http
POST /document-templates
Content-Type: application/json

{
  "title": "Novo Template",
  "content": "Template em Handlebars...",
  "payloadSchema": {
    "type": "object",
    "properties": {
      "nomeCliente": { "type": "string" }
    }
  }
}
```

---

### 📝 Documentos Gerados (`/generated-documents`)

#### Listar documentos

```http
GET /generated-documents?clientId=xxx
```

**Query params:**
- `clientId` (obrigatório) - ID do cliente

**Resposta:**
```json
[
  {
    "id": "doc_123",
    "title": "Procuração - João Silva",
    "createdAt": "2025-10-20T15:30:00.000Z"
  }
]
```

#### Gerar novo documento

O sistema utiliza o **PayloadAdapter** para processar automaticamente os dados e adaptá-los ao formato dos templates.

**Fluxo de Geração:**
1. Requisição → Controller recebe dados
2. Adaptação → PayloadAdapter transforma dados
3. Mesclagem → Dados do cliente + extras adaptados
4. Geração → PDF criado com Handlebars + Puppeteer
5. Salvamento → Arquivo salvo e registro criado
6. Resposta → Caminho e ID do documento

```http
POST /generated-documents
Content-Type: application/json

{
  "templateId": "tmpl_123",
  "clientId": "cl_456",
  "data": {
    "numeroProcesso": "0001234-56.2025.8.26.0100",
    "vara": "1ª Vara Cível",
    "comarca": "São Paulo"
  }
}
```

**Resposta:**
```json
{
  "id": "doc_789",
  "title": "Procuração - João Silva",
  "filePath": "/uploads/procuracao-joao-789.pdf",
  "downloadUrl": "http://localhost:3000/generated-documents/doc_789/download"
}
```

#### Download de documento

```http
GET /generated-documents/:id/download
```

Retorna o arquivo PDF para download.

#### Download em lote (ZIP)

```http
POST /generated-documents/download-batch
Content-Type: application/json

{
  "documentIds": ["doc_123", "doc_456", "doc_789"]
}
```

Retorna um arquivo ZIP contendo todos os PDFs solicitados.

**Headers da resposta:**
- `Content-Type: application/zip`
- `Content-Disposition: attachment; filename=documentos.zip`

---

### 👥 Usuários (`/users`)

#### Listar todos os usuários

```http
GET /users?page=1&limit=10&name=João&email=exemplo@email.com&role=LAWYER
```

**Query params opcionais:**
- `page` - Número da página (padrão: 1)
- `limit` - Itens por página (padrão: 10)
- `name` - Filtrar por nome (busca parcial, case-insensitive)
- `email` - Filtrar por email (busca parcial, case-insensitive)
- `role` - Filtrar por role (`ADMIN`, `LAWYER`, `INTERN`)

**Resposta paginada:**
```json
{
  "data": [
    {
      "id": "usr_123",
      "email": "joao@email.com",
      "name": "João Silva",
      "role": "LAWYER",
      "isActive": true,
      "createdAt": "2025-11-12T10:00:00.000Z",
      "updatedAt": "2025-11-12T10:00:00.000Z"
    }
  ],
  "meta": {
    "totalItems": 25,
    "currentPage": 1,
    "itemsPerPage": 10,
    "totalPages": 3
  }
}
```

#### Buscar usuário por ID

```http
GET /users/:id
```

#### Criar usuário

```http
POST /users
Content-Type: application/json

{
  "email": "novo@example.com",
  "name": "Novo Advogado",
  "password": "senha123",
  "role": "LAWYER"
}
```

**Roles disponíveis:**
- `ADMIN` - Administrador
- `LAWYER` - Advogado
- `INTERN` - Estagiário

---

## 📊 Modelos de Dados

### User (Usuário)

```typescript
{
  id: string;
  email: string;
  name: string;
  password: string; // Hash bcrypt
  role: "ADMIN" | "LAWYER" | "INTERN";
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}
```

### Client (Cliente)

```typescript
{
  id: string;
  name: string;
  cpf?: string; // Pessoa física
  cnpj?: string; // Pessoa jurídica
  email?: string;
  phone?: string;
  address?: string;
  dateOfBirth?: Date;
  rg?: string;
  rgIssuer?: string;
  maritalStatus?: string;
  birthPlace?: string;
  nationality?: string;
  motherName?: string;
  occupation?: string;
  nickname?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}
```

### DocumentTemplate

```typescript
{
  id: string;
  title: string;
  content: string; // Template Handlebars
  payloadSchema?: object; // JSON Schema
  createdAt: Date;
  updatedAt: Date;
}
```

### GeneratedDocument

```typescript
{
  id: string;
  title: string;
  filePath: string; // Caminho do PDF
  dataSnapshot: object; // Dados usados na geração (já adaptados)
  clientId: string;
  generatorId: string; // ID do usuário que gerou
  createdAt: Date;
}
```

> **Nota:** O campo `dataSnapshot` contém os dados após processamento pelo `PayloadAdapter`, já no formato esperado pelos templates.

---

## ⚠️ Tratamento de Erros

A API retorna erros no formato padrão do NestJS:

```json
{
  "statusCode": 400,
  "message": "Validation failed",
  "error": "Bad Request"
}
```

### Códigos de Status HTTP

| Código | Significado |
|--------|-------------|
| `200` | OK - Sucesso |
| `201` | Created - Recurso criado |
| `400` | Bad Request - Dados inválidos |
| `401` | Unauthorized - Não autenticado |
| `403` | Forbidden - Sem permissão |
| `404` | Not Found - Recurso não encontrado |
| `409` | Conflict - Recurso duplicado |
| `500` | Internal Server Error - Erro no servidor |

### Exemplos de Erros Comuns

**CPF/Email duplicado:**
```json
{
  "statusCode": 409,
  "message": "Client with this CPF already exists"
}
```

**Validação de dados:**
```json
{
  "statusCode": 400,
  "message": [
    "name should not be empty",
    "email must be an email"
  ],
  "error": "Bad Request"
}
```

**Não autenticado:**
```json
{
  "statusCode": 401,
  "message": "Unauthorized"
}
```

---

## 🔧 Variáveis de Ambiente

Crie um arquivo `.env` na raiz do projeto:

```env
# Database
DATABASE_URL="postgresql://user:password@localhost:5434/peticoes?schema=public"

# Application
PORT=3000
NODE_ENV=development

# JWT
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
```

---

## 📝 Notas para o Frontend

### PayloadAdapter

O backend possui um **PayloadAdapter** que processa automaticamente os dados enviados pelo frontend. Transformações incluem:

- Conversão de datas ISO para dia/mês/ano separados
- Concatenação de endereços fragmentados
- Mapeamento de campos entre estruturas flat e aninhadas
- Normalização de valores booleanos

**Exemplo de transformação:**
```javascript
// Frontend envia:
{
  documentDate: "2025-11-12T13:38:48.555Z",
  addressStreet: "Rua Exemplo",
  addressNumber: "123"
}

// Template recebe (após adaptação):
{
  document: {
    day: "12",
    month: "11", 
    year: "2025"
  },
  address: "Rua Exemplo, 123"
}
```

Para ver a estrutura esperada de cada documento, consulte os arquivos `payloadSchema.json` em `templates/[nome-do-template]/`.

### CORS

O CORS está habilitado para todas as origens em desenvolvimento. Configure `withCredentials: true` para enviar cookies.

### Validação de Dados

A API usa `class-validator`. Todos os erros de validação retornam um array de mensagens no campo `message`.

### Datas

Todas as datas são retornadas no formato ISO 8601:
```
2025-11-12T15:30:00.000Z
```

### Paginação

A listagem de clientes implementa paginação com os seguintes parâmetros:
- `page` - Número da página (padrão: 1)
- `limit` - Itens por página (padrão: 10)

A resposta inclui metadados de paginação:
```json
{
  "data": [...],
  "meta": {
    "totalItems": 50,
    "currentPage": 1,
    "itemsPerPage": 10,
    "totalPages": 5
  }
}
```

### Filtros e Ordenação

Os endpoints de listagem suportam filtros via query params. As buscas textuais são case-insensitive e parciais (LIKE).

**Filtros disponíveis para clientes:**
- `name` - Busca parcial por nome
- `cpfCnpj` - Busca parcial por CPF ou CNPJ
- `email` - Busca parcial por email
- `phone` - Busca parcial por telefone

**Ordenação disponível para clientes:**
- `orderBy=alfabetica` - Ordena por nome em ordem alfabética (A-Z)
- `orderBy=recente` - Ordena por data de criação, mais recentes primeiro (padrão)

### Upload de Arquivos

Os PDFs gerados são salvos em `/uploads` e servidos estaticamente.

### Download de Arquivos

Para downloads individuais, use `GET /generated-documents/:id/download`. Para múltiplos documentos, use o endpoint de download em lote que retorna um ZIP.

### Cache

Não há cache implementado no momento.

---

## 🧪 Testes

```bash
# Testes unitários
pnpm test

# Testes e2e
pnpm test:e2e

# Cobertura
pnpm test:cov
```

---

## 📞 Suporte

Para dúvidas ou problemas:
- Consulte a documentação Swagger: `http://localhost:3000/api`
- Verifique os logs do servidor no terminal
- Entre em contato com a equipe de backend

---

## 👨‍💻 Desenvolvido por

**Marco Pezzote**  
Software Engineer

Este projeto foi desenvolvido com foco em qualidade, escalabilidade e boas práticas de desenvolvimento.

- 🛠️ **Stack:** NestJS, Prisma, PostgreSQL, TypeScript, Handlebars, Puppeteer
- 📦 **Versão:** 1.1.0
- 🗓️ **Data:** Novembro de 2025

---

**© 2025 - Sistema de Petições Jurídicas**