FROM node:20-alpine

WORKDIR /app/backend

RUN apk add --no-cache bash

COPY backend/package*.json ./
RUN npm install

COPY backend/ ./

ENV PORT=3001

EXPOSE 3001

CMD ["sh", "-c", "npx tsx src/database/seed.ts && exec npx tsx src/index.ts"]