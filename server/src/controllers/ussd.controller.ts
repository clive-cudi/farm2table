import { Request, Response } from "express";
import UssdMenu from "ussd-builder";
import { isJsonString, readFromJSONObjectFile, withNewLines, writeToJSONFile } from "../utils/helpers";
import { User } from "../models/user";
import path from "path";
import bcrypt from 'bcryptjs'
import { v4 as uuid } from "uuid";
import { SurplusProduct } from "../models/surplusProduct";
import { SurplusSubscription } from "../models/surplusSubscription";
import {messagesChannel} from "../utils/amqp";
import {Buffer} from "buffer";

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
        // console.log(user);
        if (user) {
            ussd_menu.con(withNewLines(`Welcome ${user.username} to Farm2Table login.~Please enter your password: `))
            this.next = {
                '*': 'login',
            }
            return
        } else {
            ussd_menu.con(withNewLines(`Welcome to Farm2Table registration.~1. Choose account type~2. End`));
            this.next = {
                '1': 'chooseAccount',
                '2': 'end'
            }
            return
        }
    },
    // next: {
    //     '1': 'chooseAccount',
    //     '2': 'end'
    // }
});

ussd_menu.state('chooseAccount', {
    run() {
        ussd_menu.con(withNewLines(`Choose an account type.~1. Donor/Seller~2. Organization/Buyer~3. Agent`));
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

        // console.log(password);

        const targetUser = await User.findOne({phone: phone});

        if (targetUser) {
            if (await bcrypt.compare(password, targetUser.password)) {
                // success

                ussd_menu.session.set('user', {usertype: targetUser.usertype});
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
                        ussd_menu.con(withNewLines('Welcome to Farm2Table.~Choose Action:~1. Subscribe to surplus alert~2. My Surplus Alert Subscriptions~3. Jobs~4. Logout'));
                        this.next = {
                            '1': 'surplus.subscribe',
                            '2': 'end',
                            '3': 'surplus.jobs',
                            '4': 'end'
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

ussd_menu.state('surplus.jobs', {
    async run() {
        ussd_menu.con(withNewLines(`1. Post Jobs~2. Posted offerings~3. Cancel`));

        this.next = {
            '1': 'surplus.jobs.post',
            '2': 'end',
            '3': 'end'
        }
    },
});

ussd_menu.state('surplus.jobs.post', {
    async run() {
        ussd_menu.con(withNewLines('Please enter the job type (e.g Farming, Herdsman):'))
        this.next = {
            '*[a-zA-Z]+': 'surplus.jobs.post.people'
        }
    },
});

ussd_menu.state('surplus.jobs.post.people', {
    run() {
        ussd_menu.con(withNewLines(`Enter the number of people needed`));

        this.next = {
            '*\\d+': 'surplus.jobs.post.people.number'
        }
    },
});

ussd_menu.state('surplus.jobs.post.people.number', {
    run() {
        ussd_menu.con(withNewLines('Enter Location:'));

        this.next = {
            '*[a-zA-Z]+': 'surplus.jobs.post.people.number.confirm',
        }
    },
});

ussd_menu.state('surplus.jobs.post.people.number.confirm', {
    run() {
        ussd_menu.con(withNewLines('Confirm Job posting.~An sms will be sent containing the details~1. Yes~2. No'));

        this.next = {
            '1': 'surplus.jobs.post.confirm.end',
            '2': 'end'
        }
    },
});

ussd_menu.state('surplus.jobs.post.confirm.end', {
    run() {
        ussd_menu.end('Job Post created successfully. You will be notified of potential candidates')
    },
})

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
                    quantity: number,
                    defaultQuantifier: string
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
}

function renderCategories() {
    let final_string = ``;
    Object.keys(categories).forEach((key, i) => final_string = `${final_string}~${i + 1}. ${key[0].toUpperCase() + key.substring(1)}`)
    return final_string;
}

ussd_menu.state('surplus.create', {
    async run() {
        await ussd_menu.session.set('surplus.create', {});
        ussd_menu.con(withNewLines(`Select Category: ${renderCategories()}`));
        const keys = Object.keys(categories);
        this.next = keys.map((ky, ix) => ({[ix+1]: `surplus.create.${ky}`})).reduce((prev, current) => ({...prev, ...current}))
    },
})

ussd_menu.state('surplus.all', {
    run() {
        
    },
    next: {
        '*': 'end'
    }
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
                const user = await ussd_menu.session.get('user') as {usertype: string}
                ussd_menu.session.set('surplus.create', {...prevSessionState, q_variant}).then(() => {
                    ussd_menu.con(withNewLines(user.usertype == 'org' ? `Enter quantity range (${categories[_category_].quantity_variants.variants[q_variant].defaultQuantifier ?? '_'})~Please follow the format: from-to~ e.g 10-20` : `Enter quantity value:~${q_variant} (${categories[_category_].quantity_variants.variants[q_variant].defaultQuantifier ?? '_'})`))
                    this.next = user?.usertype == "org" ?  {'*\\d+-\\d+': 'surplus.create.category.q_variant.name.org'} : {
                        '*\\d+': `surplus.create.category.q_variant.name`
                    }
                })
            },
        })
    } )
});

