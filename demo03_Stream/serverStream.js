import grpc from "@grpc/grpc-js";
import protoLoader from "@grpc/proto-loader";

class ServerStream {
	constructor() {
		this.packageDefinition = protoLoader.loadSync("@ELTOROIT/protos/demoStream.proto", {
			keepCase: true,
			longs: String,
			enums: String,
			defaults: true,
			oneofs: true,
		});
		this.protoDescriptor = grpc.loadPackageDefinition(this.packageDefinition);
		this.nsProto = this.protoDescriptor.demoStream;
	}

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
		server.addService(this.nsProto.Clock.service, {
			stream: this.stream,
			getTime: this.getTime,
		});
		server.bindAsync("0.0.0.0:50051", grpc.ServerCredentials.createInsecure(), (err, port) => {
			// server.start();
			console.log("Server is ready...");
		});
	}
}

const serverStream = new ServerStream();
serverStream.startServer();
