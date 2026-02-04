import "dotenv/config";
import { buildApp } from "./app.js";
import { seedAdminUser } from "./shared/database/seed.js";

async function main() {
  const app = await buildApp();

  // Seed admin user if needed
  await seedAdminUser();

  try {
    await app.listen({
      port: app.config.PORT,
      host: "0.0.0.0",
    });

    app.log.info(`Server listening on http://0.0.0.0:${app.config.PORT}`);
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
}

main();
