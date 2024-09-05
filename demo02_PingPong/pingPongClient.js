import grpc from "@grpc/grpc-js";
import protoLoader from "@grpc/proto-loader";

class Client {
	constructor() {
		const protoDescriptor = grpc.loadPackageDefinition(protoLoader.loadSync("@ELTOROIT/protos/ping-pong.proto", {}));
		this.client = new protoDescriptor.pingPong.Game("localhost:50051", grpc.credentials.createInsecure());
	}

	mainLoop() {
		let times = 0;
		const loop = () => {
			const msg = {
				times,
				dttm: new Date().toJSON(),
				message: `> PING #${times}`,
			};
			console.log(new Date().toJSON(), msg);
			this.client.ping(msg, (err, response) => {
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
			const msg = {
				dttm: new Date().toJSON(),
				message: "Do you want to play ping-pong?",
				delay: 2,
			};
			console.log(msg);
			this.client.askToPlay(msg, (err, response) => {
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

	// // this.client = new protoDescriptor.pingPong.Game("localhost:50051", grpc.credentials.createInsecure(), { interceptors: [this.#interceptor] });
	// #interceptor(options, nextCall) {
	// 	// Create a new InterceptingCall instance
	// 	return new grpc.InterceptingCall(nextCall(options), {
	// 		// Intercept the sendMessage operation
	// 		sendMessage: (requestMessage, next) => {
	// 			// debugger;
	// 			console.log("Intercepted request:", requestMessage);
	// 			// Call the next interceptor or the original method
	// 			next(requestMessage);
	// 		},
	// 		// Intercept the receiveMessage operation
	// 		receiveMessage: (responseMessage, next) => {
	// 			// debugger;
	// 			console.log("Intercepted response:", responseMessage);
	// 			// Call the next interceptor or the original method
	// 			next(responseMessage);
	// 		},
	// 	});
	// }
}

let client = new Client();
client
	.askToPlay()
	.then(() => {
		client.mainLoop();
	})
	.catch(() => {
		console.error("Server does not want to play! Try again...");
	});
