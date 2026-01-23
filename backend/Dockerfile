FROM node:20

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .
# Build-time variable for schema validation
RUN DATABASE_URL="postgresql://dummy:dummy@localhost:5432/dummy" npx prisma generate

CMD ["sh", "-c", "if [ \"$DATABASE_URL\" = \"\" ]; then echo 'ERROR: DATABASE_URL not set in Railway variables'; exit 1; fi && npx prisma db push && npm run dev"]
