import grpc from "@grpc/grpc-js";
import protoLoader from "@grpc/proto-loader";

class Client {
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

	mainLoop() {
		let times = 0;
		const target = "localhost:50051";
		const client = new this.nsProto.Game(target, grpc.credentials.createInsecure());

		const loop = () => {
			const msg = {
				times,
				dttm: new Date().toJSON(),
				message: `> PING #${times}`,
			};
			console.log(new Date().toJSON(), msg);
			client.ping(msg, (err, response) => {
				if (err) {
					console.log(err);
					return;
				}
				console.log(new Date().toJSON(), response);
				console.log("---");

				times++;
				if (times <= 5) {
					loop();
				}
			});
		};
		loop();
	}

	askToPlay() {
		return new Promise((resolve, reject) => {
			const target = "localhost:50051";
			const client = new this.nsProto.Game(target, grpc.credentials.createInsecure());
			// const client = new this.nsProto.Game(target, grpc.credentials.createInsecure(), { interceptors: [this.#interceptor] });
			const msg = {
				dttm: new Date().toJSON(),
				message: "Do you want to play ping-pong?",
				delay: 2,
			};
			console.log(msg);
			client.askToPlay(msg, (err, response) => {
				if (err) {
					reject(err);
					return;
				}
				console.log(new Date().toJSON(), response);
				if (response.isPlaying) {
					resolve(response);
				} else {
					reject(response);
				}
			});
		});
	}

	#interceptor(options, nextCall) {
		// Create a new InterceptingCall instance
		return new grpc.InterceptingCall(nextCall(options), {
			// Intercept the sendMessage operation
			sendMessage: (requestMessage, next) => {
				// debugger;
				console.log("Intercepted request:", requestMessage);
				// Call the next interceptor or the original method
				next(requestMessage);
			},
			// Intercept the receiveMessage operation
			receiveMessage: (responseMessage, next) => {
				// debugger;
				console.log("Intercepted response:", responseMessage);
				// Call the next interceptor or the original method
				next(responseMessage);
			},
		});
	}
}

let client = new Client();
client
	.askToPlay()
	.then(() => {
		client.mainLoop();
	})
	.catch(() => {
		console.log("Server does not want to play! Try again...");
	});
