"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MONGO_URI = exports.PORT = exports.SERVER_ENV = void 0;
const dotenv_1 = __importDefault(require("dotenv"));
const path_1 = __importDefault(require("path"));
dotenv_1.default.config({ path: path_1.default.resolve(__dirname, "../.env") });
exports.SERVER_ENV = process.env.SERVER_ENV;
exports.PORT = process.env.PORT;
exports.MONGO_URI = exports.SERVER_ENV === "dev" ? process.env.MONGO_URI_DEV : process.env.MONGO_URI;
