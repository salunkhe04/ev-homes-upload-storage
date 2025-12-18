FROM node:24-alpine

# Create non-root user
RUN addgroup -S app && adduser -S app -G app

WORKDIR /app

COPY package*.json ./

RUN npm install

COPY . .

# Switch to non-root
USER app

EXPOSE 8082

CMD ["npm", "start"]
