# Arquitetura do Sistema

## 📐 Visão Geral

Sistema de geração de documentos jurídicos desenvolvido em NestJS, utilizando Prisma ORM, PostgreSQL, Handlebars e Puppeteer.

## 🏗️ Estrutura de Diretórios

```
backend/
├── src/
│   ├── auth/                          # Módulo de autenticação
│   │   ├── strategies/               # Estratégias Passport (JWT, Local)
│   │   ├── decorators/               # Decorators customizados
│   │   └── types/                    # Tipos TypeScript
│   │
│   ├── users/                         # Módulo de usuários
│   │   ├── dto/                      # Data Transfer Objects
│   │   └── users.service.ts          # Lógica de negócio
│   │
│   ├── clients/                       # Módulo de clientes
│   │   ├── dto/                      # DTOs de requisição
│   │   └── clients.service.ts        # CRUD e filtros
│   │
│   ├── documents/                     # ⭐ Módulo principal de documentos
│   │   ├── adapters/                 # Adaptação de payloads
│   │   │   └── payload.adapter.ts   # Transforma dados do frontend
│   │   ├── generators/               # Geradores de PDF
│   │   │   ├── procuracao-declaracao-judiciais.generator.ts
│   │   │   ├── contrato-honorarios.generator.ts
│   │   │   └── [9 outros geradores...]
│   │   ├── dto/                      # DTOs de requisição
│   │   ├── documents.service.ts      # Orquestração da geração
│   │   └── documents.controller.ts   # Endpoints HTTP
│   │
│   ├── document-templates/            # Módulo de templates
│   │   └── document-templates.service.ts
│   │
│   ├── generated-documents/           # Módulo de documentos gerados
│   │   ├── dto/                      # DTOs de consulta
│   │   └── generated-documents.service.ts
│   │
│   ├── prisma/                        # Configuração Prisma
│   │   ├── prisma.service.ts         # Serviço de conexão
│   │   └── prisma.module.ts
│   │
│   ├── common/                        # Recursos compartilhados
│   │   └── decorators/               # Decorators globais
│   │
│   └── main.ts                        # Ponto de entrada da aplicação
│
├── templates/                         # Templates Handlebars
│   ├── assets/                       # Imagens e fontes
│   │   ├── brasaooficialcolorido.png
│   │   ├── souzalogo.png
│   │   └── Cambria-Font-For-Windows.ttf
│   │
│   └── [nome-do-template]/           # Cada template em sua pasta
│       ├── template.hbs              # Layout HTML + Handlebars
│       └── payloadSchema.json        # Schema de validação
│
├── prisma/
│   ├── schema.prisma                 # Schema do banco de dados
│   ├── seed.ts                       # Seed de templates e admin
│   └── migrations/                   # Migrações do banco
│
├── uploads/                           # PDFs gerados
├── test/                              # Testes E2E
└── dist/                              # Build de produção
```

## 🔄 Fluxo de Geração de Documentos

```
┌─────────────┐
│  Frontend   │
│  (React)    │
└──────┬──────┘
       │ POST /documents/generate
       │ {clientId, templateId, extraData}
       ▼
┌──────────────────────────────────────────────────┐
│           DocumentsController                    │
└──────┬───────────────────────────────────────────┘
       │ 1. Recebe requisição
       ▼
┌──────────────────────────────────────────────────┐
│           DocumentsService                       │
│  ┌────────────────────────────────────────────┐ │
│  │  2. Busca cliente e template no banco     │ │
│  └────────────────────────────────────────────┘ │
└──────┬───────────────────────────────────────────┘
       │
       ▼
┌──────────────────────────────────────────────────┐
│           PayloadAdapter                         │
│  ┌────────────────────────────────────────────┐ │
│  │  3. Adapta extraData para formato dos     │ │
│  │     templates (datas, endereços, etc.)    │ │
│  └────────────────────────────────────────────┘ │
└──────┬───────────────────────────────────────────┘
       │
       ▼
┌──────────────────────────────────────────────────┐
│           DocumentsService                       │
│  ┌────────────────────────────────────────────┐ │
│  │  4. Mescla dados:                          │ │
│  │     - Dados do cliente (banco)             │ │
│  │     - Dados extras (adaptados)             │ │
│  └────────────────────────────────────────────┘ │
└──────┬───────────────────────────────────────────┘
       │
       ▼
┌──────────────────────────────────────────────────┐
│         Generator Específico                     │
│  ┌────────────────────────────────────────────┐ │
│  │  5. Lê template.hbs                        │ │
│  │  6. Compila com Handlebars                 │ │
│  │  7. Gera HTML final                        │ │
│  │  8. Puppeteer converte HTML → PDF         │ │
│  └────────────────────────────────────────────┘ │
└──────┬───────────────────────────────────────────┘
       │
       ▼
┌──────────────────────────────────────────────────┐
│           DocumentsService                       │
│  ┌────────────────────────────────────────────┐ │
│  │  9. Salva PDF em /uploads                  │ │
│  │ 10. Cria registro GeneratedDocument        │ │
│  └────────────────────────────────────────────┘ │
└──────┬───────────────────────────────────────────┘
       │
       ▼ Resposta
┌──────────────┐
│   Frontend   │
│ {documentId, │
│  path, msg}  │
└──────────────┘
```

