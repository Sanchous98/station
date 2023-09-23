FROM node:16

RUN npm i -g serve

COPY . /app
WORKDIR /app

RUN npm i
RUN npm run build

EXPOSE 3000

CMD ["serve", "-s", "build"]

