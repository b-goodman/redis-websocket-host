# Websocket Host

A simple websocket server which combines [socket.io](https://socket.io/docs/) with [redis](https://redis.io/commands) to form a redis HTTP cli, and realtime messenger.

Redis is currently installed on `dmsbuildmac2` and may be accessed via

```bash
$ redis-cli -h dmsbuildmac2
```

`redis-cli` comes with a redis installation which may be gotten from [redis](https://redis.io/download) or [homebrew](https://formulae.brew.sh/formula/redis#default)

# API

## Redis HTTP Interface

Base URL: `http://dmsbuildmac2:3535/`

Append any redis-cli query to the base URL, seperated by back-slashes.

E.g,

Show all keys [>>](http://dmsbuildmac2:3535/keys/*)

```curl
GET /keys/*

{"args":["keys","*"],"response":[["Update-Search-Cache","latest_activity_demonstrations","demo-status","demonstrations_build_status"]]}
```

Set a key `test` to value `hello` [>>](http://dmsbuildmac2:3535/set/test/hello)

```curl
GET /set/test/hello

{"args":["set","test","hello"],"response":["OK"]}
```

Query the value of `test` [>>](http://dmsbuildmac2:3535/get/test)

```curl
GET /get/test

{"args":["get","test"],"response":["hello"]}
```

Delete the key `test` [>>](http://dmsbuildmac2:3535)

```curl
GET /del/test

{"args":["del","test"],"response":[1]}
```

## Websocket Integration

Any redis key modified via the HTTP API may also be listened to via a websocket inteface.

### Node.js Client

```javascript
//The URL is the API base plus the key you want to listen to: redis-key-<key name>
const url = 'http://dmsbuildmac2:3535/redis-key-demonstrations_build_status';
var socket = require('socket.io-client')(url);

socket.emit("new_client", window.location.href);
socket.on("new_client", (msg) => {
    console.log(msg);
});

//an update to the key emits a "local_redis_update" event.
socket.on("local_redis_update", (msg)=>{
    //Do something when a message comse through
    console.log(msg);
})
```

### Browser Client

```javascript

let socket = null;
$(function () {
    socket = io('http://dmsbuildmac2:3535/redis-key-demonstrations_build_status');
    socket.emit("new_client", window.location.origin);
    socket.on("new_client", (msg) => {
        console.log(msg)
    });
});

socket.on("local_redis_update", function(resp){
    //Do something when a message comes through.
    //For example, this updates a progress bar.
    if(resp.key == jobTriggerID){
        const print_response = (resp.p_max == resp.progress) ? `Complete.  Files saved to ${resp.msg}` : `${resp.msg} category ${resp.progress} of ${resp.p_max}`;
        console.log(print_response);
        setProgress( parseInt(resp.progress), parseInt(resp.p_max) );
        $("div#status-msg").text(print_response);
    }
});
```