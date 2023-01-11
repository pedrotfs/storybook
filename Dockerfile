FROM node:alpine

#app dir
WORKDIR /usr/app
COPY ./package.json ./
RUN npm install
COPY . .

EXPOSE 3001
CMD [ "npm", "run-script", "prod"]