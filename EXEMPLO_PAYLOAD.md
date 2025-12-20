# Exemplos de Payload para Geração de Documentos

## 📝 Sobre o PayloadAdapter

O backend utiliza o **PayloadAdapter** (`src/documents/adapters/payload.adapter.ts`) que processa automaticamente os dados enviados pelo frontend, realizando transformações necessárias:

- Conversão de datas ISO para dia/mês/ano separados
- Concatenação de endereços fragmentados
- Mapeamento de campos entre estruturas flat e aninhadas
- Normalização de valores booleanos

> **Nota:** Os payloads abaixo representam exemplos do formato que o frontend pode enviar. O adapter se encarrega de transformá-los para o formato esperado pelos templates.

---

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

### 6. **Declaração de Não Recebimento**

**Exemplo A: NÃO recebe benefício**
```json
{
  "clientId": "cliente_123",
  "templateId": "template_declaracao_nao_recebimento",
  "extraData": {
    "client": {
      "name": "José da Silva Santos",
      "cpf": "123.456.789-00",
      "rg": "12.345.678-9"
    },
    "benefit": {
      "receives": false
    },
    "document": {
      "location": "São Paulo",
      "day": "11",
      "month": "11",
      "year": "2025"
    }
  }
}
```

**Exemplo B: RECEBE pensão**
```json
{
  "clientId": "cliente_123",
  "templateId": "template_declaracao_nao_recebimento",
  "extraData": {
    "client": {
      "name": "Maria Aparecida dos Santos",
      "cpf": "987.654.321-00",
      "rg": "98.765.432-1"
    },
    "benefit": {
      "receives": true,
      "type": "pensao",
      "isSpouseRelation": true,
      "origin": "federal",
      "serverType": "civil",
      "startDay": "15",
      "startMonth": "03",
      "startYear": "2020",
      "organizationName": "Ministério da Fazenda",
      "lastGrossSalary": "8.500,00",
      "salaryMonth": "10",
      "salaryYear": "2025"
    },
    "document": {
      "location": "Brasília",
      "day": "11",
      "month": "11",
      "year": "2025"
    }
  }
}
```

**Exemplo C: RECEBE aposentadoria**
```json
{
  "clientId": "cliente_123",
  "templateId": "template_declaracao_nao_recebimento",
  "extraData": {
    "client": {
      "name": "João Carlos Pereira",
      "cpf": "456.789.123-00",
      "rg": "45.678.912-3"
    },
    "benefit": {
      "receives": true,
      "type": "aposentadoria",
      "origin": "estadual",
      "serverType": "militar",
      "startDay": "01",
      "startMonth": "06",
      "startYear": "2018",
      "organizationName": "Polícia Militar de São Paulo",
      "lastGrossSalary": "12.000,00",
      "salaryMonth": "09",
      "salaryYear": "2025"
    },
    "document": {
      "location": "São Paulo",
      "day": "11",
      "month": "11",
      "year": "2025"
    }
  }
}
```

### 7. **LOAS - Auxílio-Doença**

```json
{
  "clientId": "cliente_123",
  "templateId": "template_loas_auxilio_doenca",
  "extraData": {
    "client": {
      "name": "MARIA LUCIENE DOS SANTOS OLIVEIRA",
      "nationality": "brasileira",
      "rg": "28.858.220-2",
      "cpf": "179.536.658-32",
      "address": "Rua da Olaria Nº 55 Calcário - Caieiras - SP",
      "cep": "07722-105"
    },
    "document": {
      "juizado": "JUIZADO ESPECIAL FEDERAL DE OSASCO/SP",
      "valorCausa": "R$ 132.911,99",
      "valorCausaExtenso": "cento e trinta e dois mil, novecentos e onze reais e noventa e nove centavos",
      "especialidadePericia": "ORTOPEDIA"
    },
    "benefit": {
      "requested": "Auxílio por incapacidade temporária ou Aposentadoria por incapacidade permanente",
      "number": "719.474.755-4",
      "der": "13/02/2025",
      "denialReason": "Não constatação de incapacidade laborativa em 13/02/2025",
      "denialDate": "07/05/2025"
    },
    "disease": {
      "name": "TRANSTORNOS DE DISCOS INTERVERTEBRAIS E SACROILEÍTE",
      "limitations": "Dor constante a movimentos mínimos.",
      "symptoms": "Dor lombar e sacrococcígea de difícil tratamento.",
      "inconsistencies": "O perito da Autarquia NÃO RECONHECE A INCAPACIDADE da Segurado, todavia, tal conclusão é divergente dos documentos médicos apresentados que indicavam a existência de incapacidade laborativa."
    },
    "occupation": {
      "title": "Diarista",
      "description": "Permanecer por longos períodos na posição em pé, realização de movimentos repetitivos.",
      "conditions": "A jornada é realizada na posição em pé com realização de movimentos repetitivos e excesso de esforço físico."
    }
  }
}
```

