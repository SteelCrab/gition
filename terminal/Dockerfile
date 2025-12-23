FROM node:20-alpine

# Install build dependencies for node-pty
RUN apk add --no-cache python3 make g++ git bash

WORKDIR /app

# Set ownership to node user
RUN chown -R node:node /app

COPY --chown=node:node package*.json ./

RUN npm install

COPY --chown=node:node . .

USER node

EXPOSE 3002

CMD ["npm", "start"]
