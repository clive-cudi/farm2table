"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.messagesChannel = exports.amqpConnect = void 0;
const callback_api_1 = __importDefault(require("amqplib/callback_api"));
function amqpConnect() {
    return new Promise((resolve, reject) => {
        callback_api_1.default.connect((err, connection) => {
            if (err) {
                console.error(err);
                reject(err);
                return;
            }
            resolve(connection);
            return;
        });
    });
}
exports.amqpConnect = amqpConnect;
const messagesChannel = () => {
    return new Promise((resolve, reject) => __awaiter(void 0, void 0, void 0, function* () {
        const connection = yield amqpConnect();
        connection.createChannel(function (err, channel) {
            if (err) {
                reject(err);
                return;
            }
            resolve(channel);
            return;
        });
    }));
};
exports.messagesChannel = messagesChannel;
