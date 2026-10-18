/**
 * ====================================================================
 * TELEGRAM SOTUV VA BUYURTMA MANAGER BOTI
 * ====================================================================
 * Texnologiyalar: Node.js, Telegraf (v4)
 * Vazifasi: Mijozlarga xizmatlar va narxlarni tanishtirish,
 * buyurtmalarni bosqichma-bosqich qabul qilish va adminga yetkazish.
 * ====================================================================
 */

// Tashqi kutubxonalarni chaqirib olamiz
require('dotenv').config(); // .env faylidagi o'zgaruvchilarni yuklash
const { Telegraf, Markup, Scenes, session } = require('telegraf');
const db = require('./database'); // Ma'lumotlar bazasi moduli

// 1. Sozlamalar va muhit o'zgaruvchilarini tekshiramiz
const BOT_TOKEN = process.env.BOT_TOKEN;
const ADMIN_CHAT_ID = process.env.ADMIN_CHAT_ID;

if (!BOT_TOKEN || BOT_TOKEN === 'YOUR_BOT_TOKEN_HERE') {
  console.error('\n❌ XATOLIK: BOT_TOKEN ko\'rsatilmagan!');
  console.error('👉 Iltimos, .env faylini oching va Telegram @BotFather dan olingan bot tokeningizni kiriting.\n');
  process.exit(1);
}

// Bot obyektini yaratamiz
const bot = new Telegraf(BOT_TOKEN);

// Dastlab ma'lumotlar bazasini tekshirib, ishga tushiramiz
db.initDB();

/**
 * ====================================================================
 * MENYULAR VA KLAVIATURALAR
 * ====================================================================
 */

// Asosiy bosh menyu klaviaturasi (har doim pastda turadi)
const mainMenu = Markup.keyboard([
  ['💼 Xizmatlarimiz', '💰 Narxlar'],
  ['📝 Buyurtma berish'],
  ['📞 Bog\'lanish', '❓ Savollar']
]).resize();

// Buyurtma berish jarayonini bekor qilish tugmasi
const cancelKeyboard = Markup.keyboard([
  ['❌ Bekor qilish']
]).resize();

// Telefon raqamni yuborish klaviaturasi (Contact share yoki matn)
const phoneKeyboard = Markup.keyboard([
  [Markup.button.contactRequest('📱 Telefon raqamni yuborish')],
  ['❌ Bekor qilish']
]).resize();

// Xizmat turini tanlash klaviaturasi
const serviceKeyboard = Markup.keyboard([
  ['🤖 Telegram bot yasash', '🌐 Veb-sayt yasash'],
  ['📱 SMM xizmati', '💡 Boshqa xizmat'],
  ['❌ Bekor qilish']
]).resize();

// Izoh bosqichidagi klaviatura (o'tkazib yuborish imkoni bilan)
const commentKeyboard = Markup.keyboard([
  ['⏭️ O\'tkazib yuborish'],
  ['❌ Bekor qilish']
]).resize();

/**
 * ====================================================================
 * BUYURTMA QABUL QILISH SAHNASI (WIZARD SCENE)
 * ====================================================================
 * Mijozdan navbatma-navbat ma'lumotlarni so'rab oladi:
 * 1. Ism
 * 2. Telefon raqami
 * 3. Xizmat turi
 * 4. Qo'shimcha izoh
 */
