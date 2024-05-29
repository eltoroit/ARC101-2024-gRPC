const grpc = require("@grpc/grpc-js");
const protoLoader = require("@grpc/proto-loader");
const packageDefinition = protoLoader.loadSync("@ELTOROIT/protos/helloworld.proto", {
	keepCase: true,
	longs: String,
	enums: String,
	defaults: true,
	oneofs: true,
});
const protoDescriptor = grpc.loadPackageDefinition(packageDefinition);
// helloworld (package in .proto)
const nsProto = protoDescriptor.helloworld;

function main() {
	const target = "localhost:50051";
	// Greeter (service in .proto)
	const client = new nsProto.Greeter(target, grpc.credentials.createInsecure());

	let messages = [];
	messages.push({ dttm: new Date().toJSON(), msg: "ELTOROit | Initialized" });
	messages.push({ dttm: new Date().toJSON(), msg: "> PING" });
	console.log(`${new Date().toJSON()} | >>> PING | sayHello`);
	client.sayHello({ jsonMessages: JSON.stringify(messages) }, function (err, response) {
		console.log(`${new Date().toJSON()} | <<< PONG | sayHello`);
		messages = JSON.parse(response.jsonMessages);
		setTimeout(() => {
			messages.push({ dttm: new Date().toJSON(), msg: "> PING" });
			console.log(`${new Date().toJSON()} | >>> PING  | sayHelloAgain`);
			client.sayHelloAgain({ jsonMessages: JSON.stringify(messages) }, function (err, response) {
				console.log(`${new Date().toJSON()} | <<< PONG | sayHelloAgain`);
				console.log(JSON.parse(response.jsonMessages));
			});
		}, 5e3);
	});
}

main();
