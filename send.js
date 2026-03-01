const axios = require("axios");
const FormData = require("form-data");

async function sendToTelegram(token, chatId, buffer, caption) {
  const form = new FormData();
  form.append("chat_id", chatId);
  form.append("photo", buffer, { filename: "chart.png" });
  if (caption) form.append("caption", caption);

  await axios.post(
    `https://api.telegram.org/bot${token}/sendPhoto`,
    form,
    { headers: form.getHeaders() }
  );
}

module.exports = { sendToTelegram };
