FROM node:20

# Definir diretório de trabalho
WORKDIR /usr/src/app

# Instalar dependências do sistema necessárias para o canvas
RUN apt-get update && apt-get install -y \
    python3 \
    make \
    g++ \
    libcairo2-dev \
    libpango1.0-dev \
    libjpeg-dev \
    libgif-dev \
    librsvg2-dev \
    && rm -rf /var/lib/apt/lists/*

# Copiar package.json e package-lock.json
COPY package*.json ./

# Instalar dependências Node.js
RUN npm install

# Copiar código restante
COPY . .

# Expor porta
EXPOSE 3000

# Rodar app
CMD ["npm", "start"]
