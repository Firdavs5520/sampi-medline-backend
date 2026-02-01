let buffer = [];
let timer = null;

export function addToTelegramBatch(text) {
  buffer.push(text);

  if (timer) return;

  timer = setTimeout(async () => {
    const message =
      `🚚 <b>OMBORGA DORI KELDI</b>\n\n` +
      buffer.join("\n") +
      `\n\n🕒 ${new Date().toLocaleString()}`;

    const { sendTelegram } = await import("./telegram.js");
    await sendTelegram(message);

    // tozalash
    buffer = [];
    timer = null;
  }, 5000); // ⏳ 5 soniya
}
