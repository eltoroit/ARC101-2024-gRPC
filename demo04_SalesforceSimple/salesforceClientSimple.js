import fs from "fs";
import certifi from "certifi";
import * as dotenv from "dotenv";
import grpc from "@grpc/grpc-js";
import protoLoader from "@grpc/proto-loader";

class SalesforceClientSimple {
	totalEvents = 0;
	objLastReplayId = { valueBuffer: undefined, valueNumber: undefined };

	constructor() {
		const protoDescriptor = grpc.loadPackageDefinition(protoLoader.loadSync("@ELTOROIT/protos/salesforce.proto", {}));
		this.client = new protoDescriptor.eventbus.v1.PubSub(process.env.PUB_SUB_ENDPOINT, this.#getChannelCredentials());
	}

	forEver() {
		// Infinite loop, promise never resolves!
		// Using event loop to get a new thread and clean memory.
		return new Promise(async (resolve, reject) => {
			// Infinite loop, promise never resolves!
			const loop = async () => {
				try {
					await this.subscribe();
					this.#showPerfomance();
				} catch (ex) {
					console.log(`${new Date().toJSON()} >> Error handled`);
				}
				loop();
			};
			loop();
		});
	}

	subscribe() {
		const eventsCounter = { requested: 5, received: 0 };

		const makePayload = () => {
			let msg = {
				numRequested: eventsCounter.requested,
				topicName: "/data/AccountChangeEvent",
			};
			if (this.objLastReplayId.valueBuffer) {
				// From known replay Id
				msg.replayPreset = 2;
				msg.replayId = this.objLastReplayId.valueBuffer;
			} else {
				// -2: From the beginning
				msg.replayPreset = 1;
			}
			return msg;
		};

		const receivedData = (data) => {
			// debugger;
			if (!this.objLastReplayId.valueBuffer) {
				// Only show this for the first time.
				console.log(`=== === ===\n${new Date().toJSON()} >> Payload is binary\n=== === ===`);
				console.log(JSON.stringify(data));
				console.log(`=== === ===`);
				// console.log("Client:\n", this.client);
				// console.log("subscription:\n", subscription);
			}
			try {
				let found = false;
				data.events.forEach((item) => {
					found = true;
					this.objLastReplayId = {
						valueBuffer: item.replayId,
						valueNumber: this.#buffertoNumber(item.replayId),
					};
					eventsCounter.received++;
					console.log(
						`${new Date().toJSON()} >>> (${eventsCounter.received} of ${eventsCounter.requested})  ReplayId ${this.objLastReplayId.valueNumber}. Total received: ${++this
							.totalEvents} | ${item.event.payload.toString().substr(0, 50)}`
					);
				});
				if (!found) {
					throw "NO events found";
				}
			} catch (ex) {
				debugger;
				data.events = [];
				console.log(`${new Date().toJSON()} >> Could not understand payload`);
			} finally {
				console.log(`${new Date().toJSON()} >> Events received: ${data.events.length} new, ${this.totalEvents} total`);
			}
		};

		return new Promise((resolve, reject) => {
			const subscription = this.client.subscribe({});
			subscription.write(makePayload());
			subscription.on("data", (data) => {
				receivedData(data);
				if (eventsCounter.received >= eventsCounter.requested) {
					console.log(`${new Date().toJSON()} >> All requested events were received`);
					resolve();
				}
			});
			subscription.on("end", () => {
				console.log(`${new Date().toJSON()} >> Stream ended`);
				resolve();
			});
			subscription.on("error", (error) => {
				debugger;
				console.log(`${new Date().toJSON()} >> Stream error`);
				console.log(error);
				reject(error);
			});
			subscription.on("status", (status) => {
				if (status.code !== 0) {
					debugger;
					console.log(status);
				}
				console.log(`${new Date().toJSON()} >> Stream status`);
			});
			console.log(`${new Date().toJSON()} >> Waiting for stream`);
		});
	}

	#buffertoNumber(buffer) {
		// Because it's a binary message we need to extract the value from a buffer
		return Number(buffer.readBigUInt64BE());
	}

	#numberToBuffer(value) {
		// Because it's a binary message we need to put the number in a buffer
		const buf = Buffer.allocUnsafe(8);
		buf.writeBigUInt64BE(BigInt(value), 0);
		return buf;
	}

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

	performance = [];
	#showPerfomance() {
		let perf = process.memoryUsage();
		this.performance.push(perf);
		console.warn(`${new Date().toJSON()} >>> Performance ${JSON.stringify(perf)}`);
	}
}

dotenv.config();
new SalesforceClientSimple().forEver();

// const jsonString = JSON.stringify(status, replacer);
// const replacer = (key, value) => {
// 	if (value instanceof Buffer) {
// 		// return { type: "Buffer", data: value.toString("base64") };
// 		return {
// 			type: "Buffer",
// 			text: value.toString(),
// 			base64: value.toString("base64"),
// 		};
// 	}
// 	if (typeof value === "object" && value !== null) {
// 		return Object.fromEntries(Object.entries(value).map(([k, v]) => [k, replacer(k, v)]));
// 	}
// 	return value;
// };
