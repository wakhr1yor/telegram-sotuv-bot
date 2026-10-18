# 🚀 Telegram Sotuv va Buyurtma Manager Boti

Node.js va **Telegraf (v4)** kutubxonasida yaratilgan zamonaviy Telegram sotuv boti.
Ushbu bot xizmatlar va narxlarni mijozlarga tanishtiradi, buyurtmalarni bosqichma-bosqich qabul qiladi va barcha yangi buyurtmalarni administratorga real vaqt rejimida yuboradi.

---

## 📌 Botning asosiy imkoniyatlari

### 👤 Foydalanuvchilar (Mijozlar) uchun:
1. **Salomlashish (`/start`):**
   - Foydalanuvchi ismini aytib salomlashadi va asosiy bosh menyuni chiqaradi.
2. **💼 Xizmatlarimiz:**
   - Telegram bot yasash
   - Veb-sayt yasash
   - SMM xizmati
   - *Har bir xizmat bo'yicha alohida batafsil ma'lumot, narxi va to'g'ridan-to'g'ri buyurtma berish tugmasi.*
3. **💰 Narxlar:**
   - Telegram bot: 200 dollardan
   - Veb-sayt: 300 dollardan
   - SMM: oyiga 150 dollar
   - *Har bir narx yonida "Buyurtma berish" inline tugmasi mavjud.*
4. **📝 Buyurtma berish:**
   - Navbatma-navbat 4 bosqichda ma'lumot so'raydi:
     1. Ismingiz nima?
     2. Telefon raqamingiz? (matn yoki bitta tugma orqali kontakt ulashish)
     3. Qaysi xizmat kerak? (tugmalar orqali tanlash)
     4. Qo'shimcha izoh bormi? (o'tkazib yuborish imkoni bilan)
   - Buyurtma qabul qilingach tasdiq xabari beriladi va adminga darhol xabar boradi.
5. **📞 Bog'lanish:**
   - Telegram: `@wakhriyor1` (to'g'ridan-to'g'ri yozish havolasi bilan)
   - Telefon: `+998901234567`
   - Ish vaqti: `10:00 — 22:00`
6. **❓ Savollar (FAQ):**
   - Tayyor bo'lish muddati
   - To'lov tartibi (oldindan va keyin)
   - Kafolat va texnik qo'llab-quvvatlash haqida to'liq javoblar.

### 👑 Administrator uchun:
- **/admin buyrug'i:**
  - Faqat `.env` dagi `ADMIN_CHAT_ID` egasiga ruxsat beriladi.
  - Botni ishlatgan jami foydalanuvchilar soni.
  - Jami tushgan buyurtmalar soni.
  - So'nggi buyurtmalar ro'yxati (Mijoz ismi, telefoni, xizmati, izohi va vaqti).
  - Yangilash tugmasi orqali doimiy monitoring.
- **Yangi buyurtma xabarnomasi:**
  - Har bir yangi buyurtma tushganda bot adminga darhol xabar va mijoz bilan bog'lanish tugmasini yuboradi.

---

## 📂 Loyiha fayllari tuzilishi

```text
sotuv boti/
│
├── .env                  # Bot tokeni va admin ID saqlanadigan fayl (maxfiy)
├── .env.example          # Namuna sozlamalar fayli
├── database.js           # Foydalanuvchilar va buyurtmalarni boshqaruvchi modul
├── database.json         # Ma'lumotlar saqlanadigan JSON baza (avtomatik yaratiladi)
├── index.js              # Asosiy bot mantig'i va barcha buyruqlar
├── package.json          # Node.js loyiha ma'lumotlari va paketlar ro'yxati
└── README.md             # Qo'llanma va o'rnatish yo'riqnomasi
```

---

## 🛠️ Qanday qilib ishga tushirish kerak?

