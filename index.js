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

	client.keys("*", function(err, data) {
		if (err) {
			throw err;
		} else {
			console.log(`KEYS: ${data}`);
		}
	});
});


//API
app.put("/set", function(req, res) {
	const key = req.body.key;
	let msg = req.body;

	client.set(key, JSON.stringify(msg), async (err) => {
		if (err) {
			throw err;
		} else {

			console.log(`KEY: ${key} - MSG: ${msg}`);

			const nsp = io.of(`redis-key-${key}`).emit("update",msg);
			io.emit("global_redis_update", `${nsp.name} set to ${msg}`);
			res.send({
				"status": "OK",
				"reply": `${nsp.name} set to ${msg}`
			});
		}
	});
});

app.put("/push", function(req, res) {
	const key = req.body.key;
	let msg = req.body;

	client.lpush(key, JSON.stringify(msg), (err) => {
		if (err) {
			throw err;
		} else {

			console.log(`KEY: ${key} - MSG: ${msg}`);

			const nsp = io.of(`redis-key-${key}`).emit("update",msg);
			io.emit("global_redis_update", `${nsp.name} set to ${msg}`);
			res.send({
				"status": "OK",
				"reply": `${nsp.name} set to ${msg}`
			});
		}
	});
});


// dynamic socket handling

io.of(/^\/redis-key-[\w,-]+$/).on("connection", (socket) => {
	const newNamespace = socket.nsp; // newNamespace.name === '/dynamic-101'
	// broadcast to all clients in the given sub-namespace
	newNamespace.emit("new_client",`Listening on ${socket.nsp.name}`);

	socket.on("update", (data) => {
		io.of(newNamespace).emit("update", data);
	});
});


// Socket Connection
io.on("connection", (socket) => {

	socket.on("new_client", (msg) => {
		socket.emit("new_client", `client connected: ${msg}`);
		console.log(`client connected: ${msg}`);
	});

	socket.on("global_redis_update", (data) => {
		socket.emit("redis_update", data);
	});

});


// Start the Server
const port = config.server.port;
http.listen(port, function() {
	console.log("Server Started. Listening on :" + port);
});