# Simple dev-server image. Good enough for the case study; for production
# you'd run `npm run build` and serve dist/ via nginx or similar.
FROM node:20-alpine

WORKDIR /app

# Install deps first (cache-friendly)
COPY package.json package-lock.json* ./
RUN npm install

# App source
COPY . .

EXPOSE 5173

CMD ["npm", "run", "dev"]
