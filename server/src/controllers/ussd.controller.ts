import { Request, Response } from "express";
import UssdMenu from "ussd-builder";
import { isJsonString, readFromJSONObjectFile, withNewLines, writeToJSONFile } from "../utils/helpers";
import { User } from "../models/user";
import path from "path";
import bcrypt from 'bcryptjs'
import { v4 as uuid } from "uuid";
import { SurplusProduct } from "../models/surplusProduct";

const ussd_menu = new UssdMenu();

const SESSION_FILE_PATH = path.resolve(__dirname, './session.json');
const sessions: any = {};

ussd_menu.sessionConfig({
    async start(sessionId, callback) {
        // load persistent session storage
        // const sessions_raw = await readFromJSONObjectFile(SESSION_FILE_PATH);

        // const sessions = isJsonString(sessions_raw) ? JSON.parse(sessions_raw) : {};

        if (!(sessionId in sessions)) sessions[sessionId] = {}

        // await writeToJSONFile(SESSION_FILE_PATH, sessions);

        callback && callback();
    },
    async end(sessionId, callback) {
        // load persistent session storage
        // const sessions_raw = await readFromJSONObjectFile(SESSION_FILE_PATH);

        // const sessions = isJsonString(sessions_raw) ? JSON.parse(sessions_raw) : {};

        console.log(sessions);
        delete sessions[sessionId];

        // await writeToJSONFile(SESSION_FILE_PATH, sessions);

        callback && callback();
    },
    async set(sessionId, key, value) {
        return new Promise(async (resolve, reject) => {
            // load persistent session storage
            // const sessions_raw = await readFromJSONObjectFile(SESSION_FILE_PATH);

            // const sessions = isJsonString(sessions_raw) ? JSON.parse(sessions_raw) : {};

            sessions[sessionId][key] = value;

            // await writeToJSONFile(SESSION_FILE_PATH, sessions);

            resolve(sessions)
        })
    },
    async get(sessionId, key) {
        // load persistent session storage
        return new Promise(async (resolve, reject) => {
            // const sessions_raw = await readFromJSONObjectFile(SESSION_FILE_PATH);

            // const sessions = isJsonString(sessions_raw) ? JSON.parse(sessions_raw) : {};

            const value = sessions[sessionId][key];

            resolve(value);
        })
    },
})

ussd_menu.startState({
    async run() {
        // check if the number or user already exists
        const user = await User.findOne({phone: ussd_menu.args.phoneNumber});

        if (user) {
            ussd_menu.con(withNewLines(`Welcome ${user.username} to Farm2Table login.~Please enter your password: `))
            this.next = {
                '*': 'login',
            }
            return
        } else {
            ussd_menu.con(withNewLines(`Welcome to Farm2Table registration.~1. Choose account type~2. End`));
        }
    },
    next: {
        '1': 'chooseAccount',
        '2': 'end'
    }
});

ussd_menu.state('chooseAccount', {
    run() {
        ussd_menu.con(withNewLines(`Choose an account type.~1. Farmer (Donor)~2. Organization (Beneficiary)~3. Agent`));
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
            ussd_menu.con(withNewLines(`Farmer Registration.~Enter your username: `))
        })
    },
    next: {
        '*[a-zA-Z]+': 'registerDonor.username'
    }
})
ussd_menu.state('registerOrganization', {
    run() {
        ussd_menu.session.set('usertype', 'org').then(() => {
            ussd_menu.con(withNewLines(`Organization Registration.~Enter organization name: `))
        })
    },
    next: {
        '*[a-zA-Z]+': 'registerOrganization.name'
    }
})
ussd_menu.state('registerAgent', {
    run() {
        ussd_menu.end('Coming soon')
    },
})

