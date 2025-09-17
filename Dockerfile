FROM node:22-slim AS build

WORKDIR /usr/src/app

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

COPY package*.json ./

RUN npm ci --only=production
RUN npm install -g pm2

COPY . .

EXPOSE 3000

ENV NODE_ENV=production

# Rodar app
# CMD ["npm", "start"]
CMD ["pm2-runtime", "ecosystem.config.js"]

