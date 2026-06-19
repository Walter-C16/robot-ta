function getNumber(value, fallback) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

const config = {
  port: getNumber(process.env.PORT, 3001),
  baseUrl: process.env.BASE_URL || "http://localhost:3001",

  defaultTopWordsLimit: getNumber(process.env.DEFAULT_TOP_WORDS_LIMIT, 10),
  maxTopWordsLimit: getNumber(process.env.MAX_TOP_WORDS_LIMIT, 50),

  defaultLinksLimit: getNumber(process.env.DEFAULT_LINKS_LIMIT, 50),
  maxLinksLimit: getNumber(process.env.MAX_LINKS_LIMIT, 200),

  screenshotsDir: process.env.SCREENSHOTS_DIR || "./screenshots",
  logsDir: process.env.LOGS_DIR || "./logs",
  logFileName: process.env.LOG_FILE_NAME || "registro_bunker.txt"
};

module.exports = config;