const orderWizard = new Scenes.WizardScene(
  'ORDER_WIZARD',

  // 1-QADAM: Ismni so'rash
  async (ctx) => {
    // Agar oldindan biror xizmat tanlangan bo'lsa (masalan narxlar bo'limidan), uni saqlaymiz
    if (!ctx.scene.session.orderData) {
      ctx.scene.session.orderData = {};
    }

    await ctx.reply(
      '📝 <b>Buyurtma berish bosqichi</b>\n\n' +
      'Iltimos, to\'liq ismingizni kiriting:\n' +
      '<i>(Jarayonni to\'xtatish uchun istalgan vaqtda "❌ Bekor qilish" tugmasini bosing)</i>',
      { parse_mode: 'HTML', ...cancelKeyboard }
    );
    return ctx.wizard.next();
  },

  // 2-QADAM: Ismni qabul qilish va Telefon raqamini so'rash
  async (ctx) => {
    // Bekor qilish tugmasi tekshiruvi
    if (ctx.message?.text === '❌ Bekor qilish') {
      await ctx.reply('❌ Buyurtma berish bekor qilindi.', mainMenu);
      return ctx.scene.leave();
    }

    if (!ctx.message?.text) {
      await ctx.reply('Iltimos, ismingizni matn ko\'rinishida yozing:');
      return;
    }

    ctx.scene.session.orderData.name = ctx.message.text.trim();

    await ctx.reply(
      `Rahmat, <b>${ctx.scene.session.orderData.name}</b>!\n\n` +
      'Endi telefon raqamingizni kiriting yoki quyidagi <b>"📱 Telefon raqamni yuborish"</b> tugmasini bosing:\n' +
      '<i>(Masalan: +998901234567)</i>',
      { parse_mode: 'HTML', ...phoneKeyboard }
    );
    return ctx.wizard.next();
  },

  // 3-QADAM: Telefon raqamini qabul qilish va Xizmat turini so'rash
  async (ctx) => {
    if (ctx.message?.text === '❌ Bekor qilish') {
      await ctx.reply('❌ Buyurtma berish bekor qilindi.', mainMenu);
      return ctx.scene.leave();
    }

    let phone = '';
    if (ctx.message?.contact) {
      phone = ctx.message.contact.phone_number;
      if (!phone.startsWith('+')) {
        phone = '+' + phone;
      }
    } else if (ctx.message?.text) {
      phone = ctx.message.text.trim();
    } else {
      await ctx.reply('Iltimos, telefon raqamingizni yuboring yoki yozib qoldiring:');
      return;
    }

    ctx.scene.session.orderData.phone = phone;

    // Agar xizmat oldindan tanlanmagan bo'lsa, xizmatni tanlashni so'raymiz
    if (!ctx.scene.session.orderData.service) {
      await ctx.reply(
        'Qaysi xizmat turiga qiziqmoqdasiz? Quyidagilardan birini tanlang yoki yozing:',
        serviceKeyboard
      );
      return ctx.wizard.next();
    } else {
      // Agar xizmat oldindan tanlangan bo'lsa, to'g'ridan-to'g'ri izoh so'rashga o'tamiz
      await ctx.reply(
        `Tanlangan xizmat: <b>${ctx.scene.session.orderData.service}</b>\n\n` +
        'Loyiha bo\'yicha qo\'shimcha izoh yoki talablaringiz bormi?\n' +
        '<i>(Agar izoh bo\'lmasa, "⏭️ O\'tkazib yuborish" tugmasini bosing)</i>',
        { parse_mode: 'HTML', ...commentKeyboard }
      );
      ctx.wizard.selectStep(4);
      return;
    }
  },

  // 4-QADAM: Xizmat turini qabul qilish va Izoh so'rash
  async (ctx) => {
    if (ctx.message?.text === '❌ Bekor qilish') {
      await ctx.reply('❌ Buyurtma berish bekor qilindi.', mainMenu);
      return ctx.scene.leave();
    }

    if (!ctx.message?.text) {
      await ctx.reply('Iltimos, xizmat turini tugmalardan birini tanlang yoki yozing:');
      return;
    }

    ctx.scene.session.orderData.service = ctx.message.text.trim();

    await ctx.reply(
      'Loyiha bo\'yicha qo\'shimcha izoh yoki talablaringiz bormi?\n' +
      '<i>(Agar izoh bo\'lmasa, "⏭️ O\'tkazib yuborish" tugmasini bosing)</i>',
      { parse_mode: 'HTML', ...commentKeyboard }
    );
    return ctx.wizard.next();
  },

  // 5-QADAM: Izohni qabul qilish, Buyurtmani yakunlash va Adminga yuborish
  async (ctx) => {
    if (ctx.message?.text === '❌ Bekor qilish') {
      await ctx.reply('❌ Buyurtma berish bekor qilindi.', mainMenu);
      return ctx.scene.leave();
    }

    let comment = 'Izoh qoldirilmadi';
    if (ctx.message?.text && ctx.message.text !== '⏭️ O\'tkazib yuborish') {
      comment = ctx.message.text.trim();
    }
    ctx.scene.session.orderData.comment = comment;

    const data = ctx.scene.session.orderData;
    const userId = ctx.from.id;
    const userName = ctx.from.first_name || 'Noma\'lum';
    const userTelegram = ctx.from.username ? `@${ctx.from.username}` : 'Mavjud emas';

    // 1. Ma'lumotlar bazasiga buyurtmani saqlaymiz
    const savedOrder = db.saveOrder({
      userId: userId,
      userName: userName,
      userTelegram: userTelegram,
      name: data.name,
      phone: data.phone,
      service: data.service,
      comment: data.comment
    });

    // 2. Foydalanuvchiga muvaffaqiyat xabari
    await ctx.reply(
      '✅ <b>Buyurtmangiz qabul qilindi! Tez orada aloqaga chiqamiz.</b>\n\n' +
      `📌 <b>Buyurtma raqami:</b> #${savedOrder.orderId}\n` +
      `👤 <b>Ism:</b> ${data.name}\n` +
      `📞 <b>Telefon:</b> ${data.phone}\n` +
      `💼 <b>Xizmat:</b> ${data.service}\n` +
      `💬 <b>Izoh:</b> ${data.comment}\n\n` +
      'E\'tiboringiz va ishonchingiz uchun rahmat!',
      { parse_mode: 'HTML', ...mainMenu }
    );

    // 3. Adminga Telegramda xabarnoma yuborish
    if (ADMIN_CHAT_ID && ADMIN_CHAT_ID !== 'YOUR_ADMIN_CHAT_ID_HERE') {
      const adminMessage =
        '🔔 <b>YANGI BUYURTMA KELIB TUSHDI!</b>\n' +
        '━━━━━━━━━━━━━━━━━━━━━━\n' +
        `🆔 <b>Buyurtma ID:</b> #${savedOrder.orderId}\n` +
        `👤 <b>Mijoz ismi:</b> ${data.name}\n` +
        `📞 <b>Telefon:</b> <code>${data.phone}</code>\n` +
        `💼 <b>Xizmat:</b> ${data.service}\n` +
        `💬 <b>Izoh:</b> ${data.comment}\n` +
        '━━━━━━━━━━━━━━━━━━━━━━\n' +
        `📱 <b>Telegram profili:</b> ${userTelegram}\n` +
        `🆔 <b>Telegram ID:</b> <code>${userId}</code>\n` +
        `📅 <b>Vaqti:</b> ${savedOrder.createdAt}`;

      try {
        await bot.telegram.sendMessage(ADMIN_CHAT_ID, adminMessage, {
          parse_mode: 'HTML',
          reply_markup: {
            inline_keyboard: [
              [
                { text: '💬 Mijozga yozish', url: ctx.from.username ? `https://t.me/${ctx.from.username}` : `tg://user?id=${userId}` }
              ]
            ]
          }
        });
      } catch (err) {
        console.error('❌ Adminga xabar yuborishda xatolik yuz berdi:', err.message);
      }
    } else {
      console.warn('⚠️ Diqqat: ADMIN_CHAT_ID .env faylida to\'g\'ri sozlanmagan!');
    }

    // Sahna jarayonini tugatish
    return ctx.scene.leave();
  }
);

