import { DatabaseSync } from "node:sqlite";
import { mkdirSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { config } from "../config.ts";

const here = dirname(fileURLToPath(import.meta.url));

function open(): DatabaseSync {
  const file = resolve(process.cwd(), config.databaseFile);
  mkdirSync(dirname(file), { recursive: true });
  const database = new DatabaseSync(file);
  database.exec("PRAGMA journal_mode = WAL;");
  database.exec("PRAGMA foreign_keys = ON;");
  database.exec(readFileSync(resolve(here, "schema.sql"), "utf8"));
  return database;
}

export const db = open();
