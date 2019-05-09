# Redis Websocket Host

A rudimentery websocket server which combines [socket.io](https://socket.io/docs/) with [redis](https://redis.io/commands) to form a redis HTTP interface, and realtime messenger.

Requires an existing installation (see either [redis](https://redis.io/download) or [homebrew](https://formulae.brew.sh/formula/redis#default) )

## Redis HTTP Interface

Append any redis-cli query to the base URL, seperated by back-slashes.

E.g,

### Show all keys

```curl
GET /keys/*

{"args":["keys","*"],"response":[["search-cache","latest_activity","status","anotherkey"]]}
```

### Set a key `test` to value `hello`

```curl
GET /set/test/hello

{"args":["set","test","hello"],"response":["OK"]}
```

### Query the value of `test`

```curl
GET /get/test

{"args":["get","test"],"response":["hello"]}
```

### Delete the key `test`

```curl
GET /del/test

{"args":["del","test"],"response":[1]}
```

## Websocket Integration

Any redis key modified via the HTTP API may also be listened to via a websocket inteface.

### Node.js Client

```javascript
//The URL is the API base plus the key you want to listen to: redis-key-<key name>
const url = '/redis-key-AN_EXAMPLE_KEY';
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
    socket = io('/redis-key-demonstrations_build_status');
    socket.emit("new_client", window.location.origin);
    socket.on("new_client", (msg) => {
        console.log(msg)
    });
});

socket.on("local_redis_update", (resp) => {
    //Do something when a message comes through.
    //For example, this updates a progress bar.
    if(resp.key == jobTriggerID){
        const print_response = (resp.p_max == resp.progress) ? `Complete.  Files saved to ${resp.msg}` : `${resp.msg} category ${resp.progress} of ${resp.p_max}`;
        console.log(print_response);
        setProgress( parseInt(resp.progress), parseInt(resp.p_max) );
    }
});
```