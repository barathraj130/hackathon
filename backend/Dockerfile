FROM node:20


WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .
# Build-time variable for schema validation
RUN DATABASE_URL="postgresql://dummy:dummy@localhost:5432/dummy" npx prisma generate

CMD ["node", "server.js"]
