const express = require("express");
const bodyParser = require("body-parser");
const app = express();
const http = require("http").Server(app);
const io = require("socket.io")(http);
// const fs = require("fs");
const config = require("./config.json");

app.use(bodyParser.urlencoded({
	extended: true
}));

const redis = require("redis");
const client = redis.createClient(`redis://${config.redis.host}:${config.redis.port}`);

// Redis Client
client.once("ready", () => {
	console.log(`Redis client connected on ${config.redis.host}:${config.redis.port}`);
	// Flush Redis DB
	client.flushdb();

	// Initialize
	client.keys("*", function(err, data) {
		if (err) {
			throw err;
		} else {
			console.log(`KEYS: ${data}`);
		}
	});
});

//API
app.post("/set", function(req, res) {
	const key = req.body.key;
	let value = req.body.value;

	client.set(key, value, (err, reply) => {
		if (err) {
			throw err;
		} else {

			console.log(value);
			console.log(value[0]);

			io.emit("redis_set", value);
			res.send({
				"status": "OK",
				"reply": reply
			});
		}
	});
});


// Socket Connection
io.on("connection", (socket) => {

	socket.on("new_client", (msg) => {
		socket.emit("new_client", `client connected: ${msg}`);
		console.log(`client connected: ${msg}`);
	});

	socket.on("redis_set", (data) => {
		socket.emit("redis_set", data);
	});

});


// Start the Server
const port = config.server.port;
http.listen(port, function() {
	console.log("Server Started. Listening on :" + port);
});