ussd_menu.state('registerDonor.username', {
    run() {
        const {phoneNumber} = ussd_menu.args;
        const name = ussd_menu.val;
        ussd_menu.session.set('username', name).then(() => {
            ussd_menu.con(withNewLines(`Enter Password`))
        })
    },
    next: {
        '*': 'registerDonor.password'
    }
});
ussd_menu.state('registerOrganization.name', {
    run() {
        const name = ussd_menu.val;
        ussd_menu.session.set('username', name).then(() => {
            ussd_menu.con(withNewLines(`Enter Password`));
        })
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
            ussd_menu.con('Confirm Password')
        })
    },
    next: {
        '*': 'registerDonor.confirmPassword'
    }
});

ussd_menu.state('registerOrganization.password', {
    run() {
        const password = ussd_menu.val;
        ussd_menu.session.set('password', password).then(() => {
            ussd_menu.con('Confirm Password')
        })
    },
    next: {
        '*': 'registerOrganization.confirmPassword'
    }
})

ussd_menu.state('registerDonor.confirmPassword', {
    async run() {
        try {
            const confirmPassword = ussd_menu.val;
            const initialPassword = await ussd_menu.session.get('password');

            if (initialPassword !== confirmPassword) {
                this.next = {
                    '*': 'registerDonor.password'
                }
                ussd_menu.con('Your passwords did not match. Please try re-entering you password.');
            }

            const username = await ussd_menu.session.get('username');
            const password = await ussd_menu.session.get('password');
            const usertype = await ussd_menu.session.get('usertype');
            const phone = ussd_menu.args.phoneNumber;
            const hashed_password = await bcrypt.hash(password, 10);

            // save user to DB
            const newUser = new User({
                uid: uuid(),
                username,
                password: hashed_password,
                usertype,
                phone
            });

            newUser.save().then(() => {
                ussd_menu.end(`Registration successful.~Redial ${ussd_menu.args.serviceCode} to login.`)
            }).catch((register_err) => {
                console.log(register_err);
                ussd_menu.end(`Failed to register. Please try again`)
            })
        } catch(err) {
            console.log(err);
            ussd_menu.end('An Error occurred!!')
        }
    }
});

ussd_menu.state('registerOrganization.confirmPassword', {
    async run() {
        try {
            const confirmPassword = ussd_menu.val;
            const initialPassword = await ussd_menu.session.get('password');

            if (initialPassword !== confirmPassword) {
                this.next = {
                    '*': 'registerOrganization.password'
                }
                ussd_menu.con('Your passwords did not match. Please try re-entering you password.');
            }

            const username = await ussd_menu.session.get('username');
            const password = await ussd_menu.session.get('password');
            const usertype = await ussd_menu.session.get('usertype');
            const phone = ussd_menu.args.phoneNumber;
            const hashed_password = await bcrypt.hash(password, 10);

            // save user to DB
            const newUser = new User({
                uid: uuid(),
                username,
                password: hashed_password,
                usertype,
                phone
            });

            newUser.save().then(() => {
                ussd_menu.end(`Registration successful.~Redial ${ussd_menu.args.serviceCode} to login.`)
            }).catch((register_err) => {
                console.log(register_err);
                ussd_menu.end(`Failed to register. Please try again`)
            })
        } catch(err) {
            console.log(err);
            ussd_menu.end('An Error occurred!!')
        }
    }
});

