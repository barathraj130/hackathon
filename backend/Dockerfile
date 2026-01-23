FROM node:20

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .
# Generate prisma client (Dummy URL for build-time validation)
RUN DATABASE_URL="postgresql://dummy:dummy@localhost:5432/dummy" npx prisma generate

CMD ["sh", "-c", "npx prisma db push && npm run dev"]
