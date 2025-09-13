FROM node:20

# Defina o diretório de trabalho dentro do container
WORKDIR /usr/src/app

# Copie package.json e package-lock.json
COPY package*.json ./

# Instale as dependências
RUN npm install

# Copie todo o restante do código
COPY . .

# Expõe a porta definida
EXPOSE 3000

# Comando para rodar a aplicação
CMD ["npm", "start"]
