FROM node:24.15.0-alpine AS dependencies

WORKDIR /app

COPY package.json package-lock.json ./
COPY backend/package.json ./backend/package.json
COPY frontend/package.json ./frontend/package.json

RUN npm ci --workspace backend

FROM dependencies AS build

COPY backend ./backend

RUN npm --workspace backend run build

FROM node:24.15.0-alpine AS runtime

ENV NODE_ENV=production
ENV PORT=3333

WORKDIR /app

RUN addgroup -S techx && adduser -S techx -G techx

COPY package.json package-lock.json ./
COPY backend/package.json ./backend/package.json
COPY frontend/package.json ./frontend/package.json

RUN npm ci --workspace backend --omit=dev && npm cache clean --force

COPY --from=build --chown=techx:techx /app/backend/dist ./backend/dist

USER techx

EXPOSE 3333

HEALTHCHECK --interval=30s --timeout=5s --start-period=30s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:3333/readiness').then((r)=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

CMD ["node", "backend/dist/src/server.js"]
