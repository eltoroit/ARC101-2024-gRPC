import fs from "fs";
import * as dotenv from "dotenv";
import PubSubApiClient from "salesforce-pubsub-api-client";

class SalesforceClientLibraryCDC {
	lastReplayId = -1;
	totalEvents = 0;

	async forEver() {
		const credentials = this.#getCredentialsViaPostman();

		// Infinite loop, promise never resolves!
		// Using event loop to get a new thread and clean memory.
		return new Promise(async (resolve, reject) => {
			const loop = async () => {
				try {
					await this.subscribe(credentials);
				} catch (ex) {
					console.log(`${new Date().toJSON()} >> Error handled`);
				}
				setTimeout(() => {
					loop();
				}, 1e3);
			};

			await loop();
		});
	}

	subscribe(credentials) {
		let eventEmitter;
		let channel = "/data/AccountChangeEvent"; // /data/ChangeEvents

		return new Promise(async (resolve, reject) => {
			try {
				const client = new PubSubApiClient(this.#logger);
				await client.connectWithAuth(credentials.accesstoken, credentials.instanceurl, credentials.tenantid);

				if (this.lastReplayId > 0) {
					// console.log(`Subscribing with ReplayId: ${this.lastReplayId}`);
					eventEmitter = await client.subscribeFromReplayId(channel, 5, this.lastReplayId);
				} else {
					eventEmitter = await client.subscribeFromEarliestEvent(channel, 5);
				}

				// Handle incoming events
				eventEmitter.on("data", (event) => {
					// https://github.com/pozil/pub-sub-api-node-client DOES NOT RETURN THE ReplayIds IN ORDER!!!
					if (event.replayId > this.lastReplayId) {
						this.totalEvents++;
						this.lastReplayId = Math.max(this.lastReplayId, event.replayId);
						console.log(
							`${new Date().toJSON()} >>> ` +
								`(${eventEmitter.getReceivedEventCount()} of ${eventEmitter.getRequestedEventCount()}) ` +
								`ReplayId: ${event.replayId}. Total received: ${this.totalEvents}`
						);
					} else {
						console.log(`${event.replayId} event out of order`);
						debugger;
					}
				});
				eventEmitter.on("error", (...params) => {
					debugger;
					console.log(`${new Date().toJSON()} >>> Event: error >>>`, ...params);
				});
				eventEmitter.on("lastevent", (...params) => {
					// debugger;
					// console.log(`${new Date().toJSON()} >>> Event: lastevent >>>`, ...params);
					resolve();
				});
				eventEmitter.on("keepalive", (...params) => {
					// debugger;
					console.log(`${new Date().toJSON()} >>> Event: keepalive >>>`, ...params);
				});
				eventEmitter.on("end", (...params) => {
					// debugger;
					console.log(`${new Date().toJSON()} >>> Event: end >>>`, ...params);
				});
				eventEmitter.on("status", (...params) => {
					// debugger;
					console.log(`${new Date().toJSON()} >>> Event: status >>>`, ...params);
				});
			} catch (error) {
				console.error(error);
			}
		});
	}

	#getCredentialsViaPostman() {
		// This is useful if you want to login yourself
		// await client.connectWithAuth(credentials.accesstoken, credentials.instanceurl, credentials.tenantid);
		const testPostman = JSON.parse(process.env.TEST_POSTMAN);
		const credentials = {
			accesstoken: testPostman.access_token,
			instanceurl: testPostman.instance_url,
			tenantid: testPostman.access_token.split("!")[0],
		};
		process.env.SALESFORCE_LOGIN_URL = testPostman.instance_url;
		return credentials;
	}

	async #prepareLogin() {
		// This is useful if you want to let the library login
		// await client.connect();
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

	#logger = {
		debug: (...params) => {
			// console.debug(`${new Date().toJSON()} >>> DEBUG >>>`);
			// console.debug(`${new Date().toJSON()} >>> DEBUG >>>`, ...params);
		},
		error: (...params) => {
			// console.error(`${new Date().toJSON()} >>> ERROR >>>`);
			console.error(`${new Date().toJSON()} >>> ERROR >>>`, ...params);
		},
		info: (...params) => {
			// console.info(`${new Date().toJSON()} >> "INFO >>>`);
			console.info(`${new Date().toJSON()} >>> INFO >>>`, ...params);
		},
		warn: (...params) => {
			// console.warn(`${new Date().toJSON()} >> "WARN >>>`);
			console.warn(`${new Date().toJSON()} >>> WARN >>>`, ...params);
		},
	};
}

dotenv.config();
new SalesforceClientLibraryCDC().forEver();
