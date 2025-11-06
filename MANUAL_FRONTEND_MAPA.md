# 📋 Manual para o Mapa no LOAS

## 🗺️ **Como funciona o mapa:**

### **1. É OPCIONAL**
- Se não enviar `mapaUrl`, o documento sai **sem mapa** (normal!)
- Se enviar, aparece no meio do documento

### **2. Formato esperado:**
```javascript
// Base64 com prefixo obrigatório
"mapaUrl": "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQ..."
//         ^^^^^^^^^^^^^^^^^^^^^ <- ESSE PREFIXO É OBRIGATÓRIO!
```

---

## 💡 **Como implementar (frontend):**

### **Opção 1: Upload de arquivo**
```javascript
function handleMapaUpload(event) {
  const file = event.target.files[0];
  
  if (file) {
    const reader = new FileReader();
    reader.onload = (e) => {
      // e.target.result já vem no formato correto!
      // Ex: "data:image/jpeg;base64,/9j/4AAQ..."
      setMapaUrl(e.target.result);
    };
    reader.readAsDataURL(file); // <- Método mágico!
  }
}

// No JSX
<input 
  type="file" 
  accept="image/*" 
  onChange={handleMapaUpload}
  placeholder="Selecione o mapa da casa do cliente"
/>
```

### **Opção 2: Drag & Drop**
```javascript
function handleDrop(event) {
  event.preventDefault();
  const file = event.dataTransfer.files[0];
  
  if (file && file.type.startsWith('image/')) {
    const reader = new FileReader();
    reader.onload = (e) => {
      setMapaUrl(e.target.result); // Pronto!
    };
    reader.readAsDataURL(file);
  }
}

// No JSX
<div
  onDrop={handleDrop}
  onDragOver={(e) => e.preventDefault()}
  className="drop-zone"
>
  📍 Arraste a imagem do mapa aqui
</div>
```

### **Opção 3: Screenshot + Paste**
```javascript
// Para usuário fazer Ctrl+V depois de screenshot
function handlePaste(event) {
  const items = event.clipboardData.items;
  
  for (let item of items) {
    if (item.type.startsWith('image/')) {
      const file = item.getAsFile();
      const reader = new FileReader();
      reader.onload = (e) => {
        setMapaUrl(e.target.result);
      };
      reader.readAsDataURL(file);
      break;
    }
  }
}

// Adicionar evento na div ou document
<textarea 
  onPaste={handlePaste}
  placeholder="Cole o screenshot do Google Maps aqui (Ctrl+V)"
/>
```

---

## 📤 **Enviando para a API:**

```javascript
const payload = {
  clientId: "cliente_123",
  templateId: "template_loas_id",
  extraData: {
    client: {
      nationality: "brasileira",
      cep: "06382-270"
    },
    document: {
      juizado: "JUIZADO ESPECIAL FEDERAL DE OSASCO /SP",
      valorCausa: "R$ 32.409,96",
      valorCausaExtenso: "trinta e dois mil reais...",
      condicaoMedica: "Depressão severa",
      // ... outros campos obrigatórios
      
      mapaUrl: mapaUrl // <- Aqui vai o base64 ou undefined
    }
  }**É isso! O backend já está pronto, só implementar o upload no frontend!** 🚀
};

// Se mapaUrl estiver vazio/null, remover do payload
if (!mapaUrl) {
  delete payload.extraData.document.mapaUrl;
}
```

---

## 🎯 **Fluxo recomendado para o usuário:**

1. **Abrir Google Maps** no endereço do cliente
2. **Ajustar zoom/posição** para mostrar bem a localização
3. **Print Screen** ou salvar a imagem
4. **Upload no sistema** ou arrastar para área de drop
5. **Gerar documento** - mapa aparece automaticamente!

---

## ⚠️ **Dicas importantes:**

- **Tamanho:** Imagens muito grandes vão deixar o PDF pesado
- **Formato:** JPEG/PNG/WebP - todos funcionam
- **Qualidade:** Google Maps em zoom 15-17 fica bom
- **Opcional:** Se não tiver mapa, documento sai normal

---

## 🧪 **Como testar:**

1. Pegar qualquer imagem do computador
2. Fazer upload no campo
3. Ver se `mapaUrl` ficou como `"data:image/..."`
4. Enviar para API
5. PDF deve sair com a imagem no meio do documento

