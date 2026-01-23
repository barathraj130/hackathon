FROM node:20

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .
# Generate prisma client
RUN npx prisma generate

CMD ["sh", "-c", "npx prisma db push && npm run dev"]
