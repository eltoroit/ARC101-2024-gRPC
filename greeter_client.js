const grpc = require("@grpc/grpc-js");
const protoLoader = require("@grpc/proto-loader");
const packageDefinition = protoLoader.loadSync("@ELTOROIT/protos/ping-pong.proto", {
	keepCase: true,
	longs: String,
	enums: String,
	defaults: true,
	oneofs: true,
});
const protoDescriptor = grpc.loadPackageDefinition(packageDefinition);
const nsProto = protoDescriptor.pingPong;

function main() {
	let times = 0;
	let messages = [];
	const target = "localhost:50051";
	const client = new nsProto.Game(target, grpc.credentials.createInsecure());

	const loop = () => {
		messages.push({ dttm: new Date().toJSON(), msg: "> PING" });
		console.log(`${new Date().toJSON()} | >>> PING | sayHello`);
		client.ping({ data: JSON.stringify(messages) }, function (err, response) {
			console.log(`${new Date().toJSON()} | <<< PONG | sayHello`);
			messages = JSON.parse(response.data);

			times++;
			if (times < 5) {
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

main();
