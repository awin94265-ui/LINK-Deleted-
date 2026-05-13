const { Telegraf } = require('telegraf');

// Bot Token နဲ့ Owner IDs (မင်း ID တွေ)
const bot = new Telegraf('8626207401:AAG7zf9ZwRgUQUrAcD8zvQNVVz4J_awsyBk');
const OWNERS = [8258869818]; 

bot.on('message', async (ctx) => {
    if (!ctx.message) return;

    const userId = ctx.from.id;
    const text = (ctx.message.text || ctx.message.caption || "").toLowerCase();
    
    // မင်း (Owner) ဆိုရင် ဘာမှမလုပ်ဘဲ ကျော်မယ်
    if (OWNERS.includes(userId)) return;

    // Link စစ်ဆေးခြင်း (https, t.me, .com, .net စသည်)
    const hasLink = ctx.message.entities && ctx.message.entities.some(e => 
        e.type === 'url' || e.type === 'text_link'
    );
    
    // @ mention စစ်ဆေးခြင်း
    const hasMention = ctx.message.entities && ctx.message.entities.some(e => e.type === 'mention');
    
    // စာသားထဲမှာ ပါဝင်နေတဲ့ Link ပုံစံများ
    const badPatterns = ["t.me/", "http", "www.", ".com", ".net", ".org", "share", "@"];
    const containsBadWord = badPatterns.some(word => text.includes(word));

    if (hasLink || hasMention || containsBadWord) {
        try {
            // ၁။ စာကို ချက်ချင်းဖျက်မယ်
            await ctx.deleteMessage();
            
            // ၂။ Group ထဲကပါ အပြီးအပိုင် Ban မယ်
            await ctx.banChatMember(userId);
            
            // ၃။ သတိပေးစာ ပို့မယ် (၅ စက္ကန့်နေရင် ပြန်ဖျက်မယ်)
            const msg = await ctx.reply(`🚫 @${ctx.from.username || ctx.from.first_name} ကို Link/Mention ချမှုဖြင့် Group မှ Ban လိုက်ပါပြီ။`);
            setTimeout(() => {
                ctx.deleteMessage(msg.message_id).catch(() => {});
            }, 5000);
        } catch (err) {
            console.error("Ban Error:", err);
        }
    }
});

// Vercel Handler
module.exports = async (req, res) => {
    if (req.method === 'POST') {
        try {
            await bot.handleUpdate(req.body);
            res.status(200).send('OK');
        } catch (err) {
            res.status(500).send('Error');
        }
    } else {
        res.status(200).send('Link Terminator is Running! 🛡️');
    }
};
