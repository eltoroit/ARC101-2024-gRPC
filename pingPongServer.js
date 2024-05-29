import grpc from "@grpc/grpc-js";
import protoLoader from "@grpc/proto-loader";

class Server {
	constructor() {
		this.packageDefinition = protoLoader.loadSync("@ELTOROIT/protos/ping-pong.proto", {
			keepCase: true,
			longs: String,
			enums: String,
			defaults: true,
			oneofs: true,
		});
		this.protoDescriptor = grpc.loadPackageDefinition(this.packageDefinition);
		this.nsProto = this.protoDescriptor.pingPong;
	}

	ping(call, callback) {
		let request = call.request;
		let delay = request.delay ? request.delay : 0;
		let messages = JSON.parse(request.data);
		console.log(`${new Date().toJSON()} | >>> PING (${delay} sec)`);
		setTimeout(() => {
			console.log(`${new Date().toJSON()} | <<< PONG (${delay} sec)`);
			messages.push({ dttm: new Date().toJSON(), msg: `< PONG (${delay} sec)` });
			callback(null, { data: JSON.stringify(messages) });
		}, delay * 1e3);
	}

	startServer() {
		const server = new grpc.Server();
		server.addService(this.nsProto.Game.service, { ping: this.ping });
		server.bindAsync("0.0.0.0:50051", grpc.ServerCredentials.createInsecure(), () => {
			// server.start();
			console.log("Ready...");
		});
	}
}

const server = new Server();
server.startServer();
