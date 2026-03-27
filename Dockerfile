# Node 18 yerine 20 kullanıyoruz
FROM node:20-alpine

# Bağımlılıklar
RUN apk add --no-cache ffmpeg python3 make g++

WORKDIR /app

COPY package*.json ./
# Alpine'da sorun yaşamamak için normal install
RUN npm install

COPY . .

# Build sırasında hata veren API key kontrolünü atlatmak veya sağlamak için
# Railway Variables kısmına anahtarları eklediysen bu adım geçecektir.
ENV NEXT_TELEMETRY_DISABLED 1

RUN npm run build

EXPOSE 3000
ENV NODE_ENV=production

CMD ["npm", "start"]