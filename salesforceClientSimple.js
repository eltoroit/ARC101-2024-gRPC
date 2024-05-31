import fs from "fs";
import certifi from "certifi";
import * as dotenv from "dotenv";
import grpc from "@grpc/grpc-js";
import protoLoader from "@grpc/proto-loader";
import Configuration from "./configuration.js";
import { Console } from "console";

class Client {
	main() {
		return new Promise((resolve, reject) => {
			const rootCert = fs.readFileSync(certifi);

			// this.packageDefinition = protoLoader.loadSync("@ELTOROIT/protos/ping-pong.proto", {});
			const packageDef = protoLoader.loadSync("@ELTOROIT/protos/salesforce.proto", {});

			// this.protoDescriptor = grpc.loadPackageDefinition(this.packageDefinition);
			const grpcObj = grpc.loadPackageDefinition(packageDef);

			// this.nsProto = this.protoDescriptor.pingPong;
			const sfdcPackage = grpcObj.eventbus.v1;

			const metaCallback = (_params, callback) => {
				debugger;
				const testPostman = JSON.parse(process.env.TEST_POSTMAN);

				const meta = new grpc.Metadata();
				meta.add("accesstoken", testPostman.access_token);
				meta.add("instanceurl", testPostman.instance_url);
				meta.add("tenantid", testPostman.access_token.split("!")[0]);
				callback(null, meta);
			};
			const callCreds = grpc.credentials.createFromMetadataGenerator(metaCallback);
			const combCreds = grpc.credentials.combineChannelCredentials(grpc.credentials.createSsl(rootCert), callCreds);

			// Return pub/sub gRPC client
			// const target = "localhost:50051";
			// const client = new this.nsProto.Game(target, grpc.credentials.createInsecure());
			const client = new sfdcPackage.PubSub(Configuration.getPubSubEndpoint(), combCreds);
			const subscription = client.subscribe();
			// subscription.write({
			// 	topic_name: "/data/AccountChangeEvent",
			// 	replay_preset: -1, // Subscription starting point.
			// 	num_requested: 200, // Number of events a client is ready to accept.
			// });
			subscription.write({ topicName: "/data/AccountChangeEvent", numRequested: 100 });
			subscription.on("data", (data) => {
				console.log(data);
				debugger;
			});
			subscription.on("end", () => {
				debugger;
			});
			subscription.on("error", (error) => {
				console.log(error);
				debugger;
			});
			subscription.on("status", (status) => {
				console.log(status);
				debugger;
			});

			// client.subscribe(
			// 	{
			// 		topic_name: "/data/AccountChangeEvent",
			// 		replay_preset: -1, // Subscription starting point.
			// 		num_requested: 200, // Number of events a client is ready to accept.
			// 	},
			// 	(err, response) => {
			// 		debugger;
			// 		if (err) {
			// 			console.error(err);
			// 		}

			// 		console.log(response);
			// 		// debugger;
			// 		// console.log(
			// 		// 	`Handling ${event.payload.ChangeEventHeader.entityName} change event ` +
			// 		// 		`with ID ${event.replayId} ` +
			// 		// 		`on channel ${eventEmitter.getTopicName()} ` +
			// 		// 		`(${eventEmitter.getReceivedEventCount()}/${eventEmitter.getRequestedEventCount()} ` +
			// 		// 		`events received so far)`
			// 		// );
			// 		// console.log(event);
			// 		// console.log(JSON.stringify(event, null, 2));
			// 	}
			// );
		});
	}
}

dotenv.config();
let client = new Client();
client
	.main()
	.then((data) => {
		console.log("DONE");
	})
	.catch((err) => {
		console.log("Error");
		console.log(err);
	});
