class DemoRPC {
	async simpleCode() {
		let i = 2;
		let j = 3;
		let k = await this.add(i, j);
		return k;
	}

	async add(i, j) {
		return i + j;
	}
}

let demo = new DemoRPC();
demo.simpleCode().then((k) => {
	console.log(`Local procedure called: ${k}`);
});
