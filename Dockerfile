FROM node:18-alpine

RUN apk add --no-cache ffmpeg python3 make g++

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .
RUN npm run build

EXPOSE 3000
ENV NODE_ENV=production

CMD ["npm", "start"]
