const { Telegraf } = require('telegraf');
const bot = new Telegraf('8626207401:AAG7zf9ZwRgUQUrAcD8zvQNVVz4J_awsyBk');

const OWNER_ID = 8258869818;
// မင်းပေးထားတဲ့ Group ID နှစ်ခု ထည့်ထားပါတယ်
const ALLOWED_GROUPS = [-1003705277187, -1003794277894]; 
const violationMap = {}; 

// ၁။ လူသစ်ဝင်လာလျှင် ပုံနှင့်တကွ နှုတ်ဆက်ခြင်း
bot.on('new_chat_members', async (ctx) => {
    const chatId = ctx.chat.id;
    if (!ALLOWED_GROUPS.includes(chatId)) return ctx.leaveChat();

    for (const member of ctx.message.new_chat_members) {
        // ဝင်လာသူနာမည် နဲ့ Group နာမည်ကို Auto ယူမယ်
        const welcomeMsg = `🌿 ${ctx.chat.title} မိသားစုမှ နွေးထွေးစွာကြိုဆိုပါတယ် ${member.first_name} ရှင့် 🌿\n\nGroup အတွင်း Link ချမရပါ\nLink ချလျှင် Auto ဘန်းပါမည်။`;
        
        try {
            // မင်းပေးထားတဲ့ ကတ်ကြေးပုံကို သုံးထားပါတယ်
            await ctx.replyWithPhoto('https://raw.githubusercontent.com/awin94265-ui/LINK-Deleted-/main/1000030711.png', {
                caption: welcomeMsg
            });
        } catch (e) {
            await ctx.reply(welcomeMsg); // ပုံပို့မရရင် စာပဲပို့မယ်
        }
    }
});

// ၂။ Link Terminator Logic (၁၅ မိနစ်၊ နာရီဝက်၊ အပြီးဘန်း)
bot.on(['message', 'edited_message'], async (ctx) => {
    if (!ctx.from || !ctx.chat) return;
    const chatId = ctx.chat.id;
    const userId = ctx.from.id;

    if (!ALLOWED_GROUPS.includes(chatId) || userId === OWNER_ID) return;

    const msg = ctx.message || ctx.edited_message;
    const text = (msg.text || msg.caption || "").toLowerCase();
    const entities = msg.entities || msg.caption_entities || [];

    const hasLink = entities.some(e => ['url', 'text_link', 'mention'].includes(e.type));
    const badPatterns = ["t.me/", "http", "www.", ".com", "@"];
    const containsBad = badPatterns.some(word => text.includes(word));

    if (hasLink || containsBad) {
        try {
            await ctx.deleteMessage();
            if (!violationMap[userId]) violationMap[userId] = 0;
            violationMap[userId]++;

            if (violationMap[userId] === 1) {
                const until = Math.floor(Date.now() / 1000) + (15 * 60);
                await ctx.restrictChatMember(userId, { until_date: until });
                await ctx.reply(`⚠️ ${ctx.from.first_name}! ပထမအကြိမ် Link ချမှုကြောင့် ၁၅ မိနစ် စာပို့ခွင့် ပိတ်လိုက်ပြီ။`);
            } 
            else if (violationMap[userId] === 2) {
                const until = Math.floor(Date.now() / 1000) + (30 * 60);
                await ctx.restrictChatMember(userId, { until_date: until });
                await ctx.reply(`⚠️ ${ctx.from.first_name}! ဒုတိယအကြိမ် Link ချမှုကြောင့် မိနစ် ၃၀ စာပို့ခွင့် ပိတ်လိုက်ပြီ။`);
            } 
            else {
                await ctx.banChatMember(userId);
                await ctx.reply(`🚫 ${ctx.from.first_name} ကို Link ၃ ကြိမ်ချမှုဖြင့် Group မှ အပြီးအပိုင် Ban လိုက်ပြီ!`);
                delete violationMap[userId];
            }
        } catch (e) { console.log(e.message); }
    }
});

module.exports = async (req, res) => {
    if (req.method === 'POST') {
        await bot.handleUpdate(req.body);
        res.status(200).send('OK');
    } else {
        res.status(200).send('Bot is Protecting Multiple Groups! 🛡️');
    }
};
