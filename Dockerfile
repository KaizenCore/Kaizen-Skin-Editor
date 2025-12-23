# Build stage
FROM node:20-alpine AS build

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy source code
COPY . .

# Build args for environment variables
ARG VITE_KAIZEN_CLIENT_ID
ARG VITE_KAIZEN_BASE_URL=https://kaizencore.tech
ARG VITE_KAIZEN_REDIRECT_URI
ARG VITE_SKIN_API_URL=https://skin-api.kaizencore.tech/api/v1

# Set environment variables for build
ENV VITE_KAIZEN_CLIENT_ID=$VITE_KAIZEN_CLIENT_ID
ENV VITE_KAIZEN_BASE_URL=$VITE_KAIZEN_BASE_URL
ENV VITE_KAIZEN_REDIRECT_URI=$VITE_KAIZEN_REDIRECT_URI
ENV VITE_SKIN_API_URL=$VITE_SKIN_API_URL

# Build the app
RUN npm run build

# Production stage
FROM nginx:alpine

# Copy custom nginx config
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy built assets from build stage
COPY --from=build /app/dist /usr/share/nginx/html

# Expose port 80
EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
