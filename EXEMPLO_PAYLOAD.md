# Exemplos de Payload para Geração de Documentos

## 📋 Templates Disponíveis

### 1. **Procuração e Declaração Judicial**

```json
{
  "clientId": "cliente_123",
  "templateId": "template_procuracao_declaracao",
  "extraData": {
    "client": {
      "nationality": "brasileira"
    },
    "document": {
      "documentLocation": "São Paulo/SP",
      "documentDate": "2025-11-05"
    }
  }
}
```

### 2. **Contrato de Honorários**

```json
{
  "clientId": "cliente_123", 
  "templateId": "template_contrato_honorarios",
  "extraData": {
    "client": {
      "nationality": "brasileiro"
    },
    "document": {
      "documentLocation": "Rio de Janeiro/RJ",
      "documentDate": "2025-11-05"
    }
  }
}
```

### 3. **Procuração Pessoa Física**

```json
{
  "clientId": "cliente_123",
  "templateId": "template_procuracao_pp", 
  "extraData": {
    "client": {
      "nationality": "brasileira"
    },
    "document": {
      "locationAndDate": "Brasília/DF, 05 de novembro de 2025"
    }
  }
}
```

### 4. **Autodeclaração Rural**

```json
{
  "clientId": "cliente_123",
  "templateId": "template_autodeclaracao_rural",
  "extraData": {
    "brasaoOficialBase64": "iVBORw0KGgoAAAANSUhEUgAA...",
    "nickname": "João do Campo",
    "birthPlace": "Interior de SP",
    "city": "Ribeirão Preto", 
    "state": "SP",
    "rgIssuer": "SSP/SP - 15/03/2000",
    "ruralActivityPeriods": [
      {
        "period": "1980-1990",
        "propertyCondition": "Proprietário",
        "isIndividual": true,
        "isFamilyEconomy": false
      },
      {
        "period": "1990-2000", 
        "propertyCondition": "Arrendatário",
        "isIndividual": false,
        "isFamilyEconomy": true
      }
    ],
    "familyEconomy": {
      "isHolder": true,
      "isComponent": false
    }
  }
}
```

### 5. **LOAS - Benefício para Deficiente**

```json
{
  "clientId": "cliente_123",
  "templateId": "template_loas_deficiencia",
  "extraData": {
    "client": {
      "nationality": "brasileira",
      "cep": "06382-270"
    },
    "document": {
      "juizado": "JUIZADO ESPECIAL FEDERAL DE OSASCO /SP",
      "valorCausa": "R$ 32.409,96",
      "valorCausaExtenso": "trinta e dois mil, quatrocentos e nove reais e noventa e seis centavos",
      "especialidadePericia": "PSIQUIATRIA",
      "condicaoMedica": "Episódios depressivos e outros transtornos ansiosos",
      "composicaoFamiliar": "o grupo familiar da Requerente é composto apenas por ela que não possui qualquer renda para subsistência",
      "dataIndeferimento": "2024-10-21",
      "numeroBeneficio": "717.212.645-0",
      "mapaUrl": "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQ..."
    }
  }
}
```

---

## 🏗️ **Como a estrutura funciona:**

### **Dados mesclados automaticamente:**

```json
{
  "client": {
    "id": "cliente_123",
    "name": "João Silva",           // ← Do banco de dados
    "cpf": "123.456.789-00",        // ← Do banco de dados  
    "address": "Rua Exemplo, 123",  // ← Do banco de dados
    "nationality": "brasileiro"     // ← Do extraData.client
  },
  "document": {
    "documentLocation": "São Paulo/SP",     // ← Padrão ou do extraData.document
    "documentDate": "2025-11-05",          // ← Padrão ou do extraData.document
    "valorCausa": "R$ 32.409,96"           // ← Do extraData.document (LOAS)
  }
}
```

### **Uso nos templates Handlebars:**

```handlebars
{{ client.name }}                    <!-- João Silva -->
{{ client.nationality }}             <!-- brasileiro -->
{{ formatDate document.documentDate }} <!-- 5 de novembro de 2025 -->
{{ document.documentLocation }}      <!-- São Paulo/SP -->
{{#if document.mapaUrl}}            <!-- Conditional para LOAS -->
  <img src="{{ document.mapaUrl }}" />
{{/if}}
```

---

## 🧪 **Teste via API:**

```bash
POST /documents/generate
Content-Type: application/json

{
  "clientId": "cliente_123",
  "templateId": "template_id_aqui",
  "extraData": {
    "document": {
      "documentLocation": "Brasília/DF",
      "documentDate": "2025-11-05"
    }
  }
}
```

**Resposta:**
```json
{
  "message": "Documento gerado com sucesso!",
  "path": "uploads/Template-João_Silva-1699200000000.pdf",
  "documentId": "doc_123"
}
```