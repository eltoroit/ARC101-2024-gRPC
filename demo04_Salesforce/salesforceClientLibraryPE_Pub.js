import fs from "fs";
import * as dotenv from "dotenv";
import PubSubApiClient from "salesforce-pubsub-api-client";

class SalesforceClientLibraryPE_Pub {
	async publishPE() {
		await this.#readConfigJSON();
		try {
			const channel = "/event/ELTOROit__e";
			const client = new PubSubApiClient();
			await client.connect();

			const payload = {
				CreatedDate: new Date().getTime(), // Non-null value required but there's no validity check performed on this field
				CreatedById: process.env.SALESFORCE_USERID, // Valid user ID
				dttm__c: { long: new Date().getTime() },
				author__c: { string: "ELTOROit" },
				message__c: { string: "ELTOROit is pleased to announce the ARC101 postman collection. For further details, please refer to our press release." },
			};
			console.log(payload);
			const publishResult = await client.publish(channel, payload);
			console.log("Published event: ", JSON.stringify(publishResult));
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
				process.env.SALESFORCE_USERID = userData.id;
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
let client = new SalesforceClientLibraryPE_Pub();
client
	.publishPE()
	.then(() => {
		console.log("DONE");
	})
	.catch((err) => console.log(err));
