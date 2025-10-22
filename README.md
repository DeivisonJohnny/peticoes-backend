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

6. **Popule o banco (opcional)**

```bash
pnpm prisma db seed
```

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
| **Generated Documents** | `/generated-documents` | Documentos gerados |

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

2. **Usando o token**

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

Todas as rotas exceto `/auth/login` requerem autenticação. Se o token for inválido ou estiver expirado, você receberá:

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
GET /clients
```

**Resposta:**
```json
[
  {
    "id": "clxxx123",
    "name": "João da Silva",
    "cpf": "123.456.789-00",
    "email": "joao@email.com",
    "phone": "(11) 98765-4321",
    "isActive": true,
    "createdAt": "2025-10-20T10:00:00.000Z"
  }
]
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
GET /generated-documents
```

**Query params opcionais:**
- `?clientId=xxx` - Filtrar por cliente
- `?generatorId=xxx` - Filtrar por quem gerou

**Resposta:**
```json
[
  {
    "id": "doc_123",
    "title": "Procuração - João Silva",
    "filePath": "/uploads/procuracao-joao-123.pdf",
    "clientId": "cl_456",
    "generatorId": "user_789",
    "createdAt": "2025-10-20T15:30:00.000Z",
    "client": {
      "name": "João Silva"
    },
    "generator": {
      "name": "Dra. Maria"
    }
  }
]
```

#### Gerar novo documento

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

---

### 👥 Usuários (`/users`)

#### Listar usuários

```http
GET /users
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
  dataSnapshot: object; // Dados usados na geração
  clientId: string;
  generatorId: string; // ID do usuário que gerou
  createdAt: Date;
}
```

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

### CORS

O CORS está habilitado para todas as origens em desenvolvimento. Configure `withCredentials: true` para enviar cookies.

### Validação de Dados

A API usa `class-validator`. Todos os erros de validação retornam um array de mensagens no campo `message`.

### Datas

Todas as datas são retornadas no formato ISO 8601:
```
2025-10-20T15:30:00.000Z
```

### Paginação

Atualmente não há paginação implementada. Todos os endpoints retornam todos os registros.

### Upload de Arquivos

Os PDFs gerados são salvos em `/uploads` e servidos estaticamente.

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

**Última atualização:** 20 de outubro de 2025