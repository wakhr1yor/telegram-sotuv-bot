/**
 * ============================================================
 * DATABASE.JS - MA'LUMOTLAR BAZASI BOSHQARUVI
 * ============================================================
 * Ushbu modul bot foydalanuvchilari va tushgan buyurtmalarni
 * "database.json" faylida xavfsiz saqlash va boshqarish uchun xizmat qiladi.
 * Hech qanday murakkab tashqi baza (MySQL/PostgreSQL) talab qilinmaydi.
 */

const fs = require('fs');
const path = require('path');

// Ma'lumotlar bazasi faylining manzili (Railway Volume yoki lokal papka)
const DB_DIR = process.env.RAILWAY_VOLUME_MOUNT_PATH || process.env.DATA_DIR || __dirname;
const DB_PATH = path.join(DB_DIR, 'database.json');

/**
 * Bazani dastlabki holatda tekshirish va yaratish
 */
function initDB() {
  try {
    if (!fs.existsSync(DB_PATH)) {
      const initialData = {
        users: [],   // Botni ishga tushirgan foydalanuvchilar ro'yxati
        orders: []   // Qabul qilingan buyurtmalar ro'yxati
      };
      fs.writeFileSync(DB_PATH, JSON.stringify(initialData, null, 2), 'utf-8');
      console.log('✅ database.json fayli muvaffaqiyatli yaratildi.');
    }
  } catch (error) {
    console.error('❌ Bazani ishga tushirishda xatolik:', error.message);
  }
}

/**
 * Bazadan ma'lumotlarni o'qib olish
 */
function readDB() {
  try {
    initDB();
    const data = fs.readFileSync(DB_PATH, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    console.error('❌ Bazani o\'qishda xatolik:', error.message);
    return { users: [], orders: [] };
  }
}

/**
 * Ma'lumotlarni bazaga saqlash
 */
function writeDB(data) {
  try {
    fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2), 'utf-8');
  } catch (error) {
    console.error('❌ Bazaga yozishda xatolik:', error.message);
  }
}

/**
 * Yangi foydalanuvchini bazaga qo'shish yoki mavjudini yangilash
 * @param {Object} user - Telegram foydalanuvchi ma'lumotlari (id, first_name, username va h.k.)
 */
function saveUser(user) {
  const db = readDB();
  const existingIndex = db.users.findIndex((u) => u.id === user.id);

  const userData = {
    id: user.id,
    first_name: user.first_name || '',
    last_name: user.last_name || '',
    username: user.username ? `@${user.username}` : 'Mavjud emas',
    updatedAt: new Date().toISOString()
  };

  if (existingIndex !== -1) {
    // Agar foydalanuvchi oldin kirgan bo'lsa, ma'lumotlarini yangilaymiz
    db.users[existingIndex] = { ...db.users[existingIndex], ...userData };
  } else {
    // Yangi foydalanuvchi bo'lsa, ro'yxatga qo'shamiz
    userData.joinedAt = new Date().toISOString();
    db.users.push(userData);
  }

  writeDB(db);
}

/**
 * Yangi buyurtmani bazaga saqlash
 * @param {Object} orderData - Buyurtma ma'lumotlari (ism, telefon, xizmat, izoh va foydalanuvchi ID)
 * @returns {Object} Saqlangan buyurtma (tartib raqami bilan)
 */
function saveOrder(orderData) {
  const db = readDB();

  const newOrder = {
    orderId: db.orders.length + 1, // Buyurtma tartib raqami (#1, #2, ...)
    userId: orderData.userId,
    userName: orderData.userName,
    userTelegram: orderData.userTelegram || 'Mavjud emas',
    name: orderData.name,
    phone: orderData.phone,
    service: orderData.service,
    comment: orderData.comment || 'Izoh qoldirilmadi',
    createdAt: new Date().toLocaleString('uz-UZ', { timeZone: 'Asia/Tashkent' })
  };

  db.orders.push(newOrder);
  writeDB(db);

  return newOrder;
}

/**
 * Admin uchun statistika ma'lumotlarini olish
 * @returns {Object} { userCount: number, orderCount: number }
 */
function getStats() {
  const db = readDB();
  return {
    userCount: db.users.length,
    orderCount: db.orders.length
  };
}

/**
 * Oxirgi buyurtmalarni olish
 * @param {number} limit - Nechta oxirgi buyurtmani olish kerakligi
 */
function getLastOrders(limit = 5) {
  const db = readDB();
  return db.orders.slice(-limit).reverse();
}

// Funksiyalarni eksport qilamiz
module.exports = {
  initDB,
  saveUser,
  saveOrder,
  getStats,
  getLastOrders
};
