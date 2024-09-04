// node demoRPC/demoRPC_03.js
class DemoRPC {
	async simpleCode() {
		let i = 2;
		let j = 3;
		let k = await this.add(i, j);
		console.log(`System procedure called: ${k}`);
		return k;
	}

	async add(i, j) {
		return i + j;
	}
}

let demo = new DemoRPC();
demo.simpleCode().then((k) => {
	console.log(`END: ${k}`);
});