### 8. **LOAS - Idoso**

```json
{
  "clientId": "cliente_123",
  "templateId": "template_loas_idoso",
  "extraData": {
    "client": {
      "name": "JOSEFA DA CONCEIÇÃO SILVA DO NASCIMENTO",
      "nationality": "brasileira",
      "birthDate": "13/03/1959",
      "age": "65",
      "motherName": "Ana Izabel da Silva",
      "rg": "34.326.636-2",
      "cpf": "440.345.778-94",
      "address": "Rua Orindiuva, n.º 147, Casa 01, Jardim América, Várzea Paulista/SP",
      "cep": "13221-371",
      "phone": "(11) 95146-0289"
    },
    "document": {
      "juizado": "JUIZADO ESPECIAL FEDERAL DE JUNDIAÍ/SP",
      "valorCausa": "R$ 20.727,14",
      "valorCausaExtenso": "vinte mil, setecentos e vinte e sete reais e quatorze centavos",
      "valorCausaFiscal": "R$ 15.840,00",
      "valorCausaFiscalExtenso": "quinze mil, oitocentos e quarenta reais",
      "mapaUrl": "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQ..."
    },
    "benefit": {
      "number": "715.070.346-2",
      "cessationDate": "17/05/2024",
      "livingArrangement": "reside sozinha"
    }
  }
}
```

### 9. **Procuração INSS**

```json
{
  "clientId": "cliente_123",
  "templateId": "template_procuracao_inss",
  "extraData": {
    "grantor": {
      "name": "Maria da Silva Santos",
      "nationality": "brasileira",
      "maritalStatus": "casada",
      "rg": "12.345.678-9",
      "cpf": "123.456.789-00",
      "occupation": "Aposentada",
      "street": "Rua das Flores",
      "number": "123",
      "complement": "Apto 45",
      "neighborhood": "Centro",
      "cityState": "São Paulo/SP",
      "zipCode": "01234-567"
    },
    "attorney": {
      "name": "João Carlos Pereira",
      "nationality": "brasileiro",
      "maritalStatus": "solteiro",
      "rg": "98.765.432-1",
      "cpf": "987.654.321-00",
      "occupation": "Advogado",
      "street": "Avenida Paulista",
      "number": "1000",
      "complement": "Sala 200",
      "neighborhood": "Bela Vista",
      "cityState": "São Paulo/SP",
      "zipCode": "01310-100"
    },
    "powers": {
      "passwordRegistration": true,
      "proofOfLife": true,
      "receivePayments": true,
      "reasonInability": false,
      "reasonDomesticTravel": false,
      "domesticTravelPeriod": "",
      "reasonInternationalTravel": true,
      "internationalTravelPeriod": "6 meses",
      "reasonLivingAbroad": false,
      "countryOfResidence": "",
      "requestBenefits": true,
      "otherRequest": false,
      "otherRequestDescription": ""
    },
    "document": {
      "location": "São Paulo",
      "day": "15",
      "month": "11",
      "year": "2025"
    }
  }
}
```

### 10. **Termo de Representação INSS**

```json
{
  "clientId": "cliente_123",
  "templateId": "template_termo_representacao_inss",
  "extraData": {
    "client": {
      "name": "João Silva Santos",
      "cpf": "123.456.789-00",
      "rg": "12.345.678-9",
      "city": "Barueri",
      "cep": "06400-000"
    },
    "lawyer": {
      "name": "Maria Oliveira Pereira",
      "cpf": "987.654.321-00",
      "oab": "123456",
      "nit": "12345678901"
    },
    "benefits": {
      "aposentadoria_idade": true,
      "aposentadoria_idade_urbana": true,
      "aposentadoria_idade_rural": false,
      "aposentadoria_contribuicao": false,
      "aposentadoria_especial": false,
      "pensao_morte": false,
      "pensao_morte_urbana": false,
      "pensao_morte_rural": false,
      "auxilio_reclusao": false,
      "auxilio_reclusao_urbano": false,
      "auxilio_reclusao_rural": false,
      "salario_maternidade": false,
      "salario_maternidade_urbano": false,
      "salario_maternidade_rural": false,
      "atualizacao_cadastral": false
    },
    "document": {
      "location": "Barueri",
      "day": "12",
      "month": "11",
      "year": "2025"
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
    "logradouro": "Rua Exemplo",     // ← Do banco de dados
    "numero": "123",                 // ← Do banco de dados
    "complemento": "Apto 45",        // ← Do banco de dados
    "bairro": "Centro",              // ← Do banco de dados
    "cidadeEstado": "São Paulo/SP",  // ← Do banco de dados
    "address": "Rua Exemplo, 123, Apto 45, Centro, São Paulo/SP",  // ← Montado automaticamente
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