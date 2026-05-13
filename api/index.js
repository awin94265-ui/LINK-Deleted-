const { Telegraf } = require('telegraf');
const bot = new Telegraf('8626207401:AAG7zf9ZwRgUQUrAcD8zvQNVVz4J_awsyBk');
const OWNER_ID = 8258869818;

bot.on('message', async (ctx) => {
    if (ctx.from.id === OWNER_ID) return;
    const entities = ctx.message.entities || [];
    const hasLink = entities.some(e => e.type === 'url' || e.type === 'text_link');
    const hasMention = entities.some(e => e.type === 'mention');
    const text = (ctx.message.text || "").toLowerCase();
    const badWords = ["t.me/", "http", "www.", ".com", "@"];
    if (hasLink || hasMention || badWords.some(w => text.includes(w))) {
        try {
            await ctx.deleteMessage();
            await ctx.banChatMember(ctx.from.id);
        } catch (e) { console.log(e); }
    }
});

module.exports = async (req, res) => {
    if (req.method === 'POST') {
        await bot.handleUpdate(req.body);
        res.status(200).send('OK');
    } else {
        res.status(200).send('Bot is running!');
    }
};
