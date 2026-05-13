const { Telegraf } = require('telegraf');
const bot = new Telegraf('8626207401:AAG7zf9ZwRgUQUrAcD8zvQNVVz4J_awsyBk');
const OWNERS = [8258869818, 8626207401];

bot.on(['message', 'edited_message'], async (ctx) => {
    if (!ctx.from || !ctx.chat) return;
    if (OWNERS.includes(ctx.from.id)) return;

    const msg = ctx.message || ctx.edited_message;
    const text = (msg.text || msg.caption || "").toLowerCase();
    const entities = msg.entities || msg.caption_entities || [];

    // ပိုမိုတိကျသော Link စစ်ဆေးခြင်း
    const hasLink = entities.some(e => ['url', 'text_link', 'mention'].includes(e.type));
    const badPatterns = ["t.me/", "http", "www.", ".com", ".net", ".org", "share", "@"];
    const containsBad = badPatterns.some(word => text.includes(word));

    if (hasLink || containsBad) {
        try {
            await ctx.deleteMessage();
            await ctx.banChatMember(ctx.from.id);
            const warn = await ctx.reply(`🚫 Link/Mention ချလို့ @${ctx.from.username || ctx.from.first_name} ကို အပြီးဘန်းလိုက်ပြီ!`);
            setTimeout(() => ctx.deleteMessage(warn.message_id).catch(() => {}), 3000);
        } catch (e) {
            console.log("Ban error:", e.message);
        }
    }
});

module.exports = async (req, res) => {
    if (req.method === 'POST') {
        await bot.handleUpdate(req.body);
        res.status(200).send('OK');
    } else {
        res.status(200).send('Bot Status: Online and Ready!');
    }
};
