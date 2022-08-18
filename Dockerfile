FROM klakegg/hugo:0.101.0-onbuild AS hugo

FROM nginx:1.21.3-alpine
COPY --from=hugo /target /usr/share/nginx/html