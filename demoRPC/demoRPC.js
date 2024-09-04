class DemoRPC {
	async simpleCode() {
		let i = 2;
		let j = 3;
		let k = i + j;
		return k;
	}
}

let demo = new DemoRPC();
demo.simpleCode().then((k) => {
	console.log(`No procedures called: ${k}`);
});
