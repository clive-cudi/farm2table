import amqp from "amqplib/callback_api";

export function amqpConnect(): Promise<amqp.Connection> {
    return new Promise((resolve, reject) => {
        amqp.connect((err, connection) => {
            if (err) {
                console.error(err);
                reject(err);
                return;
            }

            resolve(connection);
            return;
        });
    })
}

export const messagesChannel = (): Promise<amqp.Channel> => {
    return new Promise(async (resolve, reject) => {
        const connection = await amqpConnect();


        connection.createChannel(function (err, channel ) {
            if (err) {
                reject(err);
                return;
            }

            resolve(channel);
            return;
        })
    })
}