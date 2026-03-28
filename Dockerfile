FROM node:20-alpine

# Runtime + build tools (build tools removed after install)
RUN apk add --no-cache ffmpeg ffmpeg-libs libass openssl ttf-dejavu fontconfig python3 make g++ && \
    fc-cache -f

WORKDIR /app

COPY package*.json ./
COPY prisma ./prisma/

# Install, clean cache, remove build tools — all in one layer
RUN npm install --legacy-peer-deps && \
    npm cache clean --force && \
    apk del python3 make g++

COPY . .

ENV NEXT_TELEMETRY_DISABLED=1
ENV OPENAI_API_KEY="temporary_key_for_build"

RUN npm run build && \
    rm -rf .next/cache

EXPOSE 3000
ENV NODE_ENV=production

CMD echo ">>> Running DB migrations..." && \
    npx prisma migrate deploy && \
    echo ">>> Starting app..." && \
    npm start
