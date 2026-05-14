const { Telegraf } = require('telegraf');
const bot = new Telegraf('8626207401:AAG7zf9ZwRgUQUrAcD8zvQNVVz4J_awsyBk');

const OWNER_ID = 8258869818;
let ALLOWED_GROUPS = [-1003705277187, -1003794277894]; 
const violationMap = {}; 

bot.command('addgp', async (ctx) => {
    if (ctx.from.id !== OWNER_ID) return;
    const chatId = ctx.chat.id;
    if (!ALLOWED_GROUPS.includes(chatId)) {
        ALLOWED_GROUPS.push(chatId);
        await ctx.reply(`✅ ဒီ Group (${ctx.chat.title}) ကို ခွင့်ပြုလိုက်ပါပြီ!`);
    }
});

// ၁။ လူသစ်ဝင်ရင် နှုတ်ဆက်ခြင်း
bot.on('new_chat_members', async (ctx) => {
    if (!ALLOWED_GROUPS.includes(ctx.chat.id)) return;
    for (const member of ctx.message.new_chat_members) {
        const welcomeMsg = `🌿 ${ctx.chat.title} မိသားစုမှ နွေးထွေးစွာကြိုဆိုပါတယ်ရှင့် ${member.first_name} ပါရှင့် 🌿\n\nGroup အတွင်း Link ချခြင်းနှင့် Forward ပို့ခြင်း လုံးဝမပြုလုပ်ရပါရှင့်။`;
        try {
            await ctx.replyWithPhoto('https://raw.githubusercontent.com/awin94265-ui/LINK-Deleted-/main/1000030711.png', { caption: welcomeMsg });
        } catch (e) { await ctx.reply(welcomeMsg); }
    }
});

// ၂။ Link & Forward Terminator (Channel ချွင်းချက်ပါဝင်သည်)
bot.on(['message', 'edited_message'], async (ctx) => {
    if (!ctx.chat) return;
    const chatId = ctx.chat.id;
    
    // မင်းခွင့်ပြုထားတဲ့ Group မဟုတ်ရင် ဘာမှမလုပ်ဘူး
    if (!ALLOWED_GROUPS.includes(chatId)) return;

    const msg = ctx.message || ctx.edited_message;

    // --- Channel ကလာတဲ့စာဆိုရင် (သို့) မင်းပို့တဲ့စာဆိုရင် ဘာမှမလုပ်ဘဲ ကျော်သွားမယ် ---
    if (msg.is_automatic_forward || (ctx.from && ctx.from.id === OWNER_ID)) return;

    // --- Forward စစ်ဆေးခြင်း ---
    const isForwarded = msg.forward_from || msg.forward_from_chat || msg.forward_sender_name;
    
    // --- Link စစ်ဆေးခြင်း ---
    const text = (msg.text || msg.caption || "").toLowerCase();
    const entities = msg.entities || msg.caption_entities || [];
    const hasLink = entities.some(e => ['url', 'text_link', 'mention'].includes(e.type));
    const badPatterns = ["t.me/", "http", "www.", ".com", "@"];
    const containsBad = badPatterns.some(word => text.includes(word));

    if (isForwarded || hasLink || containsBad) {
        try {
            await ctx.deleteMessage();
            
            const userId = ctx.from.id;
            if (!violationMap[userId]) violationMap[userId] = 0;
            violationMap[userId]++;

            let reason = isForwarded ? "Forward ပို့မှု" : "Link ချမှု";

            if (violationMap[userId] === 1) {
                const until = Math.floor(Date.now() / 1000) + (15 * 60);
                await ctx.restrictChatMember(userId, { until_date: until });
                await ctx.reply(`⚠️ ${ctx.from.first_name}! ${reason}ကြောင့် ၁၅ မိနစ် စာပို့ခွင့် ပိတ်လိုက်ပါပြီ။`);
            } 
            else if (violationMap[userId] === 2) {
                const until = Math.floor(Date.now() / 1000) + (30 * 60);
                await ctx.restrictChatMember(userId, { until_date: until });
                await ctx.reply(`⚠️ ${ctx.from.first_name}! ဒုတိယအကြိမ် ${reason}ကြောင့် မိနစ် ၃၀ စာပို့ခွင့် ပိတ်လိုက်ပါပြီ။`);
            } 
            else {
                await ctx.banChatMember(userId);
                await ctx.reply(`🚫 ${ctx.from.first_name} ကို စည်းကမ်း ၃ ကြိမ်ဖောက်ဖျက်မှုဖြင့် အပြီးအပိုင် Ban လိုက်ပါပြီ!`);
                delete violationMap[userId];
            }
        } catch (e) { console.log("Error:", e.message); }
    }
});

module.exports = async (req, res) => {
    if (req.method === 'POST') {
        await bot.handleUpdate(req.body);
        res.status(200).send('OK');
    } else { res.status(200).send('Bot is Protecting! (Channel Safe Mode)'); }
};
