import fs from "fs";
import certifi from "certifi";
import * as dotenv from "dotenv";
import grpc from "@grpc/grpc-js";
import protoLoader from "@grpc/proto-loader";

class SalesforceClientSimple {
	totalEvents = 0;
	replayPreset = {};
	objLastReplayId = { valueBuffer: undefined, valueNumber: undefined };

	constructor() {
		const protoDescriptor = grpc.loadPackageDefinition(protoLoader.loadSync("@ELTOROIT/protos/salesforce.proto", {}));
		this.client = new protoDescriptor.eventbus.v1.PubSub(process.env.PUB_SUB_ENDPOINT, this.#getChannelCredentials());
		protoDescriptor.eventbus.v1.ReplayPreset.type.value.forEach((option) => {
			this.replayPreset[option.name] = option.number;
		});
	}

	forEver() {
		// Infinite loop, promise never resolves!
		return new Promise(async (resolve, reject) => {
			// Using event loop to get a new thread and clean memory.
			const loop = async () => {
				try {
					await this.subscribe();
				} catch (ex) {
					console.error(`${new Date().toJSON()} >> Error handled`);
					console.error(ex);
				}
				loop();
			};
			loop();
		});
	}

	async subscribe() {
		const eventsCounter = { requested: 5, received: 0 };

		const makePayload = () => {
			let msg = {
				numRequested: eventsCounter.requested,
				topicName: "/data/AccountChangeEvent",
			};
			if (this.objLastReplayId.valueBuffer) {
				// From known replay Id
				msg.replayPreset = this.replayPreset.CUSTOM;
				msg.replayId = this.objLastReplayId.valueBuffer;
			} else {
				// From the beginning
				msg.replayPreset = this.replayPreset.EARLIEST;
			}
			return msg;
		};

		const displayRawData = (data) => {
			console.log(`\x1B[2m`); // Dim output
			console.log(`=== === ===\n${new Date().toJSON()} >> Payload:`);
			console.log(`${JSON.stringify(data)}`);
			console.log(`=== === ===`);
			console.log(`\x1b[0m`); // Reset colors
		};

		const processReceivedData = (data) => {
			// debugger;
			let found = false;
			displayRawData(data);
			if (data.events) {
				try {
					data.events.forEach((item) => {
						found = true;
						this.objLastReplayId = {
							valueBuffer: item.replayId,
							valueNumber: this.#buffertoNumber(item.replayId),
						};
						eventsCounter.received++;
						console.log(
							`${new Date().toJSON()} >>> (${eventsCounter.received} of ${eventsCounter.requested})  ReplayId ${this.objLastReplayId.valueNumber}. Total received: ${++this
								.totalEvents} | Data[50]: ${item.event.payload.toString().substr(0, 50)}...`
						);
					});
				} catch (ex) {
					debugger;
					data.events = [];
					console.error(`${new Date().toJSON()} >> Could not display payload`);
				}
			}
			if (!found) {
				console.warn(`${new Date().toJSON()} >> "NO events found"`);
			}
			console.log(`${new Date().toJSON()} >> Events received: ${data.events ? data.events.length : 0} new, ${this.totalEvents} total`);
			this.#showPerfomance();
		};

		const handleSubscription = () => {
			return new Promise((resolve, reject) => {
				const subscription = this.client.subscribe({});
				subscription.write(makePayload());
				subscription.on("data", (data) => {
					processReceivedData(data);
					if (eventsCounter.received >= eventsCounter.requested) {
						console.log(`${new Date().toJSON()} >> All requested events were received, subscribing again...`);
						resolve();
					}
				});
				subscription.on("end", () => {
					console.log(`${new Date().toJSON()} >> Stream ended, subscribing again...`);
					resolve();
				});
				subscription.on("error", (error) => {
					debugger;
					console.log(`${new Date().toJSON()} >> Stream error, subscribing again...`);
					console.error(error);
					reject(error);
				});
				subscription.on("status", (status) => {
					if (status.code !== 0) {
						debugger;
						console.log(status);
					}
					console.log(`${new Date().toJSON()} >> Stream status`);
				});
			});
		};

		// Ready, set, go!
		console.warn(`${new Date().toJSON()} >> Subscription started`);
		await handleSubscription();
	}

	// Handles the buffer data
	#buffertoNumber(buffer) {
		// Because it's a binary message we need to extract the value from a buffer
		return Number(buffer.readBigUInt64BE());
	}

	#numberToBuffer(value) {
		debugger;
		// Because it's a binary message we need to put the number in a buffer
		const buf = Buffer.allocUnsafe(8);
		buf.writeBigUInt64BE(BigInt(value), 0);
		return buf;
	}

	// Using the results the username-password OAuth flow from Postman, get the accesstoken and other details
	// https://www.postman.com/aperez-eltoroit/workspace/integration-architect-eltoroit/request/9044268-58e51b76-c404-463a-a18f-1718cd8e9fea
	#getChannelCredentials() {
		return grpc.credentials.combineChannelCredentials(
			grpc.credentials.createSsl(fs.readFileSync(certifi)),
			grpc.credentials.createFromMetadataGenerator((_params, callback) => {
				const testPostman = JSON.parse(process.env.TEST_POSTMAN);
				const meta = new grpc.Metadata();
				meta.add("accesstoken", testPostman.access_token);
				meta.add("instanceurl", testPostman.instance_url);
				meta.add("tenantid", testPostman.access_token.split("!")[0]);
				callback(null, meta);
			})
		);
	}

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
			console.log(`\x1B[2m`); // Dim output
			console.warn(`${new Date().toJSON()} >>> Performance ${JSON.stringify(perf)}`);
			console.log(`\x1b[0m`); // Reset colors
			// debugger;
		}, 0);
	}
}

dotenv.config();
new SalesforceClientSimple().forEver();
