const { Telegraf } = require('telegraf');
const bot = new Telegraf('8626207401:AAG7zf9ZwRgUQUrAcD8zvQNVVz4J_awsyBk');

const OWNER_ID = 8258869818;
let ALLOWED_GROUPS = []; // Memory ထဲမှာ Group ID သိမ်းရန်
const violationMap = {}; // လူတစ်ဦးချင်းစီရဲ့ အမှားအရေအတွက် မှတ်ရန်

// --- ၁။ Group အသစ်ထည့်ရန် Command (/addgp) ---
bot.command('addgp', async (ctx) => {
    if (ctx.from.id !== OWNER_ID) {
        return ctx.reply("❌ မင်းက ငါ့ဆရာ မဟုတ်ဘူး! ဒီ Command ကို သုံးခွင့်မရှိဘူး။");
    }
    const chatId = ctx.chat.id;
    const chatTitle = ctx.chat.title || "Group";

    if (!ALLOWED_GROUPS.includes(chatId)) {
        ALLOWED_GROUPS.push(chatId);
        await ctx.reply(`✅ အောင်မြင်ပါပြီ! "${chatTitle}" ကို စောင့်ရှောက်ပေးပါ့မယ်။`);
    } else {
        await ctx.reply("ℹ️ ဒီ Group က Add ပြီးသားကြီးပါ။");
    }
});

// --- ၂။ လူသစ်ဝင်ရင် နှုတ်ဆက်ခြင်း ---
bot.on('new_chat_members', async (ctx) => {
    if (!ALLOWED_GROUPS.includes(ctx.chat.id)) return;
    for (const member of ctx.message.new_chat_members) {
        const welcomeMsg = `🌿 ${ctx.chat.title} မိသားစုမှ နွေးထွေးစွာကြိုဆိုပါတယ်ရှင့် ${member.first_name} မဂ်လာပါရှင့် 🌿\n\nGroup အတွင်း Link ချခြင်းနှင့် Forward ပို့ခြင်း လုံးဝမပြုလုပ်ရပါရှင့်။`;
        try {
            await ctx.replyWithPhoto('https://raw.githubusercontent.com/awin94265-ui/LINK-Deleted-/main/1000030711.png', { caption: welcomeMsg });
        } catch (e) { await ctx.reply(welcomeMsg); }
    }
});

// --- ၃။ Link & Forward Terminator (Violation Logic ပါဝင်သည်) ---
bot.on(['message', 'edited_message'], async (ctx) => {
    try {
        if (!ctx.chat || !ctx.from) return;
        const chatId = ctx.chat.id;
        const msg = ctx.message || ctx.edited_message;

        // ခွင့်ပြုထားတဲ့ Group မဟုတ်ရင် ကျော်မယ်
        if (!ALLOWED_GROUPS.includes(chatId)) return;

        // Admin (သို့) Owner ဆိုရင် ကျော်မယ်
        if (ctx.from.id === OWNER_ID) return;
        const member = await ctx.getChatMember(ctx.from.id);
        if (member.status === 'administrator' || member.status === 'creator') return;

        // Logic စစ်ဆေးခြင်း
        const isForwarded = msg.forward_from || msg.forward_from_chat || msg.forward_sender_name || msg.is_automatic_forward;
        const text = (msg.text || msg.caption || "").toLowerCase();
        const entities = msg.entities || msg.caption_entities || [];
        const hasLink = entities.some(e => ['url', 'text_link', 'mention'].includes(e.type));
        const badPatterns = ["t.me/", "http", "www.", ".com", "@"];
        const containsBad = badPatterns.some(word => text.includes(word));

        if (isForwarded || hasLink || containsBad) {
            await ctx.deleteMessage().catch(() => {});
            
            const userId = ctx.from.id;
            const firstName = ctx.from.first_name;
            if (!violationMap[userId]) violationMap[userId] = 0;
            violationMap[userId]++;

            let reason = isForwarded ? "Forward ပို့မှု" : "Link ချမှု";

            if (violationMap[userId] === 1) {
                // ၁ ကြိမ်မြောက် - ၁၅ မိနစ် ပိတ်မည်
                const until = Math.floor(Date.now() / 1000) + (15 * 60);
                await ctx.restrictChatMember(userId, { until_date: until }).catch(() => {});
                await ctx.reply(`⚠️ ${firstName}! ${reason}ကြောင့် ၁၅ မိနစ် စာပို့ခွင့် ပိတ်လိုက်ပါပြီ။`);
            } 
            else if (violationMap[userId] === 2) {
                // ၂ ကြိမ်မြောက် - မိနစ် ၃၀ ပိတ်မည်
                const until = Math.floor(Date.now() / 1000) + (30 * 60);
                await ctx.restrictChatMember(userId, { until_date: until }).catch(() => {});
                await ctx.reply(`⚠️ ${firstName}! ဒုတိယအကြိမ် ${reason}ကြောင့် မိနစ် ၃၀ စာပို့ခွင့် ပိတ်လိုက်ပါပြီ။`);
            } 
            else {
                // ၃ ကြိမ်မြောက် - Ban မည်
                await ctx.banChatMember(userId).catch(() => {});
                await ctx.reply(`🚫 ${firstName} ကို စည်းကမ်း ၃ ကြိမ်ဖောက်ဖျက်မှုဖြင့် အပြီးအပိုင် Ban လိုက်ပါပြီ!`);
                delete violationMap[userId];
            }
        }
    } catch (e) { console.log("Error:", e.message); }
});

module.exports = async (req, res) => {
    if (req.method === 'POST') {
        await bot.handleUpdate(req.body);
        res.status(200).send('OK');
    } else { res.status(200).send('Bot is Protecting with Violation Logic!'); }
};
