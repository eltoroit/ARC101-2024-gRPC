import * as dotenv from "dotenv";
import PubSubApiClient from "salesforce-pubsub-api-client";

class SalesforceClientLibraryPE_Pub {
	async publishPE() {
		const credentials = this.#getCredentialsViaPostman();
		try {
			const channel = "/event/ELTOROit__e";
			const client = new PubSubApiClient(credentials, this.#logger);
			await client.connect();

			const payload = {
				CreatedDate: new Date().getTime(), // Non-null value required but there's no validity check performed on this field
				CreatedById: credentials.userId, // Valid user ID
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

	#getCredentialsViaPostman() {
		const testPostman = JSON.parse(process.env.TEST_POSTMAN);
		const userUrl = testPostman.id;
		const credentials = {
			authType: "user-supplied",
			accessToken: testPostman.access_token,
			instanceUrl: testPostman.instance_url,
			organizationId: testPostman.access_token.split("!")[0],
			userId: userUrl.substring(userUrl.lastIndexOf("/") + 1),
		};
		return credentials;
	}

	showAllMessages = false;
	#logger = {
		debug: (...params) => {
			if (this.showAllMessages) {
				process.stdout.write(`\x1B[2m`); // Dim output
				console.debug(`${new Date().toJSON()} >>> DEBUG >>>`, ...params);
				process.stdout.write(`\x1b[0m`); // Reset colors
			}
		},
		error: (...params) => {
			console.error(`${new Date().toJSON()} >>> ERROR >>>`, ...params);
		},
		info: (...params) => {
			if (this.showAllMessages) {
				console.info(`${new Date().toJSON()} >>> INFO >>>`, ...params);
			}
		},
		warn: (...params) => {
			console.warn(`${new Date().toJSON()} >>> WARN >>>`, ...params);
		},
	};
}

dotenv.config();
new SalesforceClientLibraryPE_Pub().publishPE();