// Sahnani ro'yxatdan o'tkazamiz
const stage = new Scenes.Stage([orderWizard]);
bot.use(session());
bot.use(stage.middleware());

/**
 * ====================================================================
 * SALOMLASHISH VA /start BUYRUG'I
 * ====================================================================
 */
bot.start(async (ctx) => {
  // Foydalanuvchini ma'lumotlar bazasiga qayd etamiz (admin statistikasi uchun)
  db.saveUser(ctx.from);

  const firstName = ctx.from.first_name || 'Hurmatli mijoz';
  const welcomeMessage =
    `Assalomu alaykum, <b>${firstName}</b>! 👋\n\n` +
    'Bizning rasmiy sotuv botimizga xush kelibsiz!\n' +
    'Biznesingizni raqamlashtirish va savdolaringizni oshirish uchun zamonaviy IT va marketing xizmatlarini taqdim etamiz.\n\n' +
    'Kerakli bo\'limni tanlash uchun quyidagi menyu tugmalaridan foydalaning:';

  await ctx.reply(welcomeMessage, { parse_mode: 'HTML', ...mainMenu });
});

/**
 * ====================================================================
 * 1-TUGMA: "XIZMATLARIMIZ"
 * ====================================================================
 */
bot.hears('💼 Xizmatlarimiz', async (ctx) => {
  const text =
    '💼 <b>Bizning xizmatlarimiz:</b>\n\n' +
    'Biz sizga biznesingizni rivojlantirish uchun quyidagi xizmatlarni taklif qilamiz:\n\n' +
    '🤖 <b>Telegram bot yasash</b> — Sizning biznesingiz uchun bot yasab beramiz\n' +
    '🌐 <b>Veb-sayt yasash</b> — Zamonaviy veb-sayt yasab beramiz\n' +
    '📱 <b>SMM xizmati</b> — Ijtimoiy tarmoqlarni boshqaramiz\n\n' +
    '👇 <i>Batafsil ma\'lumot olish uchun quyidagi tugmalardan birini bosing:</i>';

  const servicesInline = Markup.inlineKeyboard([
    [Markup.button.callback('🤖 Telegram bot yasash', 'detail_bot')],
    [Markup.button.callback('🌐 Veb-sayt yasash', 'detail_web')],
    [Markup.button.callback('📱 SMM xizmati', 'detail_smm')]
  ]);

  await ctx.reply(text, { parse_mode: 'HTML', ...servicesInline });
});

