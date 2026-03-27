FROM node:18-alpine

# Bağımlılıklar için gerekli sistem paketlerini kur
RUN apk add --no-cache ffmpeg python3 make g++

WORKDIR /app

# Sadece package dosyalarını kopyala ve kur (Cache dostu)
COPY package*.json ./
# Native modüllerin Alpine'da düzgün derlenmesi için:
RUN npm install

# Tüm dosyaları kopyala
COPY . .

# Next.js telemetry'yi kapat (Build'i hızlandırır ve logları temizler)
ENV NEXT_TELEMETRY_DISABLED 1

# Projeyi build et
RUN npm run build

EXPOSE 3000
ENV NODE_ENV=production

CMD ["npm", "start"]