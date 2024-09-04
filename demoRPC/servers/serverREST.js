import express from "express";
const app = express();
const PORT = 3000;

app.get("/add", (req, res) => {
	let { i, j } = req.query;
	i = parseInt(i, 10);
	j = parseInt(j, 10);

	if (isNaN(i) || isNaN(j)) {
		return res.status(503).json({ error: "Invalid input. Please provide two integers." });
	}
	const k = i + j;
	res.json({ sum: k });
});

app.listen(PORT, () => {
	console.log(`Server is running on http://localhost:${PORT}`);
});
