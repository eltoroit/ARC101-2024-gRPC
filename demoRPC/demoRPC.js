class DemoRPC {
	async simpleCode() {
		let i = 2;
		let j = 3;
		let k = await this.add(i, j);
		console.log(`Remote procedure called: ${k}`);
		return k;
	}

	async add(i, j) {
		const response = await fetch(`http://localhost:3000/add?i=${i}&j=${j}`);
		const data = await response.json();

		return data.sum;
	}
}

let demo = new DemoRPC();
demo.simpleCode().then((k) => {
	console.log(`END: ${k}`);
});
