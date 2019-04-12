var midi = require('easymidi')
var express = require('express')();
var http = require('http').Server(express);
var io = require('socket.io')(http);

const controls = {
  "UM-ONE": [ 64, 65, 66, 67 ]
}

const inputs = midi.getInputs();
var input;
var mics = [];
var state = {};

for(var key in controls) {
  for(var i of inputs) {
    if(i.match(key)) {
      input = new midi.Input(i);
      mics = controls[key];
    }
  }
}

if(!input) process.exit();
if(mics.length == 0) process.exit();
for(var i = 0; i < mics.length; i++) {
  state[i+1] = false;
}

input.on('cc', (msg) => {
  for(var i = 0; i < mics.length; i++) {
    if(mics[i] == msg.controller) {
      state[i] = msg.value>0;
      bcast(i+1, msg.value>0);
    }
  }
})

var bcast = (n, state) => {
  io.emit('msg', { mic: n, state: state });
}

express.get('/', (req, res) => {
  res.sendFile(__dirname + '/index.html');
});

io.on('connection', (socket) => {
  for(var i in state) {
    bcast(i, state[i]);
  }
});

http.listen(1337);