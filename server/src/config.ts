import dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.resolve(__dirname, "../.env") });

export const SERVER_ENV = process.env.SERVER_ENV;
export const PORT = process.env.PORT;
export const MONGO_URI =
  SERVER_ENV === "dev" ? process.env.MONGO_URI_DEV : process.env.MONGO_URI;

