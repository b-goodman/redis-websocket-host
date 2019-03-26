module.exports = {
	apps : [{
		name: "Websocket-Host",
		script: "./index.js",
		merge_logs: true,
		autorestart: true,
		watch: false,
		max_memory_restart: "1G",
		instances: 1,
	}]
};