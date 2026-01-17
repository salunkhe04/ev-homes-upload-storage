FROM node:20-bookworm

# ----------------------------
# Timezone (Linux + Node)
# ----------------------------
ENV TZ=Asia/Kolkata

RUN apt-get update \
    && apt-get install -y --no-install-recommends tzdata \
    && ln -snf /usr/share/zoneinfo/Asia/Kolkata /etc/localtime \
    && echo "Asia/Kolkata" > /etc/timezone \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# ----------------------------
# Non-root user
# ----------------------------
RUN groupadd -r app && useradd -r -g app app

WORKDIR /app

# ----------------------------
# Dependencies
# ----------------------------
COPY package*.json ./
RUN npm ci --only=production

# ----------------------------
# App source
# ----------------------------
COPY . .

# ----------------------------
# Storage
# ----------------------------
RUN mkdir -p /app/storage \
    && chown -R app:app /app

# ----------------------------
# Runtime limits
# ----------------------------
ENV NODE_OPTIONS="--max-old-space-size=1800"

USER app

EXPOSE 8082

# ----------------------------
# Start Node directly
# ----------------------------
CMD ["node", "src/server.js"]