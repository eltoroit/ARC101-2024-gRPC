import fs from "fs";
import * as dotenv from "dotenv";
import PubSubApiClient from "salesforce-pubsub-api-client";

class SalesforceClientLibraryCDC {
	async subscribeCDC() {
		await this.#readConfigJSON();
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
			});
		} catch (error) {
			console.error(error);
		}
	}

	async #readConfigJSON() {
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
}

dotenv.config();
let client = new SalesforceClientLibraryCDC();
client
	.subscribeCDC()
	.then(() => {
		console.log("DONE");
	})
	.catch((err) => console.log(err));
