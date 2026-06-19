const { createApp } = require("./app");
const config = require("./config");

const app = createApp();
const { browserManager, loggingService } = app.locals.dependencies;

const server = app.listen(config.port, async () => {
  console.log(`Robot API running on port ${config.port}`);
  await loggingService.logSystemStart({ port: config.port });
});

async function shutdown(signal) {
  console.log(`Received ${signal}. Shutting down...`);

  server.close(async () => {
    try {
      await browserManager.shutdown();
    } finally {
      process.exit(0);
    }
  });
}

process.on("SIGINT", () => shutdown("SIGINT"));
process.on("SIGTERM", () => shutdown("SIGTERM"));
