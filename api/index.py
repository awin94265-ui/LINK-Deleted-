import os
import asyncio
from aiogram import Bot, Dispatcher, types
from aiogram.filters import Command
from aiogram.types import Update

TOKEN = '8626207401:AAG7zf9ZwRgUQUrAcD8zvQNVVz4J_awsyBk'
OWNER_ID = 8258869818 

bot = Bot(token=TOKEN)
dp = Dispatcher()

@dp.message(Command("start"))
async def start_cmd(message: types.Message):
    await message.reply("Link Protection Active! 🛡️")

@dp.message()
async def filter_and_ban(message: types.Message):
    # နစ်ဆ (Owner) ပို့တဲ့စာဆိုရင် ဘာမှမလုပ်ဘဲ ကျော်သွားမယ်
    if message.from_user.id == OWNER_ID:
        return

    # Link နဲ့ @ စစ်မယ်
    entities = message.entities or []
    has_link = any(e.type in ["url", "text_link"] for e in entities)
    has_mention = any(e.type in ["mention"] for e in entities)
    
    text = (message.text or "").lower()
    bad_words = ["t.me/", "http", "www.", ".com", "@"]
    is_bad = has_link or has_mention or any(word in text for word in bad_words)

    if is_bad:
        try:
            await message.delete()
            await bot.ban_chat_member(chat_id=message.chat.id, user_id=message.from_user.id)
            warn = await message.answer(f"🚫 Link ချလို့ {message.from_user.first_name} ကို Ban လိုက်ပြီ!")
            await asyncio.sleep(5)
            await warn.delete()
        except:
            pass

async def handler(request):
    # Vercel request ကို handle လုပ်တဲ့ အပိုင်း
    if request.method == 'POST':
        try:
            data = await request.json()
            update = Update(**data)
            await dp.feed_update(bot, update)
        except Exception as e:
            print(f"Update Error: {e}")
    return {"statusCode": 200, "body": "ok"}