// "Telegram bot yasash" bo'yicha batafsil ma'lumot
bot.action('detail_bot', async (ctx) => {
  await ctx.answerCbQuery();
  const text =
    '🤖 <b>Telegram bot yasash xizmati</b>\n\n' +
    '<b>Ta\'rifi:</b> Sizning biznesingiz uchun bot yasab beramiz.\n\n' +
    '<b>Imkoniyatlar va afzalliklar:</b>\n' +
    '• Mijozlarga avtomatik xizmat ko\'rsatish (24/7)\n' +
    '• Mahsulot va xizmatlar katalogi, savat va buyurtma tizimi\n' +
    '• To\'lov tizimlari (Click, Payme, Uzum) bilan integratsiya\n' +
    '• Qulay admin paneli va real vaqt statistikasi\n' +
    '• Xabarnomalar va mijozlar bazasini yuritish\n\n' +
    '💰 <b>Boshlang\'ich narxi:</b> 200 dollardan\n' +
    '⏱️ <b>Tayyor bo\'lish muddati:</b> 3 kundan 10 kungacha';

  const keyboard = Markup.inlineKeyboard([
    [Markup.button.callback('📝 Telegram botga buyurtma berish', 'order_service_bot')],
    [Markup.button.callback('⬅️ Xizmatlar ro\'yxatiga qaytish', 'back_to_services')]
  ]);

  await ctx.editMessageText(text, { parse_mode: 'HTML', ...keyboard });
});

// "Veb-sayt yasash" bo'yicha batafsil ma'lumot
bot.action('detail_web', async (ctx) => {
  await ctx.answerCbQuery();
  const text =
    '🌐 <b>Veb-sayt yasash xizmati</b>\n\n' +
    '<b>Ta\'rifi:</b> Zamonaviy veb-sayt yasab beramiz.\n\n' +
    '<b>Imkoniyatlar va afzalliklar:</b>\n' +
    '• Unikal va zamonaviy UI/UX dizayn\n' +
    '• Barcha qurilmalarga (telefon, planshet, kompyuter) to\'liq moslashuvchan (Responsive)\n' +
    '• Landing page (bir sahifali), korporativ saytlar yoki internet-do\'konlar\n' +
    '• Yuqori yuklanish tezligi va SEO optimizatsiyasi\n' +
    '• Qulay kontent boshqaruv paneli (Admin panel)\n\n' +
    '💰 <b>Boshlang\'ich narxi:</b> 300 dollardan\n' +
    '⏱️ <b>Tayyor bo\'lish muddati:</b> 7 kundan 14 kungacha';

  const keyboard = Markup.inlineKeyboard([
    [Markup.button.callback('📝 Veb-saytga buyurtma berish', 'order_service_web')],
    [Markup.button.callback('⬅️ Xizmatlar ro\'yxatiga qaytish', 'back_to_services')]
  ]);

  await ctx.editMessageText(text, { parse_mode: 'HTML', ...keyboard });
});

