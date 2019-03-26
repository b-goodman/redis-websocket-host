module.exports = {
	apps : [{
		name: "WebsocketHost",
		script: "./index.js",
		merge_logs: true,
		autorestart: true,
		watch: false,
		max_memory_restart: "1G",
		instances: 1,
	}]
};