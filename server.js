// importing all the needed libraries
const express = require("express");
const speakeasy = require("speakeasy");
const uuid = require("uuid");
const { JsonDB } = require("node-json-db");
const { Config } = require("node-json-db/dist/lib/JsonDBConfig");

// setting up the express app
const app = express();
app.use(express.json());

// making new database
const db = new JsonDB(new Config("dummyDatabase", true, false, "/"));

// defining the port
const PORT = process.env.PORT || 3000;

// listening the port
app.listen(PORT, () => {
	console.log(`Server listening on port ${PORT}`);
});

// simple get request
app.get("/api", (req, res) => {
	res.json({ message: "Welcome" });
});

// api to register the user
app.post("/api/register", (req, res) => {
	// taking the data from the body of request
	const id = uuid.v4();
	const name = req.body.name;

	try {
		// designing the path to store the data into json format
		const path = `/user/${id}`;
		const temp_secret = speakeasy.generateSecret();

		// pushing the data into the database
		db.push(path, { id, username: name, temp_secret });

		// returning id, username and otp to the user
		res.status(200).send({ id, username: name, token: temp_secret.base32 });
	} catch (e) {
		// handling the error
		res.status(500).send({ message: "Error generating the user" });
	}
});

// token verification method
app.post("/api/verify", (req, res) => {
	// taking the data from the body of request
	const { id, token } = req.body;
	try {
		// designing the path to store the data into json format
		const path = `/user/${id}`;
		const user = db.getData(path);
		// taking encoded base32 value from the database
		const { base32: secret } = user.temp_secret;

		// verifying the token
		const verified = speakeasy.totp.verify({
			secret,
			encoding: "base32",
			token,
		});

		// if verified, then return success message else return error message
		if (verified) {
			res.status(200).send({ message: "Verified user" });
		} else {
			res.status(400).send({ message: "Not verified user" });
		}
	} catch (error) {
		// handling the error
		res.status(500).send({ message: "Error verifiying the token" });
	}
});

// token validation method
app.post("/api/validate", (req, res) => {
	// taking the data from the body of request
	const { id, token } = req.body;
	try {
		// designing the path to store the data into json format
		const path = `/user/${id}`;
		const user = db.getData(path);
		// taking encoded base32 value from the database
		const { base32: secret } = user.temp_secret;

		// validating the token
		const validated = speakeasy.totp.verify({
			secret,
			encoding: "base32",
			token,
			window: 1,
		});

		// if valid, then return success message and storing that token permanently into the database else return error message
		if (validated) {
			res.status(200).send({ message: "Valid token" });
			db.push(path, { id, token: user.temp_secret.base32 });
		} else {
			res.status(400).send({ message: "Invalid token" });
		}
	} catch (error) {
		// handling the error
		res.status(500).send({ message: "Internal Server Error" });
	}
});