## 🧩 Componentes Principais

### 1. PayloadAdapter

**Localização:** `src/documents/adapters/payload.adapter.ts`

**Responsabilidade:** Transformar dados do frontend para o formato dos templates.

**Transformações:**
```typescript
// Datas ISO → dia/mês/ano separados
documentDate: "2025-11-12T13:38:48.555Z"
  ↓
document: { day: "12", month: "11", year: "2025" }

// Endereços fragmentados → concatenados
street: "Rua Exemplo", number: "123", neighborhood: "Centro"
  ↓
address: "Rua Exemplo, 123, Centro"

// Campos flat → estruturas aninhadas
fullName: "João Silva", cpf: "123.456.789-00"
  ↓
client: { name: "João Silva", cpf: "123.456.789-00" }
```

**Métodos específicos por documento:**
- `adaptDeclaracaoNaoRecebimento()`
- `adaptAutodeclaracaoRural()`
- `adaptProcuracaoDeclaracaoJudicial()`
- `adaptLoasAuxilioDoenca()`
- ... (10 adaptadores no total)

### 2. Document Generators

**Localização:** `src/documents/generators/`

**Padrão de implementação:**
```typescript
export async function generate[NomeDoDocumento](
  dataSnapshot: any
): Promise<Buffer> {
  // 1. Lê template .hbs
  const templatePath = path.resolve(
    process.cwd(),
    'templates',
    '[pasta-do-template]',
    'template.hbs'
  );
  const templateContent = await fs.readFile(templatePath, 'utf-8');

  // 2. Compila com Handlebars
  const compiledTemplate = handlebars.compile(templateContent);
  const finalHtml = compiledTemplate(dataSnapshot);

  // 3. Gera PDF com Puppeteer
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox']
  });
  const page = await browser.newPage();
  await page.setContent(finalHtml, { waitUntil: 'networkidle0' });

  const pdfBuffer = await page.pdf({
    format: 'A4',
    printBackground: true,
    margin: { top: '20px', right: '20px', bottom: '20px', left: '20px' }
  });

  await browser.close();
  return Buffer.from(pdfBuffer);
}
```

### 3. DocumentsService

**Localização:** `src/documents/documents.service.ts`

**Responsabilidades:**
1. Validar clientId e templateId
2. Buscar dados no banco
3. Chamar PayloadAdapter
4. Mesclar dados do cliente + extras
5. Invocar gerador correto
6. Salvar PDF e criar registro

**Método principal:**
```typescript
async generateSingleDocument(dto: GenerateDocumentDto) {
  // 1. Validações
  const client = await this.prisma.client.findUnique({...});
  const template = await this.prisma.documentTemplate.findUnique({...});
  
  // 2. Adaptação
  const adaptedData = PayloadAdapter.adapt(dto.extraData, template.title);
  
  // 3. Mesclagem
  const finalPayload = { client, document, ...adaptedData };
  
  // 4. Geração
  const generator = documentGenerators[template.title];
  const pdfBuffer = await generator(finalPayload);
  
  // 5. Salvamento
  await fs.writeFile(filePath, pdfBuffer);
  await this.prisma.generatedDocument.create({...});
  
  return { message, path, documentId };
}
```

## 🗄️ Banco de Dados

**ORM:** Prisma  
**Database:** PostgreSQL

