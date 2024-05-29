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

// sayHello (rpc function defined in .proto. But implemened here)
function sayHello(call, callback) {
	let messages = JSON.parse(call.request.jsonMessages);
	console.log(`${new Date().toJSON()} | >>> PING | ${call.path}`);
	setTimeout(() => {
		console.log(`${new Date().toJSON()} | <<< PONG | ${call.path}`);
		messages.push({ dttm: new Date().toJSON(), msg: "< PONG" });
		callback(null, { jsonMessages: JSON.stringify(messages) });
	}, 5e3);
}

function sayHelloAgain(call, callback) {
	let messages = JSON.parse(call.request.jsonMessages);
	console.log(`${new Date().toJSON()} | >>> PING | ${call.path}`);
	setTimeout(() => {
		console.log(`${new Date().toJSON()} | <<< PONG | ${call.path}`);
		messages.push({ dttm: new Date().toJSON(), msg: "< PONG" });
		callback(null, { jsonMessages: JSON.stringify(messages) });
	}, 5e3);
}

// Starts an RPC server that receives requests for the Greeter service at the sample server port
function main() {
	const server = new grpc.Server();
	// Greeter (service in .proto)
	server.addService(nsProto.Greeter.service, { sayHello, sayHelloAgain });
	server.bindAsync("0.0.0.0:50051", grpc.ServerCredentials.createInsecure(), () => {
		// server.start();
		console.log("Ready...");
	});
}

main();
