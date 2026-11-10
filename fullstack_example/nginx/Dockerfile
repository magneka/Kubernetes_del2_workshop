# syntax=docker/dockerfile:1
# Build context: repo root
# Static output is arch-independent, so build on the native platform.
FROM --platform=$BUILDPLATFORM node:22-alpine AS build
WORKDIR /web
COPY web/package*.json ./
RUN npm ci || npm install
COPY web/ .
RUN npm run build

FROM nginx:1.27-alpine
COPY nginx/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /web/dist /usr/share/nginx/html
