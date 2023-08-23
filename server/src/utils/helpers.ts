import { randomUUID } from 'crypto';
import fs from 'fs';
import path from 'path';

export function withNewLines(str: string, separator?: string) {
    return str.split(separator ?? "~").join('\n');
}

export async function readFromJSONObjectFile(filePath: string): Promise<string> {
    try {
        const resolvedFilePath = path.resolve(__dirname, filePath);
        if (fs.existsSync(resolvedFilePath)) {
            // file exists
            // read the file
            return new Promise((resolve, reject) => {
                if (path.extname(resolvedFilePath) !== ".json") reject("File not a JSON file");
                const rawJSONString = fs.readFileSync(resolvedFilePath);
                resolve(rawJSONString.toString());
            });
        } else {
            return new Promise((resolve, reject) => {
                resolve("")
            });
        }
    } catch (err) {
        throw err;
    }
}


export function isJsonString(str: string) {
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

export async function writeToJSONFile(filePath: string, data: Object | Array<Object>, resolve?: boolean): Promise<boolean> {
    try {
        console.log('WRITING');
        console.log(data);
        const resolvedFilePath = resolve ? path.resolve(__dirname, filePath) : filePath;
        return new Promise((resolve, reject) => {
            fs.writeFileSync(resolvedFilePath, JSON.stringify(data, null, 4));
            resolve(true);
        })
    } catch(err) {
        throw err;
    }
}

export function camelize(str: string) {
    return str.replace(/(?:^\w|[A-Z]|\b\w)/g, function(word, index) {
      return index === 0 ? word.toLowerCase() : word.toUpperCase();
    }).replace(/\s+/g, '');
  }


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
