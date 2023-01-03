FROM node:17-bullseye-slim as build

WORKDIR /build

RUN apt-get update && apt-get install -y --no-install-recommends python3 build-essential postgresql libpq-dev

COPY . .

RUN yarn

FROM node:17-bullseye-slim

RUN apt-get update && apt-get install -y --no-install-recommends postgresql

WORKDIR /migrations

COPY --from=build /build/dist /albatross
COPY --from=build /build/node_modules /albatross/node_modules

WORKDIR /albatross

ENTRYPOINT ["node", "/albatross/albatross.js"]