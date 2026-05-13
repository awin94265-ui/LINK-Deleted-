import os
import asyncio
from aiogram import Bot, Dispatcher, types
from aiogram.filters import Command
from aiogram.types import Update

# --- CONFIGURATION ---
TOKEN = '8626207401:AAG7zf9ZwRgUQUrAcD8zvQNVVz4J_awsyBk'
OWNER_ID = 8258869818  # နစ်ဆ ရဲ့ ID

bot = Bot(token=TOKEN)
dp = Dispatcher()

# Owner ကို အမြဲတမ်း ချွင်းချက်ပေးထားမယ်
allowed_users = {OWNER_ID}

@dp.message(Command("start"))
async def start_cmd(message: types.Message):
    await message.reply("Link Protection Active! 🛡️\nLink ချသူများကို ချက်ချင်း Ban ပါမည်။")

@dp.message(Command("allow"))
async def allow_user(message: types.Message):
    if message.from_user.id != OWNER_ID:
        return
    if message.reply_to_message:
        target_id = message.reply_to_message.from_user.id
        allowed_users.add(target_id)
        await message.reply(f"✅ User {target_id} ကို ချွင်းချက်ပေးလိုက်ပါပြီ။")

@dp.message()
async def filter_and_ban(message: types.Message):
    # Owner နဲ့ ခွင့်ပြုထားသူဆိုရင် ကျော်သွားမယ်
    if message.from_user.id in allowed_users:
        return

    # စစ်ဆေးမည့် အချက်များ (Link, Mention, Username)
    has_link = any(entity.type in ["url", "text_link"] for entity in (message.entities or []))
    has_mention = any(entity.type in ["mention"] for entity in (message.entities or []))
    bad_words = ["t.me/", "http", "www.", ".com", "@"] # အကြမ်းစား စစ်ထုတ်ခြင်း

    is_bad = has_link or has_mention or any(word in (message.text or "").lower() for word in bad_words)

    if is_bad:
        try:
            # ၁။ စာကို အရင်ဖျက်မယ်
            await message.delete()
            # ၂။ လူကို Group ထဲက Ban မယ် (Kick)
            await bot.ban_chat_member(chat_id=message.chat.id, user_id=message.from_user.id)
            # ၃။ သတိပေးစာ ပို့မယ်
            warn = await message.answer(f"🚫 {message.from_user.first_name} ကို Link ချမှုဖြင့် Group မှ Ban လိုက်ပါပြီ။")
            await asyncio.sleep(5)
            await warn.delete()
        except Exception as e:
            print(f"Error: {e}")

# Vercel Handler
async def handler(request):
    if request.method == 'POST':
        data = await request.json()
        update = Update(**data)
        await dp.feed_update(bot, update)
        return {"statusCode": 200}
    return {"statusCode": 200, "body": "Link Ban Bot is Running"}
