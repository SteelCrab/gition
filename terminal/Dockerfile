FROM node:20-alpine

# Install build dependencies for node-pty
RUN apk add --no-cache python3 make g++ git bash

WORKDIR /app

COPY package*.json ./

RUN npm install

COPY . .

EXPOSE 3002

CMD ["npm", "start"]
