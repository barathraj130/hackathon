FROM node:20
EXPOSE 3000

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .
# Build-time variable for schema validation
RUN DATABASE_URL="postgresql://dummy:dummy@localhost:5432/dummy" npx prisma generate

CMD ["sh", "-c", "echo '🚀 Starting Application...'; npm run start"]
