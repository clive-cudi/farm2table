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
exports.camelize = exports.writeToJSONFile = exports.isJsonString = exports.readFromJSONObjectFile = exports.withNewLines = void 0;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
function withNewLines(str, separator) {
    return str.split(separator !== null && separator !== void 0 ? separator : "~").join('\n');
}
exports.withNewLines = withNewLines;
function readFromJSONObjectFile(filePath) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const resolvedFilePath = path_1.default.resolve(__dirname, filePath);
            if (fs_1.default.existsSync(resolvedFilePath)) {
                // file exists
                // read the file
                return new Promise((resolve, reject) => {
                    if (path_1.default.extname(resolvedFilePath) !== ".json")
                        reject("File not a JSON file");
                    const rawJSONString = fs_1.default.readFileSync(resolvedFilePath);
                    resolve(rawJSONString.toString());
                });
            }
            else {
                return new Promise((resolve, reject) => {
                    resolve("");
                });
            }
        }
        catch (err) {
            throw err;
        }
    });
}
exports.readFromJSONObjectFile = readFromJSONObjectFile;
function isJsonString(str) {
    try {
        const o = JSON.parse(str);
        // Handle non-exception-throwing cases:
        // Neither JSON.parse(false) or JSON.parse(1234) throw errors, hence the type-checking,
        // but... JSON.parse(null) returns null, and typeof null === "object", 
        // so we must check for that, too. Thankfully, null is falsey, so this suffices:
        if (o && typeof o === "object") {
            return true;
        }
    }
    catch (e) { }
    return false;
}
exports.isJsonString = isJsonString;
function writeToJSONFile(filePath, data, resolve) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            console.log('WRITING');
            console.log(data);
            const resolvedFilePath = resolve ? path_1.default.resolve(__dirname, filePath) : filePath;
            return new Promise((resolve, reject) => {
                fs_1.default.writeFileSync(resolvedFilePath, JSON.stringify(data, null, 4));
                resolve(true);
            });
        }
        catch (err) {
            throw err;
        }
    });
}
exports.writeToJSONFile = writeToJSONFile;
function camelize(str) {
    return str.replace(/(?:^\w|[A-Z]|\b\w)/g, function (word, index) {
        return index === 0 ? word.toLowerCase() : word.toUpperCase();
    }).replace(/\s+/g, '');
}
exports.camelize = camelize;
// ****************************** TEST ****************************************
// readFromJSONObjectFile('./sample.json').then((data) => {
//     // console.log(JSON.parse(data));
//     const initialData = isJsonString(data) ? JSON.parse(data) : [];
//     // console.log(Object.keys(initialData).map((ky) => ({label: ky, value: ky})));
//     writeToJSONFile('./out.json', Object.keys(initialData).map((ky) => ({label: ky, value: ky})), true).then((success) => {
//         console.log(success);
//     }).catch((e) => {console.log(e)})
// }).catch((err) => {
//     console.log('[ERROR]', err);
// })
