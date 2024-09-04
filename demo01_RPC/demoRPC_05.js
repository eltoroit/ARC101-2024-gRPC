import grpc from "@grpc/grpc-js";
import protoLoader from "@grpc/proto-loader";

class DemoRPC {
	constructor() {
		this.packageDefinition = protoLoader.loadSync("@ELTOROIT/protos/demoRPC.proto", {
			keepCase: true,
			longs: String,
			enums: String,
			defaults: true,
			oneofs: true,
		});
		this.protoDescriptor = grpc.loadPackageDefinition(this.packageDefinition);
		this.nsProto = this.protoDescriptor.demoRPC;
		this.client = new this.nsProto.Math("localhost:50051", grpc.credentials.createInsecure());
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

let demo = new DemoRPC();
demo.simpleCode().then((k) => {
	console.log(`END: ${k}`);
});