// "SMM xizmati" bo'yicha batafsil ma'lumot
bot.action('detail_smm', async (ctx) => {
  await ctx.answerCbQuery();
  const text =
    '📱 <b>SMM xizmati (Ijtimoiy tarmoqlarni boshqarish)</b>\n\n' +
    '<b>Ta\'rifi:</b> Ijtimoiy tarmoqlarni boshqaramiz.\n\n' +
    '<b>Imkoniyatlar va afzalliklar:</b>\n' +
    '• Instagram, Telegram va boshqa ijtimoiy sahifalarni professional yuritish\n' +
    '• Qiziqarli postlar, bannerlar va video roliklar (Reels/Stories) tayyorlash\n' +
    '• To\'g\'ri maqsadli auditoriyani topish va Target reklamasini sozlash\n' +
    '• Mijozlar oqimini ko\'paytirish va savdolarni oshirish\n' +
    '• Har oylik natijalar bo\'yicha tahliliy hisobot\n\n' +
    '💰 <b>Narxi:</b> oyiga 150 dollar';

  const keyboard = Markup.inlineKeyboard([
    [Markup.button.callback('📝 SMM xizmatiga buyurtma berish', 'order_service_smm')],
    [Markup.button.callback('⬅️ Xizmatlar ro\'yxatiga qaytish', 'back_to_services')]
  ]);

  await ctx.editMessageText(text, { parse_mode: 'HTML', ...keyboard });
});

// Xizmatlar ro'yxatiga qaytish amali
bot.action('back_to_services', async (ctx) => {
  await ctx.answerCbQuery();
  const text =
    '💼 <b>Bizning xizmatlarimiz:</b>\n\n' +
    'Biz sizga biznesingizni rivojlantirish uchun quyidagi xizmatlarni taklif qilamiz:\n\n' +
    '🤖 <b>Telegram bot yasash</b> — Sizning biznesingiz uchun bot yasab beramiz\n' +
    '🌐 <b>Veb-sayt yasash</b> — Zamonaviy veb-sayt yasab beramiz\n' +
    '📱 <b>SMM xizmati</b> — Ijtimoiy tarmoqlarni boshqaramiz\n\n' +
    '👇 <i>Batafsil ma\'lumot olish uchun quyidagi tugmalardan birini bosing:</i>';

  const servicesInline = Markup.inlineKeyboard([
    [Markup.button.callback('🤖 Telegram bot yasash', 'detail_bot')],
    [Markup.button.callback('🌐 Veb-sayt yasash', 'detail_web')],
    [Markup.button.callback('📱 SMM xizmati', 'detail_smm')]
  ]);

  await ctx.editMessageText(text, { parse_mode: 'HTML', ...servicesInline });
});

/**
 * ====================================================================
 * 2-TUGMA: "NARXLAR"
 * ====================================================================
 */
bot.hears('💰 Narxlar', async (ctx) => {
  const text =
    '💰 <b>Xizmatlarimiz narxlari bilan tanishing:</b>\n\n' +
    '🤖 <b>Telegram bot:</b> 200 dollardan\n' +
    '🌐 <b>Veb-sayt:</b> 300 dollardan\n' +
    '📱 <b>SMM:</b> oyiga 150 dollar\n\n' +
    '<i>Loyihangiz uchun mos xizmatni tanlang va darhol buyurtma bering:</i>';

  const pricesKeyboard = Markup.inlineKeyboard([
    [
      Markup.button.callback('🤖 Bot (200$ dan) — Buyurtma berish', 'order_service_bot')
    ],
    [
      Markup.button.callback('🌐 Sayt (300$ dan) — Buyurtma berish', 'order_service_web')
    ],
    [
      Markup.button.callback('📱 SMM (150$/oy) — Buyurtma berish', 'order_service_smm')
    ]
  ]);

  await ctx.reply(text, { parse_mode: 'HTML', ...pricesKeyboard });
});

// Narxlar yoki xizmat tafsilotlaridan to'g'ridan-to'g'ri buyurtmaga o'tish
bot.action('order_service_bot', async (ctx) => {
  await ctx.answerCbQuery();
  await ctx.scene.enter('ORDER_WIZARD', { service: 'Telegram bot yasash (200$ dan)' });
});

bot.action('order_service_web', async (ctx) => {
  await ctx.answerCbQuery();
  await ctx.scene.enter('ORDER_WIZARD', { service: 'Veb-sayt yasash (300$ dan)' });
});

