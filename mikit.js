var express = require('express')();
var wsclient = require('websocket').client;
var http = require('http').Server(express);
var io = require('socket.io')(http);

const N_MICS = 8;
var mics = {};

let ql = new wsclient();

ql.on('connectFailed', function(error) {
    console.log('Connect Error: ' + error.toString());
    process.exit(1);
});

ql.on('connect', function(connection) {
    console.log('QL API WS Connected');
    connection.on('error', function(error) {
        console.log("Connection Error: " + error.toString());
        process.exit(1);
    });
    connection.on('close', function() {
        console.log('QL API WS Connection Closed');
        process.exit(1);
    });
    connection.on('message', function(message) {
      if (message.utf8Data) {
        const packet = JSON.parse(message.utf8Data);
        const {channel, state} = packet;
        if (state !== null && channel < N_MICS) {
          mics[channel+1] = state;
          bcast(channel+1, state);
        }
      }
    });
});
ql.connect('ws://qltools.idm.wappuradio.fi:8083/', 'ql-json1');

for(var i = 0; i < N_MICS; i++) {
  mics[i+1] = false;
}

express.get('/', (req, res) => {
  res.sendFile(__dirname + '/index.html');
});

var bcast = (n, state) => {
  console.log("sending transition on ch", n, "to", state);
  io.emit('msg', { mic: 1*n, state: state });
}

io.on('connection', (socket) => {
  for(var i in mics) {
    bcast(i, mics[i]);
  }
});

http.listen(1337);
