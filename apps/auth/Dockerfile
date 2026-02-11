FROM node:22-slim

RUN apt-get update && apt-get install -y --no-install-recommends ca-certificates && rm -rf /var/lib/apt/lists/*

RUN corepack enable && corepack prepare pnpm@latest --activate

WORKDIR /app

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/auth/package.json apps/auth/

RUN pnpm install --frozen-lockfile --filter auth...

COPY apps/auth/ apps/auth/

WORKDIR /app/apps/auth

EXPOSE 38200

CMD ["npx", "wrangler", "dev", "--port", "38200", "--ip", "0.0.0.0"]
