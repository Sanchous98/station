FROM node:16 as build

COPY . /app
WORKDIR /app

RUN npm i
RUN #git apply --whitespace=fix --reject /app/.patches/*.patch
RUN npm run build

EXPOSE 3000

FROM node:alpine

RUN npm i -g serve

COPY --from=build /app/build /app/build
WORKDIR /app

CMD ["serve", "-s", "build"]

