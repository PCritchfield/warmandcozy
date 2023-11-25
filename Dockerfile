# Use a build argument to determine the environment
ARG ENV=production

# Base image
FROM node:21 AS base
WORKDIR /app
COPY ./app/package*.json .
RUN npm install

# Development build
FROM base AS development
ENV NODE_ENV=development
CMD ["npm", "run", "dev"]

# Production build
FROM base AS production
ENV NODE_ENV=production
COPY ./app .
RUN npm run build
CMD ["npm", "start"]

# Final stage
FROM ${ENV} as final