bot.action('order_service_smm', async (ctx) => {
  await ctx.answerCbQuery();
  await ctx.scene.enter('ORDER_WIZARD', { service: 'SMM xizmati (150$/oy)' });
});

/**
 * ====================================================================
 * 3-TUGMA: "BUYURTMA BERISH" (Bosh menyudan)
 * ====================================================================
 */
bot.hears('📝 Buyurtma berish', async (ctx) => {
  await ctx.scene.enter('ORDER_WIZARD');
});

/**
 * ====================================================================
 * 4-TUGMA: "BOG'LANISH"
 * ====================================================================
 */
bot.hears('📞 Bog\'lanish', async (ctx) => {
  const contactText =
    '📞 <b>Biz bilan bog\'lanish ma\'lumotlari:</b>\n\n' +
    'Savollaringiz, takliflaringiz yoki alohida loyihangiz bo\'lsa, biz bilan quyidagi vositalar orqali bog\'lanishingiz mumkin:\n\n' +
    '• <b>Telegram:</b> @wakhriyor1\n' +
    '• <b>Telefon:</b> +998901234567\n' +
    '• <b>Ish vaqti:</b> 10:00 — 22:00\n\n' +
    'Menejerimiz sizning savollaringizga mamnuniyat bilan javob beradi!';

  const contactInline = Markup.inlineKeyboard([
    [Markup.button.url('💬 Telegram orqali yozish', 'https://t.me/wakhriyor1')],
    [Markup.button.callback('📝 Buyurtma qoldirish', 'enter_order_scene')]
  ]);

  await ctx.reply(contactText, { parse_mode: 'HTML', ...contactInline });
});

bot.action('enter_order_scene', async (ctx) => {
  await ctx.answerCbQuery();
  await ctx.scene.enter('ORDER_WIZARD');
});

/**
 * ====================================================================
 * 5-TUGMA: "SAVOLLAR" (FAQ)
 * ====================================================================
 */
bot.hears('❓ Savollar', async (ctx) => {
  const faqText =
    '❓ <b>Ko\'p beriladigan savollar va javoblar:</b>\n\n' +
    '1️⃣ <b>Qancha vaqtda tayyor bo\'ladi?</b>\n' +
    '👉 3 kundan 14 kungacha (loyihaning murakkabligiga qarab).\n\n' +
    '2️⃣ <b>To\'lov qanday?</b>\n' +
    '👉 Yarmi oldindan, yarmi keyin (loyiha to\'liq topshirilgach).\n\n' +
    '3️⃣ <b>Kafolat bormi?</b>\n' +
    '👉 Ha, 30 kun bepul tuzatamiz va texnik xizmat ko\'rsatamiz.\n\n' +
    'Qo\'shimcha savollaringiz bo\'lsa, bemalol biz bilan bog\'lanishingiz mumkin!';

  const faqInline = Markup.inlineKeyboard([
    [Markup.button.callback('📝 Buyurtma berish', 'enter_order_scene')],
    [Markup.button.url('💬 Savol berish (@wakhriyor1)', 'https://t.me/wakhriyor1')]
  ]);

  await ctx.reply(faqText, { parse_mode: 'HTML', ...faqInline });
});

/**
 * ====================================================================
 * ADMIN UCHUN: /admin BUYRUG'I VA STATISTIKA
 * ====================================================================
 * Bot ishlatganlar va buyurtmalar sonini ko'rsatadi.
 * Faqat ADMIN_CHAT_ID egasiga ruxsat beriladi.
 */
