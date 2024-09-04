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

	askToPlay(call, callback) {
		let request = call.request;
		let delay = request.delay ? request.delay : 0;
		console.log("Player wants to play... ", request);
		setTimeout(() => {
			const msg = {
				dttm: new Date().toJSON(),
				message: "Yes, let's play!",
				isPlaying: Math.random() > 0.5,
			};
			console.log(msg);
			callback(null, msg);
		}, delay * 1e3);
	}

	ping(call, callback) {
		let delay = 2;
		let request = call.request;
		let times = request.times ? request.times : "?";
		let message = request.message ? request.message : "ERROR NO MESAAGE RECEIVED";
		console.log(new Date().toJSON(), request);
		setTimeout(() => {
			const msg = {
				times,
				dttm: new Date().toJSON(),
				message: `${new Date().toJSON()} | <<< PONG #${times}`,
			};
			console.log(msg);
			callback(null, msg);
		}, delay * 1e3);
	}

	startServer() {
		const server = new grpc.Server();
		server.addService(this.nsProto.Game.service, {
			ping: this.ping,
			askToPlay: this.askToPlay,
		});
		server.bindAsync("0.0.0.0:50051", grpc.ServerCredentials.createInsecure(), (err, port) => {
			// server.start();
			console.log("Server is ready...");
		});
	}
}

const server = new Server();
server.startServer();
