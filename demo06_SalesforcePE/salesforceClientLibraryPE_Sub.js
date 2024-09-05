import fs from "fs";
import * as dotenv from "dotenv";
import PubSubApiClient from "salesforce-pubsub-api-client";

class SalesforceClientLibraryPE_Sub {
	lastReplayId = -1;
	totalEvents = 0;

	async forEver() {
		const credentials = this.#getCredentialsViaPostman();

		return new Promise(async (resolve, reject) => {
			// Infinite loop, promise never resolves!
			const loop = async () => {
				try {
					await this.subscribe(credentials);
					this.#showPerfomance();
				} catch (ex) {
					console.log(`${new Date().toJSON()} >> Error handled`);
				}
				loop();
			};
			loop();
		});
	}

	subscribe(credentials) {
		let channel = "/event/ELTOROit__e";

		return new Promise(async (resolve, reject) => {
			try {
				const client = new PubSubApiClient();
				await client.connectWithAuth(credentials.accessToken, credentials.instanceUrl, credentials.tenantId);

				let eventEmitter;
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
		const testPostman = JSON.parse(process.env.TEST_POSTMAN);
		const userUrl = testPostman.id;
		const credentials = {
			accessToken: testPostman.access_token,
			instanceUrl: testPostman.instance_url,
			tenantId: testPostman.access_token.split("!")[0],
			userId: userUrl.substring(userUrl.lastIndexOf("/") + 1),
		};
		process.env.SALESFORCE_LOGIN_URL = credentials.instanceUrl;
		return credentials;
	}

	performance = [];
	#showPerfomance() {
		let perf = process.memoryUsage();
		this.performance.push(perf);
		console.warn(`${new Date().toJSON()} >>> Performance ${JSON.stringify(perf)}`);
	}
}

dotenv.config();
new SalesforceClientLibraryPE_Sub().forEver();
