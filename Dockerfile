# Build Angular
FROM node:22 AS build

WORKDIR /app

COPY package*.json ./

RUN npm install

COPY . .

RUN npm run build

# Deploy to Nginx
FROM nginx:alpine

COPY --from=build /app/dist/family-life-frontend/browser/ /usr/share/nginx/html

# 把 Angular build 出來的檔案放進 nginx
# COPY dist/family-life-frontend/ /usr/share/nginx/html

# ⭐ 加上 SPA fallback（你缺的）
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