bot.command('admin', async (ctx) => {
  const userId = ctx.from.id.toString();

  // Admin tekshiruvi
  if (!ADMIN_CHAT_ID || userId !== ADMIN_CHAT_ID.toString()) {
    await ctx.reply('⛔ <b>Kechirasiz, ushbu buyruq faqat bot administratori uchun mo\'ljallangan.</b>', { parse_mode: 'HTML' });
    return;
  }

  const stats = db.getStats();
  const lastOrders = db.getLastOrders(5);

  let adminMessage =
    '👑 <b>ADMIN BOSHQARUV PANELI</b>\n' +
    '━━━━━━━━━━━━━━━━━━━━━━\n' +
    '📊 <b>Statistika:</b>\n' +
    `👥 <b>Bot ishlatganlar soni:</b> ${stats.userCount} ta\n` +
    `📦 <b>Jami buyurtmalar soni:</b> ${stats.orderCount} ta\n` +
    '━━━━━━━━━━━━━━━━━━━━━━\n\n';

  if (lastOrders.length === 0) {
    adminMessage += '<i>Hozircha hech qanday buyurtma tushmagan.</i>';
  } else {
    adminMessage += '📋 <b>Oxirgi buyurtmalar:</b>\n\n';
    lastOrders.forEach((o) => {
      adminMessage +=
        `🔹 <b>#${o.orderId}</b> — ${o.name} (${o.phone})\n` +
        `💼 Xizmat: ${o.service}\n` +
        `💬 Izoh: ${o.comment}\n` +
        `📅 Vaqt: ${o.createdAt}\n\n`;
    });
  }

  const adminKeyboard = Markup.inlineKeyboard([
    [Markup.button.callback('🔄 Statistikani yangilash', 'refresh_admin_stats')]
  ]);

  await ctx.reply(adminMessage, { parse_mode: 'HTML', ...adminKeyboard });
});

// Admin statistikasini yangilash tugmasi
bot.action('refresh_admin_stats', async (ctx) => {
  const userId = ctx.from.id.toString();
  if (!ADMIN_CHAT_ID || userId !== ADMIN_CHAT_ID.toString()) {
    await ctx.answerCbQuery('Ruxsat berilmagan!', { show_alert: true });
    return;
  }

  await ctx.answerCbQuery('Statistika yangilandi');

  const stats = db.getStats();
  const lastOrders = db.getLastOrders(5);

  let adminMessage =
    '👑 <b>ADMIN BOSHQARUV PANELI</b>\n' +
    '━━━━━━━━━━━━━━━━━━━━━━\n' +
    '📊 <b>Statistika:</b>\n' +
    `👥 <b>Bot ishlatganlar soni:</b> ${stats.userCount} ta\n` +
    `📦 <b>Jami buyurtmalar soni:</b> ${stats.orderCount} ta\n` +
    '━━━━━━━━━━━━━━━━━━━━━━\n\n';

  if (lastOrders.length === 0) {
    adminMessage += '<i>Hozircha hech qanday buyurtma tushmagan.</i>';
  } else {
    adminMessage += '📋 <b>Oxirgi buyurtmalar:</b>\n\n';
    lastOrders.forEach((o) => {
      adminMessage +=
        `🔹 <b>#${o.orderId}</b> — ${o.name} (${o.phone})\n` +
        `💼 Xizmat: ${o.service}\n` +
        `💬 Izoh: ${o.comment}\n` +
        `📅 Vaqt: ${o.createdAt}\n\n`;
    });
  }

  const adminKeyboard = Markup.inlineKeyboard([
    [Markup.button.callback('🔄 Statistikani yangilash', 'refresh_admin_stats')]
  ]);

  try {
    await ctx.editMessageText(adminMessage, { parse_mode: 'HTML', ...adminKeyboard });
  } catch (err) {
    // Agar xabar o'zgarmagan bo'lsa, xatolik chiqmasligi uchun
  }
});

/**
 * ====================================================================
 * NOTO'G'RI BUYRUQLAR VA BOSHQA XABARLARNI USHLASH
 * ====================================================================
 */
bot.on('text', async (ctx) => {
  await ctx.reply(
    'Kechirasiz, men bu buyruqni tushunmadim.\n' +
    'Iltimos, quyidagi menyu tugmalaridan birini tanlang:',
    mainMenu
  );
});

/**
 * ====================================================================
 * BOTNI ISHGA TUSHIRISH VA XATOLIKLARNI QAYD ETISH
 * ====================================================================
 */
bot.catch((err, ctx) => {
  console.error(`❌ Botda xatolik yuz berdi (${ctx.updateType}):`, err);
});

// Botni ishga tushiramiz (Long Polling rejimida)
bot.launch().then(() => {
  console.log('====================================================');
  console.log('🚀 Telegram Sotuv Manager Boti muvaffaqiyatli ishga tushdi!');
  console.log('📡 Bot xabarlarni kutmoqda...');
  console.log('====================================================');
}).catch((err) => {
  console.error('❌ Botni ishga tushirishda xatolik:', err.message);
});

// Dastur to'xtatilganda botni xavfsiz to'xtatish
process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));
