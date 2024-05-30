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
				// Authenticate somehow :-)
				const conMetadata = {
					accessToken: "00DO2000002c1un!AQEAQCsD1MkBNTcreBRcHun4h2sLR0A067IGJHdwZd8Wwqvh1.R4mKQXuLDke3I6IpVtty7qLs9PmKeRNPiJe.8jp3UQRJ9y",
					instanceUrl: "https://customization-data-4653-dev-ed.scratch.my.salesforce.com",
					organizationId: "00DO2000002c1unMAA",
					username: "test-4ynoc3sdn6er@example.com",
				};

				const meta = new grpc.Metadata();
				meta.add("accesstoken", conMetadata.accessToken);
				meta.add("instanceurl", conMetadata.instanceUrl);
				meta.add("tenantid", conMetadata.organizationId);
				callback(null, meta);
			};
			const callCreds = grpc.credentials.createFromMetadataGenerator(metaCallback);
			const combCreds = grpc.credentials.combineChannelCredentials(grpc.credentials.createSsl(rootCert), callCreds);

			// Return pub/sub gRPC client
			// const target = "localhost:50051";
			// const client = new this.nsProto.Game(target, grpc.credentials.createInsecure());
			const client = new sfdcPackage.PubSub(Configuration.getPubSubEndpoint(), combCreds);

			client.subscribe(
				{
					topic_name: "/data/AccountChangeEvent",
					replay_preset: -1, // Subscription starting point.
					num_requested: 200, // Number of events a client is ready to accept.
				},
				(err, response) => {
					debugger;
					if (err) {
						console.error(err);
					}

					console.log(response);
					// debugger;
					// console.log(
					// 	`Handling ${event.payload.ChangeEventHeader.entityName} change event ` +
					// 		`with ID ${event.replayId} ` +
					// 		`on channel ${eventEmitter.getTopicName()} ` +
					// 		`(${eventEmitter.getReceivedEventCount()}/${eventEmitter.getRequestedEventCount()} ` +
					// 		`events received so far)`
					// );
					// console.log(event);
					// console.log(JSON.stringify(event, null, 2));
				}
			);
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
