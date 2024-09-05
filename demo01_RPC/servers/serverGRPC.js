import grpc from "@grpc/grpc-js";
import protoLoader from "@grpc/proto-loader";

class Server {
	add(call, callback) {
		let request = call.request;
		let { i, j } = request;
		callback(null, { k: i + j });
	}

	startServer() {
		const server = new grpc.Server();
		const protoDescriptor = grpc.loadPackageDefinition(protoLoader.loadSync("@ELTOROIT/protos/demoRPC.proto", {}));
		server.addService(protoDescriptor.demoRPC.Math.service, {
			add: this.add,
		});
		server.bindAsync("0.0.0.0:50051", grpc.ServerCredentials.createInsecure(), (err, port) => {
			console.log("Server is ready...");
		});
	}
}

new Server().startServer();
