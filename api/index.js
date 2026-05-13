const { Telegraf } = require('telegraf');
const bot = new Telegraf('8626207401:AAG7zf9ZwRgUQUrAcD8zvQNVVz4J_awsyBk');
const OWNERS = [8258869818, 8626207401];

bot.on(['message', 'edited_message'], async (ctx) => {
    if (!ctx.from || !ctx.chat) return;
    
    const userId = ctx.from.id;
    // မင်း (Owner) ဆိုရင် လွှတ်ပေးမယ်
    if (OWNERS.includes(userId)) return;

    const msg = ctx.message || ctx.edited_message;
    const text = (msg.text || msg.caption || "").toLowerCase();
    const entities = msg.entities || msg.caption_entities || [];

    // Link စစ်ဆေးခြင်း
    const hasLink = entities.some(e => e.type === 'url' || e.type === 'text_link' || e.type === 'mention');
    const badWords = ["t.me/", "http", "www.", ".com", "@"];
    const containsBad = badWords.some(w => text.includes(w));

    if (hasLink || containsBad) {
        try {
            // ၁။ စာဖျက်
            await ctx.deleteMessage();
            // ၂။ အပြီးဘန်း
            await ctx.banChatMember(userId);
            // ၃။ သတိပေးစာပို့
            const reply = await ctx.reply(`🚫 Link Terminator: @${ctx.from.username || ctx.from.first_name} ကို အပြီးအပိုင် Ban လိုက်ပြီ!`);
            setTimeout(() => ctx.deleteMessage(reply.message_id).catch(() => {}), 3000);
        } catch (e) {
            console.log("Error:", e.message);
        }
    }
});

module.exports = async (req, res) => {
    if (req.method === 'POST') {
        await bot.handleUpdate(req.body);
        res.status(200).send('OK');
    } else {
        res.status(200).send('Active!');
    }
};
