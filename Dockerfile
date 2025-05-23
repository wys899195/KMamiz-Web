FROM node:lts-alpine AS build
WORKDIR /kmamiz-web
COPY . .
RUN ["npm", "i"]
RUN ["npm", "run", "build"]

FROM node:lts-alpine
WORKDIR /kmamiz-web/dist
COPY --from=build /kmamiz-web/dist .