ussd_menu.state('surplus.create.category.q_variant.name.description', {
    async run() {
        const q_name = ussd_menu.val;
        const prevSessionState = await ussd_menu.session.get('surplus.create') as {};
        const user = await ussd_menu.session.get('user') as {usertype: string};

        ussd_menu.session.set('surplus.create', {...prevSessionState, q_name}).then(() => {
            ussd_menu.con(`Enter product description: `);
            // this.next = user.usertype == "org" ? {'*[a-zA-Z]+': `surplus.create.category.q_variant.name.description.confirm.org`} : {
            //     '*[a-zA-Z]+': `surplus.create.category.q_variant.name.description.confirm`
            // }
            this.next = {
                '*[a-zA-Z]+': user.usertype === "donor" ? `surplus.create.category.q_variant.name.description.biddable` : `surplus.create.category.q_variant.name.description.confirm.org`
            }
        })
    },
});

ussd_menu.state('surplus.create.category.q_variant.name', {
    async run() {
        const q_value = ussd_menu.val;
        const prevSessionState = await ussd_menu.session.get('surplus.create') as {};

        ussd_menu.session.set('surplus.create', {...prevSessionState, q_value}).then(() => {
            ussd_menu.con(`Enter product name: `);
            this.next = {
                '*[a-zA-Z]+': 'surplus.create.category.q_variant.name.description'
            }
        })
    },
});

ussd_menu.state('surplus.create.category.q_variant.name.org', {
    async run() {
        const q_value = ussd_menu.val;
        const prevSessionState = await ussd_menu.session.get('surplus.create') as {};

        ussd_menu.session.set('surplus.create', {...prevSessionState, q_value}).then(() => {
            ussd_menu.con(`Enter ideal product name: `);
            this.next = {
                '*[a-zA-Z]+': 'surplus.create.category.q_variant.name.description'
            }
        })
    },
});

ussd_menu.state('surplus.create.category.q_variant.name.description.biddable', {
    async run() {
        // bids
        const productDescription = ussd_menu.val;
        const prevSessionState = await ussd_menu.session.get('surplus.create') as {[key: string]: string};
        const user = await ussd_menu.session.get('user') as {usertype: string};

        // ussd_menu.con(withNewLines('Do you want to put a price on potential~1. Yes~2. No'))
        ussd_menu.session.set('surplus.create', {...prevSessionState, productDescription}).then(() => {
            ussd_menu.con(withNewLines('Do you want to put a price on potential bids?~1. Yes~2. No'));
            this.next = {
                '1': 'surplus.create.category.q_variant.name.description.biddable.create',
                '2': user.usertype == "org" ? 'surplus.create.category.q_variant.name.description.confirm.org' : `surplus.create.category.q_variant.name.description.confirm`
            }
        })
    },
})

ussd_menu.state('surplus.create.category.q_variant.name.description.biddable.create', {
    async run() {
        const prevSessionState = await ussd_menu.session.get('surplus.create') as {[key: string]: string};
        ussd_menu.session.set('surplus.create', {...prevSessionState, biddable: {status: true}}).then(() => {
            ussd_menu.con(withNewLines('Enter the preffered bid amount. (Kshs)'));

            this.next = {
                '*\\d+': 'surplus.create.category.q_variant.name.description.confirm'
            }
        });
    },
});

