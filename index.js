const express = require("express");
const bodyParser = require("body-parser");
const app = express();
const http = require("http").Server(app);
const io = require("socket.io")(http);
// const fs = require("fs");
const config = require("./config.json");

const jsonPretty = require("express-prettify");

app.use(jsonPretty({
	query: "pretty"
}));

app.use(bodyParser.urlencoded({
	extended: true
}));

const redis = require("redis");
const client = redis.createClient(`redis://${config.redis.host}:${config.redis.port}`);

// Redis Client
const redisReadyResp = client.once("ready", () => {
	return new Promise( (resolve) => {
		client.keys("*", (err, data) => {
			if (err) {
				throw err;
			} else {
				console.log(`KEYS: ${data}`);
				resolve(`Redis client connected on ${config.redis.host}:${config.redis.port}`);
			}
		});
	});
});


//API

// TODO dynamic api routing
// TODO add optional type parameter
app.put("/set", function(req, res) {
	const key = req.body.key;
	let msg = req.body;

	client.set(key, JSON.stringify(msg), async (err) => {
		if (err) {
			throw err;
		} else {

			console.log(`KEY: ${key} - MSG: ${msg}`);

			const nsp = io.of(`redis-key-${key}`).emit("local_redis_update",msg);
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

			const nsp = io.of(`redis-key-${key}`).emit("local_redis_update",msg);
			io.emit("global_redis_update", `${nsp.name} set to ${msg}`);
			res.send({
				"status": "OK",
				"reply": `${nsp.name} set to ${msg}`
			});
		}
	});
});


const isParsableJson = require("validate.io-json");

const deepParse = (arrayOrElement) => {
	if ( Array.isArray(arrayOrElement) ) {
		return arrayOrElement.map( arrayElem => {
			return deepParse( arrayElem );
		});
	} else if ( isParsableJson(arrayOrElement) ) {
		return JSON.parse(arrayOrElement);
	} else {
		return arrayOrElement;
	}
};

const isJson = (str) => {
	const regex = /{([\w\d]+:([\w\d]+|\[\]|(\[[\w\d]+(,[\w\d])*)+\]),*)+}/;
	return regex.test(str);
};

const getJsonObj = (str) => {
	return isJson(str) ?  JSON.stringify((new Function(`return ${str}`))()) : str;
};

app.get("/*", (req, res) => {
	console.log(req);
	const cmdArray = req.params[0].split("/");
	const parsedArray = cmdArray.map( str => { return getJsonObj(str); });

	client.multi([
		parsedArray
	]).exec(function (err, replies) {
		res.json({
			args: parsedArray,
			response: deepParse(replies)
		});
		console.log(replies);
	});
});


// dynamic namespace handling

io.of(/^\/redis-key-[\w,-]+$/).on("connection", (socket) => {
	const newNamespace = socket.nsp; // newNamespace.name === '/dynamic-101'
	// broadcast to all clients in the given sub-namespace
	newNamespace.emit("new_client",`Listening on ${socket.nsp.name}`);

	socket.on("local_redis_update", (data) => {
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
http.listen(port, async () => {
	console.log(await redisReadyResp);
	console.log("Server Started. Listening on :" + port);
});