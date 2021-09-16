const express = require("express");
const speakeasy = require("speakeasy");
const uuid = require("uuid");
const { JsonDB } = require("node-json-db");
const { Config } = require("node-json-db/dist/lib/JsonDBConfig");

const app = express();
app.use(express.json());

const db = new JsonDB(new Config("dummyDatabase", true, false, "/"));

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
	console.log(`Server listening on port ${PORT}`);
});

app.get("/api", (req, res) => {
	res.json({ message: "Welcome" });
});

app.post("/api/register", (req, res) => {
	const id = uuid.v4();
	const name = req.body.name;

	try {
		const path = `/user/${id}`;
		const temp_secret = speakeasy.generateSecret();
		db.push(path, { id, username: name, token: temp_secret.base32 });
		res.status(200).send({ id, username: name, token: temp_secret.base32 });
	} catch (e) {
		console.log(error);
		res.status(500).send({ message: "Internal Server Error" });
	}
});

app.post("/api/validate", (req, res) => {
	const { id, token } = req.body;
	try {
		const path = `/user/${id}`;
		const user = db.getData(path);
		const secret = user.token;

		const validate = speakeasy.totp.verify({
			secret,
			encoding: "base32",
			token,
			window: 1
		});

		if (validate) {
			res.status(200).send({ message: "Valid" });
		} else {
			res.status(400).send({ message: "Invalid" });
		}
	} catch (error) {
		console.log(error);
		res.status(500).send({ message: "Internal Server Error" });
	}
});
