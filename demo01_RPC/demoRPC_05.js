import grpc from "@grpc/grpc-js";
import protoLoader from "@grpc/proto-loader";

class DemoRPC {
	constructor() {
		const protoDescriptor = grpc.loadPackageDefinition(protoLoader.loadSync("@ELTOROIT/protos/demoRPC.proto", {}));
		this.client = new protoDescriptor.demoRPC.Math("localhost:50051", grpc.credentials.createInsecure());
	}

	async simpleCode() {
		let i = 2;
		let j = 3;
		let k = await this.add(i, j);
		console.log(`gRPC: ${k}`);
		return k;
	}

	async add(i, j) {
		return new Promise((resolve, reject) => {
			this.client.add({ i, j }, (err, response) => {
				resolve(response.k);
			});
		});
	}
}

new DemoRPC().simpleCode().then((k) => {
	console.log(`END: ${k}`);
});
