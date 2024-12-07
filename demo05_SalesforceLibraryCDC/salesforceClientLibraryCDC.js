import * as dotenv from "dotenv";
import PubSubApiClient from "salesforce-pubsub-api-client";

class SalesforceClientLibraryCDC {
	totalEvents = 0;
	lastReplayId = null;
	channel = "/data/AccountChangeEvent"; // /data/ChangeEvents

	async forEver() {
		const credentials = this.#getCredentialsViaPostman();

		// Infinite loop, promise never resolves!
		return new Promise(async () => {
			const loop = async () => {
				try {
					await this.subscribe(credentials);
				} catch (ex) {
					console.log(`${new Date().toJSON()} >> Error handled`);
				}
				loop();
			};
			loop();
		});
	}

	async subscribe(credentials) {
		let etPromise;
		const eventsCounter = { requested: 5, received: 0 };

		let client = new PubSubApiClient(credentials, this.#logger);
		await client.connect();
		const subscribeCallback = (subscription, callbackType, data) => {
			switch (callbackType) {
				case "event":
					const charCount = 150;
					this.totalEvents++;
					eventsCounter.received++;
					this.lastReplayId = data.replayId;
					const record = this.#stringify(data);
					console.log(
						`${new Date().toJSON()} >>> (${eventsCounter.received} of ${eventsCounter.requested})  ReplayId ${data.replayId}. Total received: ${
							this.totalEvents
						} | Data[${charCount}]: ${record.substring(0, charCount)}...`
					);
					break;
				case "lastEvent":
					// Last event received
					eventsCounter.received = 0;
					console.log(`${subscription.topicName} - Reached last of ${subscription.requestedEventCount} requested event on channel. Closing connection.`);
					etPromise.resolve();
					this.#showPerfomance();
					break;
				case "end":
					// Client closed the connection
					console.log("Client shut down gracefully.");
					etPromise.resolve();
					this.#showPerfomance();
					break;
				default: // Other events types: error, grpcStatus, grpcKeepAlive
					const message = this.#stringify(data);
					console.log(`${new Date().toJSON()} >>> Unhnandled Event [${callbackType}] | Data: ${message}`);
					break;
			}
		};
		return new Promise(async (resolve, reject) => {
			// Allowing the subscribeCallback to resolve the promise.
			etPromise = { resolve, reject };
			try {
				if (this.lastReplayId) {
					// From known replay Id
					client.subscribeFromReplayId(this.channel, subscribeCallback, eventsCounter.requested, this.lastReplayId);
				} else {
					// From the beginning
					client.subscribeFromEarliestEvent(this.channel, subscribeCallback, eventsCounter.requested);
				}
				console.warn(`${new Date().toJSON()} >> Subscription started`);
			} catch (error) {
				console.error(error);
			}
		});
	}

	#stringify(data) {
		return JSON.stringify(
			data,
			(key, value) => {
				if (["bigint", "buffer"].includes(typeof value)) {
					debugger;
					return value.toString();
				} else {
					return value;
				}
			},
			null
		);
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

	// This method helps to see if I have any memory leak in th infinite loop.
	performance = [];
	#showPerfomance() {
		/*
		Properties Returned by process.memoryUsage()
		rss (Resident Set Size): This represents the total amount of memory allocated for the process execution, including all C++ objects bound to JavaScript objects managed by V8. It encompasses both the heap and stack memory.
		heapTotal: This indicates the total size of the allocated heap, which is the memory reserved for dynamic allocation. It includes all memory that can be used for storing objects and arrays.
		heapUsed: This shows the actual amount of memory currently being used in the heap. It reflects how much of the allocated heap is actively in use at any given moment.
		external: This property measures the memory used by C++ objects bound to JavaScript objects managed by V8, such as Buffer instances or other native add-ons.
		arrayBuffers: Memory used by ArrayBuffer instances. This is particularly useful for applications that make extensive use of typed arrays or binary data, as it provides visibility into the memory consumed by these structures.
		*/
		setTimeout(() => {
			let perf = process.memoryUsage();
			this.performance.push(perf);
			process.stdout.write(`\x1B[2m`); // Dim output
			console.warn(`${new Date().toJSON()} >>> Performance ${JSON.stringify(perf)}`);
			process.stdout.write(`\x1b[0m`); // Reset colors
		}, 0);
	}
}

dotenv.config();
new SalesforceClientLibraryCDC().forEver();
