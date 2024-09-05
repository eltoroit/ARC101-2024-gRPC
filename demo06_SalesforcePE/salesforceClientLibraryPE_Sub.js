import fs from "fs";
import * as dotenv from "dotenv";
import PubSubApiClient from "salesforce-pubsub-api-client";

class SalesforceClientLibraryPE_Sub {
	async subscribePE() {
		await this.#readConfigJSON();
		try {
			const channel = "/event/ELTOROit__e";
			const client = new PubSubApiClient();
			await client.connect();

			const eventEmitter = await client.subscribe(channel);
			eventEmitter.on("data", (event) => {
				debugger;
				console.log(
					`Handling ${eventEmitter.getTopicName()} platform event ` +
						`with ID ${event.replayId} ` +
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
let client = new SalesforceClientLibraryPE_Sub();
client
	.subscribePE()
	.then(() => {
		console.log("DONE");
	})
	.catch((err) => console.log(err));
