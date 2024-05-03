FROM node:16 as dev

COPY . /app
WORKDIR /app

RUN npm i

EXPOSE 3000

CMD ["npm", "run", "start"]

FROM dev as build

RUN npm run build

FROM nginx:alpine

COPY --from=build /app/build /usr/share/nginx/html

