FROM node:16 as dev

COPY . /app
WORKDIR /app

RUN npm i

EXPOSE 3000

CMD ["npm", "run", "start"]

FROM dev as build

RUN npm run build

FROM node:alpine

RUN npm i -g serve

COPY --from=build /app/build /app/build
WORKDIR /app

EXPOSE 3000

CMD ["serve", "-s", "build"]

