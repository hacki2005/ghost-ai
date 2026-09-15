import { config as loadEnvFile } from "dotenv";
import { defineConfig } from "prisma/config";

loadEnvFile({ path: ".env" });
loadEnvFile({ path: ".env.local", override: true });
loadEnvFile({ path: "prisma/.env" });

export default defineConfig({
  schema: "prisma/",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    url: process.env["DATABASE_URL"],
  },
});