ussd_menu.state('login', {
    async run() {
        const password = ussd_menu.val;
        const phone = ussd_menu.args.phoneNumber

        console.log(password);

        const targetUser = await User.findOne({phone: phone});

        if (targetUser) {
            if (await bcrypt.compare(password, targetUser.password)) {
                // success

                switch (targetUser.usertype as "donor" | "org" | "agent") {
                    case "donor":
                        ussd_menu.con(withNewLines('Welcome to Farm2Table.~Choose Action:~1. Create Surplus Alert~2. Active Surplus Alerts~3. Logout'));
                        this.next = {
                            '1': 'surplus.create',
                            '2': 'surplus.all',
                            '3': 'end'
                        }
                        break;
                    case "org":
                        ussd_menu.con(withNewLines('Welcome to Farm2Table.~Choose Action:~1. Subscribe to surplus alert~2. My Surplus Alert Subscriptions~3. Logout'));
                        this.next = {
                            '1': 'surplus.create',
                            '2': 'surplus.all',
                            '3': 'end'
                        }
                        break;
                    case "agent":
                        ussd_menu.con(withNewLines('Welcome to Farm2Table.~Choose Action:~1. Check Assigned Contracts~2. My Contracts~3. Logout'));
                        this.next = {
                            '1': 'surplus.create',
                            '2': 'surplus.all',
                            '3': 'end'
                        }
                        break;
                    default:
                        ussd_menu.end(withNewLines('We couldn\'t determine your usertype. Please try registering again'));
                        break;
                }
            }
        }

        ussd_menu.con(`Invalid Credentials. Please Try Again`)
    },
});

const standard_units = {
    weight: "kg",
    volume: "l",
    length: "m"
}

interface ICategory {
    [key: string]: {
        quantity_variants: {
            available: string[];
            variants: {
                [key: string]: {
                    quantity: number
                }
            };
        };
    };
}
const categories: ICategory = {
    "fruits": {
        quantity_variants: {
            available: ['weight', 'crates'],
            variants: {
                weight: {
                    quantity: 0
                },
                crates: {
                    quantity: 0
                }
            }
        }
    },
    "vegetables": {
        quantity_variants: {
            available: ['weight', 'crates'],
            variants: {
                weight: {
                    quantity: 0
                },
                crates: {
                    quantity: 0
                }
            }
        }
    },
    "grains": {
        quantity_variants: {
            available: ['weight', 'bags'],
            variants: {
                weight: {
                    quantity: 0
                },
                bags: {
                    quantity: 0
                }
            }
        }
    },
    "dairy": {
        quantity_variants: {
            available: ['weight', 'volume'],
            variants: {
                weight: {
                    quantity: 0
                },
                volume: {
                    quantity: 0
                }
            }
        }
    },
    "animals": {
        quantity_variants: {
            available: ['number'],
            variants: {
                number: {
                    quantity: 0
                }
            }
        }
    }
}

function renderCategories() {
    let final_string = ``;
    Object.keys(categories).forEach((key, i) => final_string = `${final_string}~${i + 1}. ${key[0].toUpperCase() + key.substring(1)}`)
    return final_string;
}

ussd_menu.state('surplus.create', {
    run() {
        ussd_menu.session.set('surplus.create', {});
        ussd_menu.con(withNewLines(`Select Category: ${renderCategories()}`));
        const keys = Object.keys(categories);
        this.next = keys.map((ky, ix) => ({[ix+1]: `surplus.create.${ky}`})).reduce((prev, current) => ({...prev, ...current}))
    },
})

ussd_menu.state('surplus.all', {
    run() {
        
    },
});

Object.keys(categories).forEach((_category_) => {
    ussd_menu.state(`surplus.create.${_category_}`, {
        async run() {
            const prevSessionState = await ussd_menu.session.get('surplus.create') as {};
            ussd_menu.session.set('surplus.create', {...prevSessionState, category: _category_}).then(() => {
                const available_quantity_variants = categories[_category_].quantity_variants.available;
                ussd_menu.con(withNewLines(`Choose Quantity units:~${available_quantity_variants.map((variant, ix) => `~${ix+1}. ${variant}`)}`))
                // console.log(available_quantity_variants.map((variant_, i) => ({[i+1]: `surplus.create.${_category_}.${variant_}`})).reduce((prev, current) => ({...prev, ...current})));
                this.next = available_quantity_variants.map((variant_, i) => ({[i+1]: `surplus.create.${_category_}.${variant_}`})).reduce((prev, current) => ({...prev, ...current}))
            });
        },
    })
});