ussd_menu.state('surplus.create.category.q_variant.name.description.confirm', {
    async run() {
        // const productDescription = ussd_menu.val;
        const productData = await ussd_menu.session.get('surplus.create') as {[key: string]: string};
        const biddable = productData?.biddable as unknown as {status: boolean};
        // check if the product is biddable
        if (productData?.biddable) {
            // biddable
        }
        const productDescription = biddable?.status === true ? productData.description :  ussd_menu.val;
        const phoneNumber = ussd_menu.args.phoneNumber;
        const spid = `sp_${uuid()}`;
        const bidObject = biddable?.status === true ? {bids: []} : null


        console.log(productData);
        const newSurplusProduct = new SurplusProduct({
            spid,
            owner: phoneNumber,
            category: productData.category ?? "other",
            description: productDescription ?? "_",
            quantity: Number(productData.q_value ?? 0) ?? 0,
            name: productData.q_name ?? "_",
            q_variant: productData.q_variant ?? "number",
            isBiddable: biddable?.status ?? false,
            ...bidObject ?? null
        });

        newSurplusProduct.save().then(async (sp_) => {
            try {
                console.log("SURPLUS SAVE___")
                const keys = Object.keys(productData);
                ussd_menu.end(withNewLines(`Successfully created surplus alert with the following details: ${keys.map((ky, i) => `~${ky}: ${productData[ky]}`)}`));
                const surplusProduct = JSON.stringify({...sp_?._doc, msg_domain: 'alert'});
                const channel = await messagesChannel();
                const QUEUE = "messages";

                channel.assertQueue(QUEUE, {
                    durable: false
                });

                channel.sendToQueue(QUEUE, Buffer.from(surplusProduct));

                console.log(" [x] Sent %s", surplusProduct);

                return;
            } catch (e) {
                console.log(e);
                throw e;
            }
        }).catch((sp_err) => {
            console.log(sp_err);
            ussd_menu.end(withNewLines(`Couldn't save your product.~Please try again`))
            return;
        })
    }
});

/*
*********ORGANIZATION*************
**/

ussd_menu.state('surplus.subscribe', {
    async run() {
        // ussd_menu.end("Creating surplus subscription.");
        await ussd_menu.session.set('surplus.subscribe', {});
        ussd_menu.con(withNewLines(`Select Category: ${renderCategories()}`));
        const keys = Object.keys(categories);
        this.next = keys.map((ky, ix) => ({[ix+1]: `surplus.create.${ky}`})).reduce((prev, current) => ({...prev, ...current}))
    },
});

ussd_menu.state('surplus.create.category.q_variant.name.description.confirm.org', {
    async run() {
        const productData = await ussd_menu.session.get('surplus.create') as {[key: string]: string};
        const phoneNumber = ussd_menu.args.phoneNumber;
        const ssid = `ss_${uuid()}`;
        const q_ranges = productData.q_value.split('-').map((val) => Number(val)).sort((a, b) => a-b);
        const biddable = productData?.biddable as unknown as {status: boolean};
        const productDescription = biddable?.status === true ? productData.description :  ussd_menu.val;

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

        const newSurplusSubscription = new SurplusSubscription({
            ssid,
            source: phoneNumber,
            category: productData.category ?? "other",
            description: productDescription ?? "_",
            name: productData.q_name ?? "_",
            q_variant: productData.q_variant ?? "number",
            q_range: {
                from: q_ranges[0] ?? 0,
                to: q_ranges[1] ?? 0
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
            ussd_menu.end(withNewLines(`Successfully subscribed to surplus alert with the following details: ${keys.map((ky, i) => `~${ky}: ${productData[ky]}`)}`));
            console.log(ss_);
            return;
        }).catch((ss__err) => {
            console.log(ss__err);
            ussd_menu.end(withNewLines(`Couldn't register your subscription.~Please try again`))
            return;
        })
    }
});

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