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
exports.ussd_controller = void 0;
const ussd_builder_1 = __importDefault(require("ussd-builder"));
const helpers_1 = require("../utils/helpers");
const user_1 = require("../models/user");
const path_1 = __importDefault(require("path"));
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const uuid_1 = require("uuid");
const surplusProduct_1 = require("../models/surplusProduct");
const surplusSubscription_1 = require("../models/surplusSubscription");
const amqp_1 = require("../utils/amqp");
const buffer_1 = require("buffer");
const ussd_menu = new ussd_builder_1.default();
const SESSION_FILE_PATH = path_1.default.resolve(__dirname, './session.json');
const sessions = {};
ussd_menu.sessionConfig({
    start(sessionId, callback) {
        return __awaiter(this, void 0, void 0, function* () {
            // load persistent session storage
            // const sessions_raw = await readFromJSONObjectFile(SESSION_FILE_PATH);
            // const sessions = isJsonString(sessions_raw) ? JSON.parse(sessions_raw) : {};
            if (!(sessionId in sessions))
                sessions[sessionId] = {};
            // await writeToJSONFile(SESSION_FILE_PATH, sessions);
            callback && callback();
        });
    },
    end(sessionId, callback) {
        return __awaiter(this, void 0, void 0, function* () {
            // load persistent session storage
            // const sessions_raw = await readFromJSONObjectFile(SESSION_FILE_PATH);
            // const sessions = isJsonString(sessions_raw) ? JSON.parse(sessions_raw) : {};
            console.log(sessions);
            delete sessions[sessionId];
            // await writeToJSONFile(SESSION_FILE_PATH, sessions);
            callback && callback();
        });
    },
    set(sessionId, key, value) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
                // load persistent session storage
                // const sessions_raw = await readFromJSONObjectFile(SESSION_FILE_PATH);
                // const sessions = isJsonString(sessions_raw) ? JSON.parse(sessions_raw) : {};
                sessions[sessionId][key] = value;
                // await writeToJSONFile(SESSION_FILE_PATH, sessions);
                resolve(sessions);
            }));
        });
    },
    get(sessionId, key) {
        return __awaiter(this, void 0, void 0, function* () {
            // load persistent session storage
            return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
                // const sessions_raw = await readFromJSONObjectFile(SESSION_FILE_PATH);
                // const sessions = isJsonString(sessions_raw) ? JSON.parse(sessions_raw) : {};
                const value = sessions[sessionId][key];
                resolve(value);
            }));
        });
    },
});
ussd_menu.startState({
    run() {
        return __awaiter(this, void 0, void 0, function* () {
            // check if the number or user already exists
            const user = yield user_1.User.findOne({ phone: ussd_menu.args.phoneNumber });
            // console.log(user);
            if (user) {
                ussd_menu.con((0, helpers_1.withNewLines)(`Welcome ${user.username} to Farm2Table login.~Please enter your password: `));
                this.next = {
                    '*': 'login',
                };
                return;
            }
            else {
                ussd_menu.con((0, helpers_1.withNewLines)(`Welcome to Farm2Table registration.~1. Choose account type~2. End`));
                this.next = {
                    '1': 'chooseAccount',
                    '2': 'end'
                };
                return;
            }
        });
    },
    // next: {
    //     '1': 'chooseAccount',
    //     '2': 'end'
    // }
});
ussd_menu.state('chooseAccount', {
    run() {
        ussd_menu.con((0, helpers_1.withNewLines)(`Choose an account type.~1. Donor/Seller~2. Organization/Buyer~3. Agent`));
    },
    next: {
        '1': 'registerDonor',
        '2': 'registerOrganization',
        '3': 'registerAgent'
    }
});
ussd_menu.state('registerDonor', {
    run() {
        ussd_menu.session.set('usertype', 'donor').then(() => {
            ussd_menu.con((0, helpers_1.withNewLines)(`Farmer Registration.~Enter your username: `));
        });
    },
    next: {
        '*[a-zA-Z]+': 'registerDonor.username'
    }
});
ussd_menu.state('registerOrganization', {
    run() {
        ussd_menu.session.set('usertype', 'org').then(() => {
            ussd_menu.con((0, helpers_1.withNewLines)(`Organization Registration.~Enter organization name: `));
        });
    },
    next: {
        '*[a-zA-Z]+': 'registerOrganization.name'
    }
});
ussd_menu.state('registerAgent', {
    run() {
        ussd_menu.end('Coming soon');
    },
});
ussd_menu.state('registerDonor.username', {
    run() {
        const { phoneNumber } = ussd_menu.args;
        const name = ussd_menu.val;
        ussd_menu.session.set('username', name).then(() => {
            ussd_menu.con((0, helpers_1.withNewLines)(`Enter Password`));
        });
    },
    next: {
        '*': 'registerDonor.password'
    }
});
ussd_menu.state('registerOrganization.name', {
    run() {
        const name = ussd_menu.val;
        ussd_menu.session.set('username', name).then(() => {
            ussd_menu.con((0, helpers_1.withNewLines)(`Enter Password`));
        });
    },
    next: {
        '*': 'registerOrganization.password'
    }
});
ussd_menu.state('registerAgent.username', {
    run() {
    },
});
ussd_menu.state('registerDonor.password', {
    run() {
        const password = ussd_menu.val;
        ussd_menu.session.set('password', password).then(() => {
            ussd_menu.con('Confirm Password');
        });
    },
    next: {
        '*': 'registerDonor.confirmPassword'
    }
});
ussd_menu.state('registerOrganization.password', {
    run() {
        const password = ussd_menu.val;
        ussd_menu.session.set('password', password).then(() => {
            ussd_menu.con('Confirm Password');
        });
    },
    next: {
        '*': 'registerOrganization.confirmPassword'
    }
});
ussd_menu.state('registerDonor.confirmPassword', {
    run() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const confirmPassword = ussd_menu.val;
                const initialPassword = yield ussd_menu.session.get('password');
                if (initialPassword !== confirmPassword) {
                    this.next = {
                        '*': 'registerDonor.password'
                    };
                    ussd_menu.con('Your passwords did not match. Please try re-entering you password.');
                }
                const username = yield ussd_menu.session.get('username');
                const password = yield ussd_menu.session.get('password');
                const usertype = yield ussd_menu.session.get('usertype');
                const phone = ussd_menu.args.phoneNumber;
                const hashed_password = yield bcryptjs_1.default.hash(password, 10);
                // save user to DB
                const newUser = new user_1.User({
                    uid: (0, uuid_1.v4)(),
                    username,
                    password: hashed_password,
                    usertype,
                    phone
                });
                newUser.save().then(() => {
                    ussd_menu.end(`Registration successful.~Redial ${ussd_menu.args.serviceCode} to login.`);
                }).catch((register_err) => {
                    console.log(register_err);
                    ussd_menu.end(`Failed to register. Please try again`);
                });
            }
            catch (err) {
                console.log(err);
                ussd_menu.end('An Error occurred!!');
            }
        });
    }
});
ussd_menu.state('registerOrganization.confirmPassword', {
    run() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const confirmPassword = ussd_menu.val;
                const initialPassword = yield ussd_menu.session.get('password');
                if (initialPassword !== confirmPassword) {
                    this.next = {
                        '*': 'registerOrganization.password'
                    };
                    ussd_menu.con('Your passwords did not match. Please try re-entering you password.');
                }
                const username = yield ussd_menu.session.get('username');
                const password = yield ussd_menu.session.get('password');
                const usertype = yield ussd_menu.session.get('usertype');
                const phone = ussd_menu.args.phoneNumber;
                const hashed_password = yield bcryptjs_1.default.hash(password, 10);
                // save user to DB
                const newUser = new user_1.User({
                    uid: (0, uuid_1.v4)(),
                    username,
                    password: hashed_password,
                    usertype,
                    phone
                });
                newUser.save().then(() => {
                    ussd_menu.end(`Registration successful.~Redial ${ussd_menu.args.serviceCode} to login.`);
                }).catch((register_err) => {
                    console.log(register_err);
                    ussd_menu.end(`Failed to register. Please try again`);
                });
            }
            catch (err) {
                console.log(err);
                ussd_menu.end('An Error occurred!!');
            }
        });
    }
});
ussd_menu.state('login', {
    run() {
        return __awaiter(this, void 0, void 0, function* () {
            const password = ussd_menu.val;
            const phone = ussd_menu.args.phoneNumber;
            // console.log(password);
            const targetUser = yield user_1.User.findOne({ phone: phone });
            if (targetUser) {
                if (yield bcryptjs_1.default.compare(password, targetUser.password)) {
                    // success
                    ussd_menu.session.set('user', { usertype: targetUser.usertype });
                    switch (targetUser.usertype) {
                        case "donor":
                            ussd_menu.con((0, helpers_1.withNewLines)('Welcome to Farm2Table.~Choose Action:~1. Create Surplus Alert~2. Active Surplus Alerts~3. Logout'));
                            this.next = {
                                '1': 'surplus.create',
                                '2': 'surplus.all',
                                '3': 'end'
                            };
                            break;
                        case "org":
                            ussd_menu.con((0, helpers_1.withNewLines)('Welcome to Farm2Table.~Choose Action:~1. Subscribe to surplus alert~2. My Surplus Alert Subscriptions~3. Jobs~4. Logout'));
                            this.next = {
                                '1': 'surplus.subscribe',
                                '2': 'surplus.subscriptions',
                                '3': 'surplus.jobs',
                                '4': 'end'
                            };
                            break;
                        case "agent":
                            ussd_menu.con((0, helpers_1.withNewLines)('Welcome to Farm2Table.~Choose Action:~1. Check Assigned Contracts~2. My Contracts~3. Logout'));
                            this.next = {
                                '1': 'surplus.create',
                                '2': 'surplus.all',
                                '3': 'end'
                            };
                            break;
                        default:
                            ussd_menu.end((0, helpers_1.withNewLines)('We couldn\'t determine your usertype. Please try registering again'));
                            break;
                    }
                }
            }
            ussd_menu.con(`Invalid Credentials. Please Try Again`);
        });
    },
});
ussd_menu.state('surplus.jobs', {
    run() {
        return __awaiter(this, void 0, void 0, function* () {
            ussd_menu.con((0, helpers_1.withNewLines)(`1. Post Jobs~2. Posted offerings~3. Cancel`));
            this.next = {
                '1': 'surplus.jobs.post',
                '2': 'end',
                '3': 'end'
            };
        });
    },
});
ussd_menu.state('surplus.jobs.post', {
    run() {
        return __awaiter(this, void 0, void 0, function* () {
            ussd_menu.con((0, helpers_1.withNewLines)('Please enter the job type (e.g Farming, Herdsman):'));
            this.next = {
                '*[a-zA-Z]+': 'surplus.jobs.post.people'
            };
        });
    },
});
ussd_menu.state('surplus.jobs.post.people', {
    run() {
        ussd_menu.con((0, helpers_1.withNewLines)(`Enter the number of people needed`));
        this.next = {
            '*\\d+': 'surplus.jobs.post.people.number'
        };
    },
});
ussd_menu.state('surplus.jobs.post.people.number', {
    run() {
        ussd_menu.con((0, helpers_1.withNewLines)('Enter Location:'));
        this.next = {
            '*[a-zA-Z]+': 'surplus.jobs.post.people.number.confirm',
        };
    },
});
ussd_menu.state('surplus.jobs.post.people.number.confirm', {
    run() {
        ussd_menu.con((0, helpers_1.withNewLines)('Confirm Job posting.~An sms will be sent containing the details~1. Yes~2. No'));
        this.next = {
            '1': 'surplus.jobs.post.confirm.end',
            '2': 'end'
        };
    },
});
ussd_menu.state('surplus.jobs.post.confirm.end', {
    run() {
        ussd_menu.end('Job Post created successfully. You will be notified of potential candidates');
    },
});
const standard_units = {
    weight: "kg",
    volume: "l",
    length: "m"
};
const categories = {
    "fruits": {
        quantity_variants: {
            available: ['weight', 'crates'],
            variants: {
                weight: {
                    quantity: 0,
                    defaultQuantifier: 'kilograms'
                },
                crates: {
                    quantity: 0,
                    defaultQuantifier: 'number'
                }
            }
        }
    },
    "vegetables": {
        quantity_variants: {
            available: ['weight', 'crates'],
            variants: {
                weight: {
                    quantity: 0,
                    defaultQuantifier: 'kilograms'
                },
                crates: {
                    quantity: 0,
                    defaultQuantifier: 'number'
                }
            }
        }
    },
    "grains": {
        quantity_variants: {
            available: ['weight', 'bags'],
            variants: {
                weight: {
                    quantity: 0,
                    defaultQuantifier: 'kilograms'
                },
                bags: {
                    quantity: 0,
                    defaultQuantifier: 'number'
                }
            }
        }
    },
    "dairy": {
        quantity_variants: {
            available: ['weight', 'volume'],
            variants: {
                weight: {
                    quantity: 0,
                    defaultQuantifier: 'kilograms'
                },
                volume: {
                    quantity: 0,
                    defaultQuantifier: 'litres'
                }
            }
        }
    },
    "animals": {
        quantity_variants: {
            available: ['number'],
            variants: {
                number: {
                    quantity: 0,
                    defaultQuantifier: 'number'
                }
            }
        }
    }
};
function renderCategories() {
    let final_string = ``;
    Object.keys(categories).forEach((key, i) => final_string = `${final_string}~${i + 1}. ${key[0].toUpperCase() + key.substring(1)}`);
    return final_string;
}
ussd_menu.state('surplus.create', {
    run() {
        return __awaiter(this, void 0, void 0, function* () {
            yield ussd_menu.session.set('surplus.create', {});
            ussd_menu.con((0, helpers_1.withNewLines)(`Select Category: ${renderCategories()}`));
            const keys = Object.keys(categories);
            this.next = keys.map((ky, ix) => ({ [ix + 1]: `surplus.create.${ky}` })).reduce((prev, current) => (Object.assign(Object.assign({}, prev), current)));
        });
    },
});
ussd_menu.state('surplus.all', {
    run() {
    },
    next: {
        '*': 'end'
    }
});
Object.keys(categories).forEach((_category_) => {
    ussd_menu.state(`surplus.create.${_category_}`, {
        run() {
            return __awaiter(this, void 0, void 0, function* () {
                const prevSessionState = yield ussd_menu.session.get('surplus.create');
                ussd_menu.session.set('surplus.create', Object.assign(Object.assign({}, prevSessionState), { category: _category_ })).then(() => {
                    const available_quantity_variants = categories[_category_].quantity_variants.available;
                    ussd_menu.con((0, helpers_1.withNewLines)(`Choose Quantity units:~${available_quantity_variants.map((variant, ix) => `~${ix + 1}. ${variant}`)}`));
                    // console.log(available_quantity_variants.map((variant_, i) => ({[i+1]: `surplus.create.${_category_}.${variant_}`})).reduce((prev, current) => ({...prev, ...current})));
                    this.next = available_quantity_variants.map((variant_, i) => ({ [i + 1]: `surplus.create.${_category_}.${variant_}` })).reduce((prev, current) => (Object.assign(Object.assign({}, prev), current)));
                });
            });
        },
    });
});
Object.keys(categories).forEach((_category_) => {
    const quantity_variants = categories[_category_].quantity_variants.available;
    quantity_variants.forEach((q_variant) => {
        ussd_menu.state(`surplus.create.${_category_}.${q_variant}`, {
            run() {
                return __awaiter(this, void 0, void 0, function* () {
                    const prevSessionState = yield ussd_menu.session.get('surplus.create');
                    const user = yield ussd_menu.session.get('user');
                    ussd_menu.session.set('surplus.create', Object.assign(Object.assign({}, prevSessionState), { q_variant })).then(() => {
                        var _a, _b;
                        ussd_menu.con((0, helpers_1.withNewLines)(user.usertype == 'org' ? `Enter quantity range (${(_a = categories[_category_].quantity_variants.variants[q_variant].defaultQuantifier) !== null && _a !== void 0 ? _a : '_'})~Please follow the format: from-to~ e.g 10-20` : `Enter quantity value:~${q_variant} (${(_b = categories[_category_].quantity_variants.variants[q_variant].defaultQuantifier) !== null && _b !== void 0 ? _b : '_'})`));
                        this.next = (user === null || user === void 0 ? void 0 : user.usertype) == "org" ? { '*\\d+-\\d+': 'surplus.create.category.q_variant.name.org' } : {
                            '*\\d+': `surplus.create.category.q_variant.name`
                        };
                    });
                });
            },
        });
    });
});
ussd_menu.state('surplus.create.category.q_variant.name.description', {
    run() {
        return __awaiter(this, void 0, void 0, function* () {
            const q_name = ussd_menu.val;
            const prevSessionState = yield ussd_menu.session.get('surplus.create');
            const user = yield ussd_menu.session.get('user');
            ussd_menu.session.set('surplus.create', Object.assign(Object.assign({}, prevSessionState), { q_name })).then(() => {
                ussd_menu.con(`Enter product description: `);
                // this.next = user.usertype == "org" ? {'*[a-zA-Z]+': `surplus.create.category.q_variant.name.description.confirm.org`} : {
                //     '*[a-zA-Z]+': `surplus.create.category.q_variant.name.description.confirm`
                // }
                this.next = {
                    '*[a-zA-Z]+': user.usertype === "donor" ? `surplus.create.category.q_variant.name.description.biddable` : `surplus.create.category.q_variant.name.description.confirm.org`
                };
            });
        });
    },
});
ussd_menu.state('surplus.create.category.q_variant.name', {
    run() {
        return __awaiter(this, void 0, void 0, function* () {
            const q_value = ussd_menu.val;
            const prevSessionState = yield ussd_menu.session.get('surplus.create');
            ussd_menu.session.set('surplus.create', Object.assign(Object.assign({}, prevSessionState), { q_value })).then(() => {
                ussd_menu.con(`Enter product name: `);
                this.next = {
                    '*[a-zA-Z]+': 'surplus.create.category.q_variant.name.description'
                };
            });
        });
    },
});
ussd_menu.state('surplus.create.category.q_variant.name.org', {
    run() {
        return __awaiter(this, void 0, void 0, function* () {
            const q_value = ussd_menu.val;
            const prevSessionState = yield ussd_menu.session.get('surplus.create');
            ussd_menu.session.set('surplus.create', Object.assign(Object.assign({}, prevSessionState), { q_value })).then(() => {
                ussd_menu.con(`Enter ideal product name: `);
                this.next = {
                    '*[a-zA-Z]+': 'surplus.create.category.q_variant.name.description'
                };
            });
        });
    },
});
ussd_menu.state('surplus.create.category.q_variant.name.description.biddable', {
    run() {
        return __awaiter(this, void 0, void 0, function* () {
            // bids
            const productDescription = ussd_menu.val;
            const prevSessionState = yield ussd_menu.session.get('surplus.create');
            const user = yield ussd_menu.session.get('user');
            // ussd_menu.con(withNewLines('Do you want to put a price on potential~1. Yes~2. No'))
            ussd_menu.session.set('surplus.create', Object.assign(Object.assign({}, prevSessionState), { productDescription })).then(() => {
                ussd_menu.con((0, helpers_1.withNewLines)('Do you want to put a price on potential bids?~1. Yes~2. No'));
                this.next = {
                    '1': 'surplus.create.category.q_variant.name.description.biddable.create',
                    '2': user.usertype == "org" ? 'surplus.create.category.q_variant.name.description.confirm.org' : `surplus.create.category.q_variant.name.description.confirm`
                };
            });
        });
    },
});
ussd_menu.state('surplus.create.category.q_variant.name.description.biddable.create', {
    run() {
        return __awaiter(this, void 0, void 0, function* () {
            const prevSessionState = yield ussd_menu.session.get('surplus.create');
            ussd_menu.session.set('surplus.create', Object.assign(Object.assign({}, prevSessionState), { biddable: { status: true } })).then(() => {
                ussd_menu.con((0, helpers_1.withNewLines)('Enter the preffered bid amount. (Kshs)'));
                this.next = {
                    '*\\d+': 'surplus.create.category.q_variant.name.description.confirm'
                };
            });
        });
    },
});
ussd_menu.state('surplus.create.category.q_variant.name.description.confirm', {
    run() {
        var _a, _b, _c, _d, _e, _f;
        return __awaiter(this, void 0, void 0, function* () {
            // const productDescription = ussd_menu.val;
            const productData = yield ussd_menu.session.get('surplus.create');
            const biddable = productData === null || productData === void 0 ? void 0 : productData.biddable;
            // check if the product is biddable
            if (productData === null || productData === void 0 ? void 0 : productData.biddable) {
                // biddable
            }
            const productDescription = (biddable === null || biddable === void 0 ? void 0 : biddable.status) === true ? productData.description : ussd_menu.val;
            const phoneNumber = ussd_menu.args.phoneNumber;
            const spid = `sp_${(0, uuid_1.v4)()}`;
            const bidObject = (biddable === null || biddable === void 0 ? void 0 : biddable.status) === true ? { bids: [] } : null;
            console.log(productData);
            const newSurplusProduct = new surplusProduct_1.SurplusProduct(Object.assign({ spid, owner: phoneNumber, category: (_a = productData.category) !== null && _a !== void 0 ? _a : "other", description: productDescription !== null && productDescription !== void 0 ? productDescription : "_", quantity: (_c = Number((_b = productData.q_value) !== null && _b !== void 0 ? _b : 0)) !== null && _c !== void 0 ? _c : 0, name: (_d = productData.q_name) !== null && _d !== void 0 ? _d : "_", q_variant: (_e = productData.q_variant) !== null && _e !== void 0 ? _e : "number", isBiddable: (_f = biddable === null || biddable === void 0 ? void 0 : biddable.status) !== null && _f !== void 0 ? _f : false }, bidObject !== null && bidObject !== void 0 ? bidObject : null));
            newSurplusProduct.save().then((sp_) => __awaiter(this, void 0, void 0, function* () {
                try {
                    console.log("SURPLUS SAVE___");
                    const keys = Object.keys(productData);
                    ussd_menu.end((0, helpers_1.withNewLines)(`Successfully created surplus alert with the following details: ${keys.map((ky, i) => `~${ky}: ${productData[ky]}`)}`));
                    const surplusProduct = JSON.stringify(Object.assign(Object.assign({}, sp_ === null || sp_ === void 0 ? void 0 : sp_._doc), { msg_domain: 'alert' }));
                    const channel = yield (0, amqp_1.messagesChannel)();
                    const QUEUE = "messages";
                    channel.assertQueue(QUEUE, {
                        durable: false
                    });
                    channel.sendToQueue(QUEUE, buffer_1.Buffer.from(surplusProduct));
                    console.log(" [x] Sent %s", surplusProduct);
                    return;
                }
                catch (e) {
                    console.log(e);
                    throw e;
                }
            })).catch((sp_err) => {
                console.log(sp_err);
                ussd_menu.end((0, helpers_1.withNewLines)(`Couldn't save your product.~Please try again`));
                return;
            });
        });
    }
});
/*
*********ORGANIZATION*************
**/
ussd_menu.state('surplus.subscribe', {
    run() {
        return __awaiter(this, void 0, void 0, function* () {
            // ussd_menu.end("Creating surplus subscription.");
            yield ussd_menu.session.set('surplus.subscribe', {});
            ussd_menu.con((0, helpers_1.withNewLines)(`Select Category: ${renderCategories()}`));
            const keys = Object.keys(categories);
            this.next = keys.map((ky, ix) => ({ [ix + 1]: `surplus.create.${ky}` })).reduce((prev, current) => (Object.assign(Object.assign({}, prev), current)));
        });
    },
});
ussd_menu.state('surplus.create.category.q_variant.name.description.confirm.org', {
    run() {
        var _a, _b, _c, _d, _e;
        return __awaiter(this, void 0, void 0, function* () {
            const productData = yield ussd_menu.session.get('surplus.create');
            const phoneNumber = ussd_menu.args.phoneNumber;
            const ssid = `ss_${(0, uuid_1.v4)()}`;
            const q_ranges = productData.q_value.split('-').map((val) => Number(val)).sort((a, b) => a - b);
            const biddable = productData === null || productData === void 0 ? void 0 : productData.biddable;
            const productDescription = (biddable === null || biddable === void 0 ? void 0 : biddable.status) === true ? productData.description : ussd_menu.val;
            console.log(q_ranges);
            console.log(productData);
            // const newSurplusProduct = new SurplusProduct({
            //     spid,
            //     owner: phoneNumber,
            //     category: productData.category ?? "other",
            //     description: productDescription ?? "_",
            //     quantity: Number(productData.q_value ?? 0) ?? 0,
            //     name: productData.q_name ?? "_",
            //     q_variant: productData.q_variant ?? "number"
            // });
            const newSurplusSubscription = new surplusSubscription_1.SurplusSubscription({
                ssid,
                source: phoneNumber,
                category: (_a = productData.category) !== null && _a !== void 0 ? _a : "other",
                description: productDescription !== null && productDescription !== void 0 ? productDescription : "_",
                name: (_b = productData.q_name) !== null && _b !== void 0 ? _b : "_",
                q_variant: (_c = productData.q_variant) !== null && _c !== void 0 ? _c : "number",
                q_range: {
                    from: (_d = q_ranges[0]) !== null && _d !== void 0 ? _d : 0,
                    to: (_e = q_ranges[1]) !== null && _e !== void 0 ? _e : 0
                }
            });
            // newSurplusProduct.save().then((sp_) => {
            //     const keys = Object.keys(productData);
            //     ussd_menu.end(withNewLines(`Successfully created surplus alert with the following details: ${keys.map((ky, i) => `~${ky}: ${productData[ky]}`)}`));
            //     console.log(sp_);
            //     return;
            // }).catch((sp_err) => {
            //     console.log(sp_err);
            //     ussd_menu.end(withNewLines(`Couldn't save your product.~Please try again`))
            //     return;
            // })
            newSurplusSubscription.save().then((ss_) => {
                const keys = Object.keys(productData);
                ussd_menu.end((0, helpers_1.withNewLines)(`Successfully subscribed to surplus alert with the following details: ${keys.map((ky, i) => `~${ky}: ${productData[ky]}`)}`));
                console.log(ss_);
                return;
            }).catch((ss__err) => {
                console.log(ss__err);
                ussd_menu.end((0, helpers_1.withNewLines)(`Couldn't register your subscription.~Please try again`));
                return;
            });
        });
    }
});
ussd_menu.state('overriden', {
    run() {
        ussd_menu.end((0, helpers_1.withNewLines)(`Overriden!!`));
    }
});
ussd_menu.state('end', {
    run() {
        ussd_menu.end('Ending session. Thank you.');
    }
});
ussd_menu.state('end.surplus.create', {
    run() {
        return __awaiter(this, void 0, void 0, function* () {
            const productData = yield ussd_menu.session.get('surplus.create');
            const keys = Object.keys(productData);
            ussd_menu.end((0, helpers_1.withNewLines)(`Successfully created surplus alert with the following details: ${keys.map((ky, i) => `~${ky}: ${productData[ky]}`)}`));
        });
    },
});
const ussd_controller = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { sessionId, serviceCode, phoneNumber, text, } = req.body;
    console.log(sessionId, serviceCode, phoneNumber, text);
    try {
        let ussd_res = yield ussd_menu.run(req.body);
        res.setHeader('Content-Type', 'text/plain');
        return res.send(ussd_res);
    }
    catch (err) {
        console.log(err);
        return res.send('END An error occurred. Please Try again');
    }
});
exports.ussd_controller = ussd_controller;
