FROM node:20-alpine

WORKDIR /app/backend

COPY backend/package*.json ./
RUN npm install

COPY backend/ ./

ENV PORT=3001

EXPOSE 3001

CMD ["npx", "tsx", "src/index.ts"]