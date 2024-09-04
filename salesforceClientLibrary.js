import fs from "fs";
import * as dotenv from "dotenv";
import PubSubApiClient from "salesforce-pubsub-api-client";

async function readConfigJSON() {
	try {
		if (process.env.USER_JSON) {
			let txtData = await fs.promises.readFile(process.env.USER_JSON, "utf8");
			let jsontData = JSON.parse(txtData);
			let userData = jsontData.user;
			process.env.SALESFORCE_USERNAME = userData.username;
			process.env.SALESFORCE_PASSWORD = userData.password;
			process.env.SALESFORCE_LOGIN_URL = userData.instanceUrl;
			// process.env.OAUTH_CONSUMER_KEY = userData.consumerKey;
			// process.env.OAUTH_CONSUMER_SECRET = userData.consumerSecret;
			console.log(`Settings read from ${process.env.USER_JSON}`);
		} else {
			throw "Missing process.env.USER_JSON";
		}
	} catch (err) {
		console.error(`Error: ${err.message}`);
	}
}

async function run() {
	await readConfigJSON();
	try {
		const client = new PubSubApiClient();
		await client.connect();

		// Subscribe to account change events
		// const eventEmitter = await client.subscribe("/data/ChangeEvents");
		const eventEmitter = await client.subscribe("/data/AccountChangeEvent");

		// Handle incoming events
		eventEmitter.on("data", (event) => {
			console.log(
				`Handling ${event.payload.ChangeEventHeader.entityName} change event ` +
					`with ID ${event.replayId} ` +
					`on channel ${eventEmitter.getTopicName()} ` +
					`(${eventEmitter.getReceivedEventCount()}/${eventEmitter.getRequestedEventCount()} ` +
					`events received so far)`
			);
			// console.log(event);
			// console.log(JSON.stringify(event, null, 2));
			// console.log(
			// 	JSON.stringify(
			// 		event,
			// 		(key, value) =>
			// 			/* Convert BigInt values into strings and keep other types unchanged */
			// 			typeof value === "bigint" ? value.toString() : value,
			// 		2
			// 	)
			// );
		});
	} catch (error) {
		console.error(error);
	}
}

dotenv.config();
run()
	.then(() => {
		console.log("DONE");
	})
	.catch((err) => console.log(err));