### Modelos Principais

```prisma
model User {
  id        String   @id @default(cuid())
  email     String   @unique
  password  String   // bcrypt hash
  role      Role     // ADMIN | LAWYER | INTERN
  name      String
  isActive  Boolean  @default(true)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}

model Client {
  id               String    @id @default(cuid())
  name             String
  cpf              String?   @unique
  cnpj             String?   @unique
  email            String?
  phone            String?
  address          String?
  isActive         Boolean   @default(true)
  generatedDocuments GeneratedDocument[]
  // ... outros campos
}

model DocumentTemplate {
  id            String   @id @default(cuid())
  title         String   @unique
  content       String   // Handlebars template
  payloadSchema Json?    // JSON Schema
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
}

model GeneratedDocument {
  id           String   @id @default(cuid())
  title        String
  filePath     String
  dataSnapshot Json     // Dados usados (já adaptados)
  client       Client   @relation(fields: [clientId])
  clientId     String
  generator    User     @relation(fields: [generatorId])
  generatorId  String
  createdAt    DateTime @default(now())
}
```

## 🔒 Autenticação

**Estratégia:** JWT com cookies HTTP-only

**Fluxo:**
1. Cliente faz POST /auth/login com email/senha
2. Backend valida credenciais (bcrypt)
3. Gera token JWT assinado
4. Retorna token em cookie HTTP-only
5. Navegador envia automaticamente cookie em requisições
6. JwtStrategy valida token em rotas protegidas

**Proteção de Rotas:**
```typescript
@UseGuards(JwtAuthGuard)
@Get()
async findAll() { ... }
```

## 📦 Templates

Cada template possui:

1. **template.hbs** - Layout HTML com Handlebars
   - Variáveis: `{{client.name}}`, `{{document.location}}`
   - Condicionais: `{{#if benefit.receives}}`
   - Loops: `{{#each familyMembers}}`

2. **payloadSchema.json** - JSON Schema para validação
   ```json
   {
     "type": "object",
     "required": ["client", "document"],
     "properties": {
       "client": { "type": "object" },
       "document": { "type": "object" }
     }
   }
   ```

3. **Generator** - Função dedicada de geração
   - Lê template
   - Compila com Handlebars
   - Gera PDF com Puppeteer

## 🚀 Deploy

### Desenvolvimento
```bash
pnpm install
docker-compose up -d
pnpm prisma migrate dev
pnpm prisma db seed
pnpm start:dev
```

### Produção
```bash
pnpm install --prod
pnpm prisma migrate deploy
pnpm build
pnpm start:prod
```

### Variáveis de Ambiente
```env
DATABASE_URL=postgresql://user:pass@localhost:5434/db
PORT=3000
JWT_SECRET=seu-secret-aqui
NODE_ENV=production
```

## 📊 Performance

- **Puppeteer:** Headless Chrome para geração de PDFs
- **Prisma:** Query builder otimizado com TypeScript
- **Cookies:** JWT em HTTP-only cookies (segurança + performance)
- **Arquivos estáticos:** PDFs servidos via Express static

## 🔧 Extensibilidade

### Adicionar Novo Template

1. Criar pasta em `templates/[nome-template]/`
2. Adicionar `template.hbs` e `payloadSchema.json`
3. Criar gerador em `src/documents/generators/[nome].generator.ts`
4. Registrar no mapa em `documents.service.ts`:
   ```typescript
   const documentGenerators = {
     'Nome do Template': generateNovoTemplate,
   };
   ```
5. Adicionar ao `prisma/seed.ts`
6. Executar seed

### Adicionar Nova Adaptação

Editar `src/documents/adapters/payload.adapter.ts`:

```typescript
case 'Novo Template':
  return this.adaptNovoTemplate(adapted);
```

## 🧪 Testes

```bash
# Unitários
pnpm test

# E2E
pnpm test:e2e

# Cobertura
pnpm test:cov
```

## 📝 Logs

NestJS Logger integrado:
- Erros de validação
- Exceções de geração
- Operações de banco de dados
- Requisições HTTP (em desenvolvimento)

---

## 👨‍💻 Desenvolvido por

**Marco Pezzote** - Software Engineer

**Versão:** 1.1.0  
**Data:** Novembro de 2025

---

**© 2025 - Sistema de Petições Jurídicas**

