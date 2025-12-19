FROM node:24-alpine

# Create non-root user
RUN addgroup -S app && adduser -S app -G app

WORKDIR /app

# Build bcrypt correctly
RUN apk add --no-cache \
      make gcc g++ python3 python3-dev musl-dev linux-headers \
    && npm install \
    && npm rebuild bcrypt --build-from-source \
    && apk del make gcc g++ python3-dev musl-dev linux-headers

COPY package*.json ./

RUN npm install

COPY . .

# Switch to non-root
USER app

EXPOSE 8084

CMD ["npm", "start"]
