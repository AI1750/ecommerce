FROM node:20-alpine

WORKDIR /app/backend

COPY backend/package*.json ./
RUN npm install

COPY backend/ ./

# Run migrations and seed during build to populate the database
RUN mkdir -p data uploads && npx tsx src/database/seed.ts || true

ENV PORT=3001

EXPOSE 3001

CMD ["npx", "tsx", "src/index.ts"]