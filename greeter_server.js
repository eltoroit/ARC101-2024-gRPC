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

function ping(call, callback) {
	let messages = JSON.parse(call.request.data);
	console.log(`${new Date().toJSON()} | >>> PING | ${call.path}`);
	setTimeout(() => {
		console.log(`${new Date().toJSON()} | <<< PONG | ${call.path}`);
		messages.push({ dttm: new Date().toJSON(), msg: "< PONG" });
		callback(null, { data: JSON.stringify(messages) });
	}, 5e3);
}

// Starts an RPC server that receives requests for the Greeter service at the sample server port
function main() {
	const server = new grpc.Server();
	// Greeter (service in .proto)
	server.addService(nsProto.Game.service, { ping });
	server.bindAsync("0.0.0.0:50051", grpc.ServerCredentials.createInsecure(), () => {
		// server.start();
		console.log("Ready...");
	});
}

main();
