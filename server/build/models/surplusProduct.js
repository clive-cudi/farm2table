"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.surplusProductSchema = exports.SurplusProduct = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const Schema = mongoose_1.default.Schema;
const surplusProductSchema = new Schema({
    owner: {
        type: String,
        required: true,
    },
    spid: {
        type: String,
        required: true,
    },
    name: {
        type: String,
        required: true,
    },
    description: {
        type: String,
        required: true,
    },
    q_variant: {
        type: String,
        required: true,
    },
    quantity: {
        type: Number,
        required: true,
        default: 0,
    },
    category: {
        type: String,
        required: true,
    },
    isBiddable: {
        type: Boolean,
        required: true
    },
    bids: [],
}, {
    timestamps: true,
});
exports.surplusProductSchema = surplusProductSchema;
const SurplusProduct = mongoose_1.default.model("surplus_products", surplusProductSchema);
exports.SurplusProduct = SurplusProduct;
