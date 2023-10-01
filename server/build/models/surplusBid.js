"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SurplusBidSchema = exports.SurplusBid = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const Schema = mongoose_1.default.Schema;
const SurplusBidSchema = new Schema({
    sbid: {
        type: String,
        required: true,
    },
    source: {
        type: String,
        required: true,
    },
    amount: {
        type: Number,
        required: true,
    },
});
exports.SurplusBidSchema = SurplusBidSchema;
const SurplusBid = mongoose_1.default.model("surplus_bids", SurplusBidSchema);
exports.SurplusBid = SurplusBid;
