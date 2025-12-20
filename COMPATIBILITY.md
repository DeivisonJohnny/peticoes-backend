# Compatibilidade Multi-Arquitetura

## ✅ Suporte a Diferentes VPS

Este Dockerfile foi projetado para funcionar em **qualquer VPS**, independente da arquitetura:

### Provedores Testados/Compatíveis

- ✅ **Hostinger** (AMD64)
- ✅ **Oracle Cloud** (AMD64 e ARM64/Ampere)
- ✅ **AWS EC2** (AMD64, ARM64)
- ✅ **DigitalOcean** (AMD64, ARM64)
- ✅ **Linode** (AMD64, ARM64)
- ✅ **Vultr** (AMD64, ARM64)
- ✅ **Hetzner** (AMD64, ARM64)
- ✅ **Qualquer VPS com Docker**

## 🏗️ Arquiteturas Suportadas

### AMD64/x86_64
- **Navegador**: Google Chrome (oficial)
- **Performance**: Otimizada
- **Status**: ✅ Totalmente suportado

### ARM64 (aarch64)
- **Navegador**: Chromium
- **Performance**: Excelente (especialmente Oracle Cloud Ampere)
- **Status**: ✅ Totalmente suportado
- **Nota**: Oracle Cloud oferece instâncias ARM64 gratuitas (Always Free)

### ARM (32-bit)
- **Navegador**: Chromium
- **Performance**: Boa
- **Status**: ✅ Totalmente suportado

## 🔍 Como Funciona

O Dockerfile detecta automaticamente a arquitetura do sistema:

```dockerfile
ARCH=$(dpkg --print-architecture)
if [ "$ARCH" = "amd64" ]; then
    # Instala Google Chrome
else
    # Instala Chromium e cria symlink
fi
```

O Puppeteer funciona perfeitamente com ambos, pois:
1. O Chromium é compatível com a API do Puppeteer
2. Um symlink garante que o Puppeteer encontre o navegador
3. As flags `--no-sandbox` já estão configuradas no código

## 🧪 Verificar Arquitetura

Para verificar a arquitetura da sua VPS:

```bash
# Na VPS
dpkg --print-architecture
# ou
uname -m
```

Resultados possíveis:
- `amd64` ou `x86_64` → Chrome será instalado
- `arm64` ou `aarch64` → Chromium será instalado
- `arm` ou `armv7l` → Chromium será instalado

## 📊 Comparação

| Arquitetura | Navegador | Tamanho | Performance | Custo VPS |
|------------|-----------|---------|-------------|-----------|
| AMD64 | Chrome | ~200MB | Excelente | Médio |
| ARM64 | Chromium | ~150MB | Excelente | Baixo* |
| ARM | Chromium | ~150MB | Boa | Baixo |

*Oracle Cloud oferece instâncias ARM64 gratuitas no tier Always Free.

## ⚠️ Notas Importantes

1. **Oracle Cloud ARM**: Funciona perfeitamente! O Dockerfile detecta automaticamente.
2. **Performance**: ARM64 (especialmente Ampere) tem excelente performance, muitas vezes melhor que AMD64 para aplicações Node.js.
3. **Puppeteer**: Funciona identicamente com Chrome e Chromium.
4. **Build**: O build é o mesmo para todas as arquiteturas, apenas o navegador muda.

## 🚀 Deploy em Oracle Cloud ARM

Se você estiver usando Oracle Cloud com instância ARM64 (Ampere):

```bash
# O Dockerfile detecta automaticamente e instala Chromium
docker-compose up -d --build

# Verificar qual navegador foi instalado
docker-compose exec api google-chrome-stable --version
# ou
docker-compose exec api chromium --version
```

Ambos funcionarão perfeitamente com o Puppeteer!

