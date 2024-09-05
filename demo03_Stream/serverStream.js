import grpc from "@grpc/grpc-js";
import protoLoader from "@grpc/proto-loader";

class ServerStream {
	getTime(call, callback) {
		callback(null, { dttm: new Date().toJSON() });
	}

	stream(call) {
		let counter = 0;
		let { max } = call.request;
		const timer = setInterval(() => {
			call.write({ dttm: new Date().toJSON(), max, counter: ++counter });
			if (counter >= max) {
				clearInterval(timer);
				call.end();
			}
		}, 1e3);
	}

	startServer() {
		const server = new grpc.Server();
		const protoDescriptor = grpc.loadPackageDefinition(protoLoader.loadSync("@ELTOROIT/protos/demoStream.proto", {}));
		server.addService(protoDescriptor.demoStream.Clock.service, {
			stream: this.stream,
			getTime: this.getTime,
		});
		server.bindAsync("0.0.0.0:50051", grpc.ServerCredentials.createInsecure(), (err, port) => {
			// server.start();
			console.log("Server is ready...");
		});
	}
}

new ServerStream().startServer();
