import telegram from "./telegram.js";

let queue = [];
let timer = null;

export const addToTelegramBatch = (text) => {
  if (!text) return;

  queue.push(text);

  if (!timer) {
    timer = setTimeout(async () => {
      const message = queue.join("\n\n");
      queue = [];
      timer = null;

      await telegram(message);
    }, 2000); // 2 soniyada bitta xabar
  }
};
