# Changelog

Todas as mudanças notáveis neste projeto serão documentadas neste arquivo.

## [1.1.0] - 2025-11-12

### ✨ Adicionado

- **Novo Documento:** Template "Termo de Representação INSS"
  - Template Handlebars completo com checkboxes interativos
  - Schema JSON de validação de payload
  - Gerador dedicado de PDF
  - Adicionado ao seed do banco de dados
  - Documentação de exemplo no EXEMPLO_PAYLOAD.md

- **PayloadAdapter:** Sistema de adaptação de dados
  - Classe dedicada (`src/documents/adapters/payload.adapter.ts`)
  - Processa automaticamente dados do frontend
  - Conversões de datas ISO → dia/mês/ano separados
  - Concatenação de endereços fragmentados
  - Mapeamento de campos entre estruturas diferentes
  - Normalização de valores booleanos
  - Suporte para todos os 10 templates de documentos

- **Seed do Banco:** Usuário admin padrão
  - Email: `admin@example.com`
  - Senha: `12345678` (hash bcrypt)
  - Role: ADMIN
  - Criado/atualizado automaticamente no seed

### 📚 Documentação

- Atualizado README.md com:
  - Credenciais do admin padrão
  - Lista completa dos 10 templates disponíveis
  - Estrutura detalhada do código
  - Explicação do PayloadAdapter
  - Fluxo de geração de documentos
  - Notas sobre transformação de dados

- Atualizado EXEMPLO_PAYLOAD.md com:
  - Seção explicativa sobre o PayloadAdapter
  - Exemplo completo do "Termo de Representação INSS"

### 🔧 Melhorias

- Separação de responsabilidades:
  - Lógica de adaptação movida para classe dedicada
  - `documents.service.ts` mais limpo e focado
  - Fácil manutenção e extensão

- Estrutura modular:
  - Cada template com seu gerador dedicado
  - Adaptações centralizadas no PayloadAdapter
  - Código organizado por responsabilidade

### 🐛 Correções

- Removido erro de tipo no `auth.module.ts` relacionado ao `expiresIn` do JWT
- Corrigido problemas de adaptação de payload para documentos existentes

---

## [1.0.0] - 2025-10-01

### ✨ Inicial

- Sistema de autenticação JWT com cookies HTTP-only
- CRUD completo de clientes com paginação e filtros
- CRUD de usuários com roles (ADMIN, LAWYER, INTERN)
- Sistema de templates de documentos
- Geração de PDFs usando Handlebars + Puppeteer
- 9 templates de documentos jurídicos:
  1. Procuração e Declaração Judicial
  2. Contrato de Honorários
  3. Autodeclaração Rural
  4. Procuração Pessoa Física
  5. LOAS - Benefício para Deficiente
  6. Declaração de Não Recebimento
  7. LOAS - Auxílio-Doença
  8. LOAS - Idoso
  9. Procuração INSS
- Histórico de documentos gerados
- Download individual e em lote (ZIP)
- Validação de payloads com JSON Schema
- Documentação Swagger automática
- Banco de dados PostgreSQL com Prisma ORM