### 1-qadam: Bot Token olish
1. Telegramda [@BotFather](https://t.me/BotFather) botiga kiring.
2. `/newbot` buyrug'ini yuboring va ko'rsatmalarga asosan botingizga nom hamda username bering.
3. BotFather sizga **HTTP API token** beradi (masalan: `7123456789:AAH...`).

### 2-qadam: Admin Chat ID ni bilish
1. Telegramda [@userinfobot](https://t.me/userinfobot) botiga `/start` yuboring.
2. Bot sizga `Id: 123456789` kabi raqamli identifikatoringizni beradi. Bu sizning `ADMIN_CHAT_ID` ingiz.

### 3-qadam: `.env` faylini sozlash
Loyihadagi `.env` faylini oching va o'z ma'lumotlaringizni kiriting:

```env
BOT_TOKEN=bu_yerga_botfather_bergan_tokenni_yozing
ADMIN_CHAT_ID=bu_yerga_telegram_id_raqamingizni_yozing
```

### 4-qadam: Paketlarni o'rnatish
Agar paketlar o'rnatilmagan bo'lsa, terminalda loyiha papkasiga kiring va quyidagi buyruqni bajaring:

```bash
npm install
```

### 5-qadam: Botni ishga tushirish
Botni ishga tushirish uchun quyidagi buyruqlardan birini bering:

```bash
npm start
```
yoki:
```bash
node index.js
```

Konsolda quyidagi yozuv chiqsa, bot muvaffaqiyatli ishga tushgan bo'ladi:
```text
====================================================
🚀 Telegram Sotuv Manager Boti muvaffaqiyatli ishga tushdi!
📡 Bot xabarlarni kutmoqda...
====================================================
```

---

## 💡 Qo'shimcha sozlamalar va o'zgartirishlar

- **Xizmatlar yoki narxlarni o'zgartirish:**
  `index.js` faylini ochib, `💼 Xizmatlarimiz` va `💰 Narxlar` bo'limlaridagi matnlar hamda narxlarni istalgan vaqtda o'zgartirishingiz mumkin.
- **Kontaktlarni o'zgartirish:**
  `index.js` dagi `📞 Bog'lanish` bo'limida ko'rsatilgan `@wakhriyor1` va `+998901234567` raqamlarini o'zingiznikiga almashtirishingiz mumkin.
- **Ma'lumotlar bazasi:**
  Barcha buyurtmalar va foydalanuvchilar `database.json` faylida saqlanadi. Bot to'xtab qayta yonsa ham ma'lumotlar o'chib ketmaydi.

---

## ☁️ Railway.app platformasiga deploy qilish

Loyiha Railway.app da 24/7 rejimida bepul yoki arzon narxda ishlashga to'liq tayyorlangan (`Dockerfile`, `Procfile`, `railway.json`).

### 1-qadam: GitHub ga yuklash
Loyihani GitHub repositoriyingizga push qiling:
```bash
git init
git add .
git commit -m "Initial commit for Telegram sales bot"
git branch -M main
git remote add origin https://github.com/USERNAME/REPO_NAME.git
git push -u origin main
```

### 2-qadam: Railway.app da loyiha ochish
1. [Railway.app](https://railway.app) saytiga kiring va GitHub orqali ro'yxatdan o'ting / kiring.
2. **"New Project"** -> **"Deploy from GitHub repo"** ni tanlang.
3. Yangi yaratgan bot repositoriyangizni tanlang.

### 3-qadam: Muhit o'zgaruvchilarini (Variables) kiritish
Deploy bo'lishi bilan Railway da loyiha sozlamalariga kiring:
1. Loyihangiz ustiga bosing va **"Variables"** bo'limiga o'ting.
2. Quyidagi 2 ta o'zgaruvchini qo'shing:
   - `BOT_TOKEN` = `sizning_bot_tokeningiz`
   - `ADMIN_CHAT_ID` = `sizning_telegram_chat_id`
3. O'zgaruvchilarni saqlaganingizdan so'ng, Railway avtomatik ravishda botni qayta ishga tushiradi.

### 4-qadam: Tayyor!
Railway konsolida loglarni ko'rishingiz mumkin:
```text
🚀 Telegram Sotuv Manager Boti muvaffaqiyatli ishga tushdi!
📡 Bot xabarlarni kutmoqda...
```
Bot 24/7 serverda uzluksiz ishlaydi!

