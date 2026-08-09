FROM node:20-alpine

WORKDIR /app/backend

RUN apk add --no-cache bash

COPY backend/package*.json ./
RUN npm install

COPY backend/ ./
RUN chmod +x entrypoint.sh

ENV PORT=3001

EXPOSE 3001

ENTRYPOINT ["./entrypoint.sh"]