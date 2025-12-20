FROM node:24-alpine

# Install tzdata first
RUN apk add --no-cache tzdata \
    && cp /usr/share/zoneinfo/Asia/Kolkata /etc/localtime \
    && echo "Asia/Kolkata" > /etc/timezone \
    && apk del tzdata


# Create non-root user
RUN addgroup -S app && adduser -S app -G app

WORKDIR /app

# Copy package files first
COPY package*.json ./

# Install build tools, install dependencies, rebuild bcrypt, then remove build tools
RUN apk add --no-cache \
      make gcc g++ python3 python3-dev musl-dev linux-headers \
    && npm install \
    && npm rebuild bcrypt --build-from-source \
    && apk del make gcc g++ python3-dev musl-dev linux-headers

# Copy the rest of the app
COPY . .

# Make storage folder writable
RUN mkdir -p /app/storage && chown -R app:app /app/storage

# Set Node.js timezone
ENV TZ=Asia/Kolkata

# Switch to non-root user
USER app

EXPOSE 8084

CMD ["npm", "start"]