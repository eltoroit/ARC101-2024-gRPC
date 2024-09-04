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
			const packageDef = protoLoader.loadSync("@ELTOROIT/protos/salesforce.proto", {});
			const grpcObj = grpc.loadPackageDefinition(packageDef);
			const sfdcPackage = grpcObj.eventbus.v1;
			const metaCallback = (_params, callback) => {
				// debugger;
				const testPostman = JSON.parse(process.env.TEST_POSTMAN);
				const meta = new grpc.Metadata();
				meta.add("accesstoken", testPostman.access_token);
				meta.add("instanceurl", testPostman.instance_url);
				meta.add("tenantid", testPostman.access_token.split("!")[0]);
				callback(null, meta);
			};
			const callCreds = grpc.credentials.createFromMetadataGenerator(metaCallback);
			const combCreds = grpc.credentials.combineChannelCredentials(grpc.credentials.createSsl(rootCert), callCreds);
			const client = new sfdcPackage.PubSub(Configuration.getPubSubEndpoint(), combCreds);
			const subscription = client.subscribe();
			subscription.write({
				numRequested: 5,
				topicName: "/data/AccountChangeEvent",
			});
			subscription.on("data", (data) => {
				debugger;
				console.log(JSON.stringify(data));
			});
			subscription.on("end", () => {
				debugger;
			});
			subscription.on("error", (error) => {
				debugger;
				console.log(error);
			});
			subscription.on("status", (status) => {
				debugger;
				console.log(status);
			});
			console.log("Wait for events");
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
