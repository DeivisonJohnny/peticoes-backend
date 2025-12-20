# Usar Debian slim como base
FROM node:20-slim

# Instalar dependências necessárias para o Chrome e Puppeteer
RUN apt-get update && apt-get install -y \
    wget \
    gnupg \
    ca-certificates \
    fonts-liberation \
    libasound2 \
    libatk-bridge2.0-0 \
    libatk1.0-0 \
    libatspi2.0-0 \
    libcups2 \
    libdbus-1-3 \
    libdrm2 \
    libgbm1 \
    libgtk-3-0 \
    libnspr4 \
    libnss3 \
    libwayland-client0 \
    libxcomposite1 \
    libxdamage1 \
    libxfixes3 \
    libxkbcommon0 \
    libxrandr2 \
    xdg-utils \
    libu2f-udev \
    libvulkan1 \
    && rm -rf /var/lib/apt/lists/*

# Instalar navegador baseado na arquitetura
# Para amd64: Google Chrome (oficial)
# Para outras arquiteturas (ARM, etc): Chromium (compatível)
RUN ARCH=$(dpkg --print-architecture) && \
    if [ "$ARCH" = "amd64" ]; then \
        wget -q -O - https://dl-ssl.google.com/linux/linux_signing_key.pub | gpg --dearmor -o /usr/share/keyrings/googlechrome-linux-keyring.gpg && \
        echo "deb [arch=amd64 signed-by=/usr/share/keyrings/googlechrome-linux-keyring.gpg] http://dl.google.com/linux/chrome/deb/ stable main" > /etc/apt/sources.list.d/google.list && \
        apt-get update && \
        apt-get install -y google-chrome-stable && \
        rm -rf /var/lib/apt/lists/*; \
    else \
        apt-get update && \
        apt-get install -y chromium chromium-sandbox && \
        rm -rf /var/lib/apt/lists/* && \
        ln -s /usr/bin/chromium /usr/bin/google-chrome-stable; \
    fi

# Criar diretório de trabalho
WORKDIR /app

# Copiar arquivos de dependências
COPY package.json pnpm-lock.yaml ./

# Instalar pnpm globalmente
RUN npm install -g pnpm

# Instalar dependências
RUN pnpm install --frozen-lockfile

# Copiar código fonte
COPY . .

# Gerar Prisma Client
RUN npx prisma generate

# Compilar TypeScript
RUN pnpm build

# Expor porta da aplicação
EXPOSE 3000

# Comando para iniciar a aplicação
CMD ["pnpm", "start:prod"]

