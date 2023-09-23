FROM node:16 as build

COPY . /app
WORKDIR /app

RUN npm i
RUN npm run build

FROM nginx:alpine

COPY .nginx/default.conf /etc/nginx/conf.d/default.conf
RUN echo 'include conf.d/default.conf;' >> /etc/nginx/conf.d/nginx.conf

COPY --from=build /app/build /app/build

CMD ["nginx", "-g", "daemon off;"]

