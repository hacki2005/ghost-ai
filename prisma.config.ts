import "dotenv/config";
import { config as loadEnvFile } from "dotenv";
import { defineConfig } from "prisma/config";

loadEnvFile({ path: ".env.local" });
loadEnvFile({ path: "prisma/.env" });

console.log("DATABASE_URL loaded:", process.env["DATABASE_URL"]);

export default defineConfig({
  schema: "prisma/",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    url: process.env["DATABASE_URL"],
  },
});