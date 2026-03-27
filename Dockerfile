# Node 18 yerine 20 kullanıyoruz
FROM node:20-alpine

RUN echo ">>> [1/7] Base image ready: node:20-alpine"

# Bağımlılıklar
RUN echo ">>> [2/7] Installing system dependencies (ffmpeg, python3, make, g++)..." && \
    apk add --no-cache ffmpeg ffmpeg-libs libass python3 make g++ && \
    echo ">>> [2/7] System dependencies installed." && \
    ffmpeg -version | head -n1 && \
    python3 --version

WORKDIR /app
RUN echo ">>> [3/7] Working directory set to /app"

COPY package*.json ./
COPY prisma ./prisma/
RUN echo ">>> [4/7] Installing npm dependencies..." && \
    npm install --legacy-peer-deps && \
    echo ">>> [4/7] npm install complete."

COPY . .
RUN echo ">>> [5/7] Source files copied. Directory contents:" && ls -la

# Build sırasında hata veren API key kontrolünü atlatmak veya sağlamak için
# Railway Variables kısmına anahtarları eklediysen bu adım geçecektir.
ENV NEXT_TELEMETRY_DISABLED=1
ENV OPENAI_API_KEY="temporary_key_for_build"

RUN echo ">>> [6/7] Starting Next.js build..." && \
    npm run build && \
    echo ">>> [6/7] Build complete."

EXPOSE 3000
ENV NODE_ENV=production

RUN echo ">>> [7/7] Container setup complete. Port 3000 exposed. NODE_ENV=production"

CMD echo ">>> [START] Running DB migrations..." && npx prisma migrate deploy && echo ">>> [START] Launching app..." && npm start