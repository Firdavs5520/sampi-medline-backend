import { sendTelegram } from "./sendTelegram.js";

let buffer = [];
let timer = null;

const FLUSH_DELAY = 1500; // 1.5 soniya ichida kelganlarni bitta qiladi

export function addToTelegramBatch(text) {
  buffer.push(text);

  // agar taymer allaqachon ishlayapti — qayta yoqmaymiz
  if (timer) return;

  timer = setTimeout(async () => {
    const message =
      "🚚 <b>Yangi dori yetkazib berildi</b>\n\n" +
      buffer.join("\n-----------------\n");

    buffer = [];
    timer = null;

    await sendTelegram(message);
  }, FLUSH_DELAY);
}
