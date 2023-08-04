import { Request, Response } from "express";
import UssdMenu from "ussd-builder";
import { isJsonString, readFromJSONObjectFile, withNewLines, writeToJSONFile } from "../utils/helpers";
import { User } from "../models/user";
import path from "path";
const ussd_menu = new UssdMenu();

const SESSION_FILE_PATH = path.resolve(__dirname, './session.json');

ussd_menu.sessionConfig({
    async start(sessionId, callback) {
        // load persistent session storage
        const sessions_raw = await readFromJSONObjectFile(SESSION_FILE_PATH);

        const sessions = isJsonString(sessions_raw) ? JSON.parse(sessions_raw) : {};

        console.log('previous_sessions');
        console.log(sessions);

        if (!(sessionId in sessions)) sessions[sessionId] = {}

        await writeToJSONFile(SESSION_FILE_PATH, sessions);

        callback && callback();
    },
    async end(sessionId, callback) {
        // load persistent session storage
        const sessions_raw = await readFromJSONObjectFile(SESSION_FILE_PATH);

        const sessions = isJsonString(sessions_raw) ? JSON.parse(sessions_raw) : {};

        delete sessions[sessionId];

        await writeToJSONFile(SESSION_FILE_PATH, sessions);

        callback && callback();
    },
    async set(sessionId, key, value) {
        return new Promise(async (resolve, reject) => {
            // load persistent session storage
            const sessions_raw = await readFromJSONObjectFile(SESSION_FILE_PATH);

            const sessions = isJsonString(sessions_raw) ? JSON.parse(sessions_raw) : {};

            sessions[sessionId][key] = value;

            await writeToJSONFile(SESSION_FILE_PATH, sessions);

            resolve(sessions)
        })
    },
    async get(sessionId, key) {
        // load persistent session storage
        return new Promise(async (resolve, reject) => {
            const sessions_raw = await readFromJSONObjectFile(SESSION_FILE_PATH);

            const sessions = isJsonString(sessions_raw) ? JSON.parse(sessions_raw) : {};

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
                '1': 'overriden',
                '2': 'end'
            }
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
        '1': 'registerFarmer',
        '2': 'registerOrganization',
        '3': 'registerAgent'
    }
});

ussd_menu.state('registerFarmer', {
    run() {
        ussd_menu.con(withNewLines(`Farmer Registration.~Enter your username: `))
    },
    next: {
        '*[a-zA-Z]+': 'registerFarmer.username'
    }
})
ussd_menu.state('registerOrganization', {
    run() {
        
    },
})
ussd_menu.state('registerAgent', {
    run() {
        
    },
})

ussd_menu.state('registerFarmer.username', {
    run() {
        const {phoneNumber} = ussd_menu.args;
        const name = ussd_menu.val;
        ussd_menu.session.set('username', name).then(() => {
            ussd_menu.con(withNewLines(`Enter Password`))
        })
    },
    next: {
        '*': 'registerFarmer.password'
    }
});
ussd_menu.state('registerOrganization.name', {
    run() {
        
    },
});
ussd_menu.state('registerAgent.username', {
    run() {
        
    },
});

ussd_menu.state('registerFarmer.password', {
    run() {
        const password = ussd_menu.val;
        ussd_menu.session.set('password', password).then(() => {
            ussd_menu.end('Password set')
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