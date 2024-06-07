FROM node:18
WORKDIR /usr/src/graphql
COPY package*.json ./
RUN npm install
COPY . .
EXPOSE 4000
CMD ["npm", "start"]
