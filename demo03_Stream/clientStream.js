import grpc from "@grpc/grpc-js";
import protoLoader from "@grpc/proto-loader";

class DemoStream {
	constructor() {
		const protoDescriptor = grpc.loadPackageDefinition(protoLoader.loadSync("@ELTOROIT/protos/demoStream.proto", {}));
		this.client = new protoDescriptor.demoStream.Clock("localhost:50051", grpc.credentials.createInsecure());
	}

	async getTime() {
		return new Promise((resolve, reject) => {
			this.client.getTime({}, (err, response) => {
				resolve(response.dttm);
			});
		});
	}

	async stream() {
		let response;
		return new Promise((resolve, reject) => {
			console.log("Stream started");
			let call = this.client.stream({ max: 5 });
			call.on("end", (...params) => {
				if (params.length !== 0) {
					debugger;
				}
				resolve(response);
			});
			call.on("error", (...params) => {
				debugger;
				console.log(params);
				// An error has occurred and the stream has been closed.
			});
			call.on("status", (...params) => {
				if (params.length !== 1) {
					debugger;
				}
				console.log("Status: ", params[0]);
			});
			call.on("data", function (...params) {
				if (params.length !== 1) {
					debugger;
				}
				response = params[0];
				console.log("Data: ", response);
			});
		});
	}
}

let demo = new DemoStream();
demo.getTime().then((dttm) => {
	console.log("DTTM", dttm);
	demo.stream().then((data) => {
		console.log("END", data);
	});
});
