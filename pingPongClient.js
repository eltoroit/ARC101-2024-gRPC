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
			client.ping({ data: JSON.stringify(messages), delay: times }, function (err, response) {
				console.log(`${new Date().toJSON()} | <<< PONG (${times} sec)`);
				messages = JSON.parse(response.data);

				times++;
				if (times <= 5) {
					setTimeout(() => {
						loop();
					}, 1e3);
				} else {
					console.log(messages);
				}
			});
		};

		messages.push({ dttm: new Date().toJSON(), msg: "ELTOROit | Initialized" });
		loop();
	}

	mainSingle() {
		let messages = [];
		const target = "localhost:50051";
		const client = new this.nsProto.Game(target, grpc.credentials.createInsecure());

		messages.push({ dttm: new Date().toJSON(), msg: "ELTOROit | Initialized" });
		messages.push({ dttm: new Date().toJSON(), msg: "> PING" });
		console.log(`${new Date().toJSON()} | >>> PING`);
		client.ping({ data: JSON.stringify(messages), delay: 0.5e3 }, function (err, response) {
			console.log(`${new Date().toJSON()} | <<< PONG`);
		});
	}
}

let client = new Client();
client.mainLoop();
// client.mainSingle();
