import grpc from "@grpc/grpc-js";
import protoLoader from "@grpc/proto-loader";

class Server {
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
	}

	add(call, callback) {
		let request = call.request;
		let { i, j } = request;
		callback(null, { k: i + j });
	}

	startServer() {
		const server = new grpc.Server();
		server.addService(this.nsProto.Math.service, {
			add: this.add,
		});
		server.bindAsync("0.0.0.0:50051", grpc.ServerCredentials.createInsecure(), (err, port) => {
			// server.start();
			console.log("Server is ready...");
		});
	}
}

const server = new Server();
server.startServer();
