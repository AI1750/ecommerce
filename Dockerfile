FROM node:20-alpine

WORKDIR /app/backend

RUN apk add --no-cache bash

COPY backend/package*.json ./
RUN npm install

COPY backend/ ./

# Run seed during build to populate SQLite database
RUN mkdir -p data && npx tsx src/database/seed.ts || echo "seed failed, continuing"

ENV PORT=3001

EXPOSE 3001

CMD ["sh", "-c", "npx tsx src/index.ts"]