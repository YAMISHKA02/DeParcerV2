# Используем официальный образ Node.js
FROM node:18-slim

# Устанавливаем рабочую директорию в контейнере
WORKDIR /usr/src/app

# Копируем package.json и package-lock.json (если есть)
COPY package*.json ./

# Устанавливаем зависимости
RUN npm install

# Копируем исходный код
COPY . .

# Открываем порт, на котором будет работать приложение
EXPOSE 443

# Запускаем приложение
CMD ["npm", "run", "parse"]
