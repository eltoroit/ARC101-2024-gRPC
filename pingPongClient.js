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
		let messages = [];
		const target = "localhost:50051";
		const client = new this.nsProto.Game(target, grpc.credentials.createInsecure());

		const loop = () => {
			messages.push({ dttm: new Date().toJSON(), msg: `> PING (${times} sec)` });
			console.log(`${new Date().toJSON()} | >>> PING (${times} sec)`);
			client.ping({ data: JSON.stringify(messages), delay: times }, (err, response) => {
				if (err) {
					console.log(err);
					return;
				}
				console.log(`${new Date().toJSON()} | <<< PONG (${times} sec)`);
				messages = JSON.parse(response.data);

				times++;
				if (times <= 5) {
					loop();
				} else {
					console.log(messages);
				}
			});
		};

		messages.push({ dttm: new Date().toJSON(), msg: "ELTOROit | Initialized" });
		loop();
	}

	echo() {
		return new Promise((resolve, reject) => {
			const target = "localhost:50051";
			const client = new this.nsProto.Game(target, grpc.credentials.createInsecure(), { interceptors: [this.#interceptor] });
			console.log(`${new Date().toJSON()} | Start ECHO`);
			client.echo({ data: "Hello ELTOROit", delay: 2 }, (err, response) => {
				if (err) {
					reject(err);
					return;
				}
				console.log(`${new Date().toJSON()} | End ECHO`);
				console.log(response.data);
				resolve(response);
			});
		});
	}

	#interceptor(options, nextCall) {
		// Create a new InterceptingCall instance
		return new grpc.InterceptingCall(nextCall(options), {
			// Intercept the sendMessage operation
			sendMessage: (requestMessage, next) => {
				debugger;
				console.log("Intercepted request:", requestMessage);
				// Call the next interceptor or the original method
				next(requestMessage);
			},
			// Intercept the receiveMessage operation
			receiveMessage: (responseMessage, next) => {
				debugger;
				console.log("Intercepted response:", responseMessage);
				// Call the next interceptor or the original method
				next(responseMessage);
			},
		});
	}
}

let client = new Client();
client.echo().then(() => {
	client.mainLoop();
});