Object.keys(categories).forEach((_category_) => {
    const quantity_variants = categories[_category_].quantity_variants.available;
    quantity_variants.forEach((q_variant) =>{
        ussd_menu.state(`surplus.create.${_category_}.${q_variant}`, {
            async run() {
                const prevSessionState = await ussd_menu.session.get('surplus.create') as {};
                ussd_menu.session.set('surplus.create', {...prevSessionState, q_variant}).then(() => {
                    ussd_menu.con(withNewLines(`Enter quantity value:~${q_variant}`))
                    this.next = {
                        '*\\d+': `surplus.create.category.q_variant.description`
                    }
                })
            },
        })
    } )
});

ussd_menu.state('surplus.create.category.q_variant.description', {
    async run() {
        const q_value = ussd_menu.val;
        const prevSessionState = await ussd_menu.session.get('surplus.create') as {};

        ussd_menu.session.set('surplus.create', {...prevSessionState, q_value}).then(() => {
            ussd_menu.con(`Enter product description`);
            this.next = {
                '*[a-zA-Z]+': `surplus.create.category.q_variant.description.name`
            }  
        })
    },
});

ussd_menu.state('surplus.create.category.q_variant.description.name', {
    async run() {
        const q_description = ussd_menu.val;
        const prevSessionState = await ussd_menu.session.get('surplus.create') as {};

        ussd_menu.session.set('surplus.create', {...prevSessionState, q_description}).then(() => {
            ussd_menu.con(`Enter product name: `);
            this.next = {
                '*[a-zA-Z]+': 'surplus.create.category.q_variant.description.name.confirm'
            }
        })
    },
});

ussd_menu.state('surplus.create.category.q_variant.description.name.confirm', {
    async run() {
        const productName = ussd_menu.val;
        const productData = await ussd_menu.session.get('surplus.create') as {[key: string]: string};
        const phoneNumber = ussd_menu.args.phoneNumber;
        const spid = `sp_${uuid()}`;


        console.log(productData);
        const newSurplusProduct = new SurplusProduct({
            spid,
            owner: phoneNumber,
            category: productData.category ?? "other",
            description: productData.q_description ?? "_",
            quantity: Number(productData.q_value ?? 0) ?? 0,
            name: productName ?? "_",
            q_variant: productData.q_variant ?? "number"
        });

        newSurplusProduct.save().then((sp_) => {
            const keys = Object.keys(productData);
            ussd_menu.end(withNewLines(`Successfully created surplus alert with the following details: ${keys.map((ky, i) => `~${ky}: ${productData[ky]}`)}`));
            console.log(sp_);
            return;
        }).catch((sp_err) => {
            console.log(sp_err);
            ussd_menu.end(withNewLines(`Couldn't save your product.~Please try again`))
            return;
        })
    }
})

ussd_menu.state('overriden', {
    run() {
        ussd_menu.end(withNewLines(`Overriden!!`))
    }
})

ussd_menu.state('end', {
    run() {
        ussd_menu.end('Ending session. Thank you.')
    }
});

ussd_menu.state('end.surplus.create', {
    async run() {
        const productData = await ussd_menu.session.get('surplus.create') as {[key: string]: string};
        const keys = Object.keys(productData);
        ussd_menu.end(withNewLines(`Successfully created surplus alert with the following details: ${keys.map((ky, i) => `~${ky}: ${productData[ky]}`)}`))
    },
})

const ussd_controller = async (req: Request, res: Response) => {
    const {
        sessionId,
        serviceCode,
        phoneNumber,
        text,
    } = req.body;
    
    console.log(sessionId, serviceCode, phoneNumber, text);

    try {
        let ussd_res = await ussd_menu.run(req.body);

        res.setHeader('Content-Type', 'text/plain');
        return res.send(ussd_res);
    } catch(err) {
        console.log(err);
        return res.send('END An error occurred. Please Try again')
    }
}

export {ussd_controller}