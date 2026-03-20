# Stage 1: Build client
FROM node:20-alpine AS build-client
WORKDIR /app/client
COPY client/package.json client/package-lock.json ./
RUN npm ci
COPY client/ ./
RUN npm run build

# Stage 2: Build server
FROM node:20-alpine AS build-server
WORKDIR /app/server
COPY server/package.json server/package-lock.json ./
RUN npm ci
COPY server/ ./
RUN npm run build

# Stage 3: Production
FROM node:20-alpine
RUN apk add --no-cache python3 make g++
WORKDIR /app

COPY server/package.json server/package-lock.json server/
RUN cd server && npm ci --omit=dev

COPY --from=build-server /app/server/dist server/dist
COPY server/data server/data
COPY --from=build-client /app/client/dist client/dist

RUN mkdir -p /data/assessments

ENV NODE_ENV=production
EXPOSE 3000

CMD ["node", "server/dist/index.js"]
