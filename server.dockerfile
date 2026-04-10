FROM node:20-alpine

WORKDIR /app

COPY server/package.json server/package-lock.json* ./

RUN npm install

COPY server/ .

EXPOSE 3001

CMD ["npm", "start"]
