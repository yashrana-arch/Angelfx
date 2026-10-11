# ---------- Build the React app ----------
FROM docker.io/library/node:22-alpine AS build
WORKDIR /src
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
# The API URL is baked in at build time. Defaults to .env.production;
# override with: podman build --build-arg VITE_API_BASE_URL=https://api.example.com/api .
ARG VITE_API_BASE_URL
ENV VITE_API_BASE_URL=${VITE_API_BASE_URL}
RUN if [ -z "$VITE_API_BASE_URL" ]; then unset VITE_API_BASE_URL; fi && npm run build

# ---------- Serve the static files ----------
# Unprivileged nginx runs as non-root and listens on 8080 (works with rootless Podman).
FROM docker.io/nginxinc/nginx-unprivileged:1.27-alpine
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /src/dist /usr/share/nginx/html
EXPOSE 8080
