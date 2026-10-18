# Node.js ning yengil va xavfsiz rasmiy Alpine talqini
FROM node:20-alpine

# Ishchi papkani belgilaymiz
WORKDIR /app

# Bog'liqliklar fayllarini nusxalaymiz
COPY package*.json ./

# Faqat ishlab chiqarish (production) paketlarini o'rnatamiz
RUN npm install --production

# Qolgan barcha loyiha fayllarini nusxalaymiz
COPY . .

# Botni ishga tushirish buyrug'i
CMD ["npm", "start"]
