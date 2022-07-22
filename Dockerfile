FROM node:16 AS builder
WORKDIR /app
COPY . .
RUN npm install
RUN npm run build

FROM nginx
EXPOSE 80
COPY ./nginx.conf /etc/nginx/nginx.conf 
COPY --from=builder /app/dist /app/dist