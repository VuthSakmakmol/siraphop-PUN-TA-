const axios = require('axios');

const TELEGRAM_BOT_TOKEN = '7853434898:AAGVDQeN-9gJRbQAmn6nxsyeMGXJwG1FL7U';
const TELEGRAM_CHAT_ID = '7163451169';

const sendTelegramMessage = async (message) => {
  const url = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`;

  try {
    await axios.post(url, {
      chat_id: TELEGRAM_CHAT_ID,
      text: message,
      parse_mode: 'Markdown'
    });
  } catch (err) {
    console.error('Telegram Error:', err.message);
  }
};

module.exports = { sendTelegramMessage };
