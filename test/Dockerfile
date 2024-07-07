FROM node:lts-bullseye-slim

RUN apt-get -y update && \
  apt-get install wget sudo curl gnupg2 lsb-release -y && \
  sh -c 'echo "deb http://apt.postgresql.org/pub/repos/apt $(lsb_release -cs)-pgdg main" > /etc/apt/sources.list.d/pgdg.list' && \
  wget --quiet -O - https://www.postgresql.org/media/keys/ACCC4CF8.asc | sudo apt-key add - && \
  apt-get -y update && \
  apt-get install -y --no-install-recommends \
  python3 \
  libpq-dev \
  g++ \
  make \
  libc6-dev \
  git \
  ca-certificates \
  postgresql-15 \
  postgresql-contrib \
  postgresql-client \
  sudo && \
  rm -rf /var/lib/apt/lists/*

ENV MIGRATION_PATTERN "/albatross/migrations/*.sql"
ENV DATABASE_URL "postgresql://postgres:albatross@/albatross?sslmode=disable"
ENV DATABASE_NAME "albatross"
ENV USE_NATIVE_PG "false"
# ENV DEBUG "albatross*"

ENTRYPOINT ["/albatross/test-entrypoint.sh"]

WORKDIR /build

COPY . .

RUN yarn && yarn build

WORKDIR /albatross

COPY test/ .

CMD node /build/dist/index.js migrate ; node /build/dist/index.js types ; ls -la
