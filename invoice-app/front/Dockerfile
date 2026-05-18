# Simple dev-server image. For production you'd `npm run build` and serve
# the dist/ via nginx or similar.
FROM node:20-alpine

WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm install

COPY . .

EXPOSE 5174

CMD ["npm", "run", "dev"]
