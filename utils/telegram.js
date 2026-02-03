import sendTelegram from "./sendTelegram.js";

export default async function telegram(text) {
  try {
    await sendTelegram(text);
  } catch (e) {
    console.error("TELEGRAM SEND ERROR:", e);
  }
}
