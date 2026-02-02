let buffer = [];
let timer = null;

const FLUSH_DELAY = 5000; // ⏳ 5 soniya (real)

async function flush() {
  if (!buffer.length) return;

  const message =
    `🚚 <b>OMBORGA DORI KELDI</b>\n\n` +
    buffer.join("\n-----------------\n") +
    `\n\n🕒 ${new Date().toLocaleString()}`;

  try {
    const { sendTelegram } = await import("./telegram.js");
    await sendTelegram(message);
  } catch (e) {
    console.error("TELEGRAM BATCH SEND ERROR:", e.message);
  } finally {
    buffer = [];
    timer = null;
  }
}

export function addToTelegramBatch(text) {
  buffer.push(text);

  // agar timer ishlayapti — yangisini qo‘ymaymiz
  if (timer) return;

  timer = setTimeout(flush, FLUSH_DELAY);
}

/* ===================== */
/* 🔒 SERVER O‘CHAYOTGANDA */
/* ===================== */
process.on("SIGTERM", flush);
process.on("SIGINT", flush);
