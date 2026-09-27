# Stage 1: Build & Compilação TypeScript
FROM node:20-alpine AS builder

WORKDIR /app

# Instala ferramentas necessárias para compilar melhor-sqlite3 se necessário
RUN apk add --no-cache python3 make g++

COPY package*.json tsconfig.json ./
RUN npm ci

COPY src ./src
RUN npm run build

# Stage 2: Imagem leve de Execução (Production Runner)
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production

RUN apk add --no-cache sqlite-dev

COPY package*.json ./
RUN npm ci --only=production

COPY --from=builder /app/dist ./dist

# Diretório para volume persistente do banco SQLite
RUN mkdir -p /app/data

VOLUME ["/app/data"]

CMD ["npm", "start"]
