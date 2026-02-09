FROM node:22-slim

RUN corepack enable && corepack prepare pnpm@latest --activate

WORKDIR /app

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/that-me/package.json apps/that-me/
COPY packages/auth-utils/package.json packages/auth-utils/

RUN pnpm install --frozen-lockfile --filter that-me...

COPY packages/auth-utils/ packages/auth-utils/
COPY apps/that-me/ apps/that-me/

WORKDIR /app/apps/that-me

RUN pnpm prepare

EXPOSE 38100

CMD ["sh", "-c", "pnpm db:migrate:local && pnpm dev --host 0.0.0.0"]
