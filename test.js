var midi = require('easymidi')
var express = require('express')();
var http = require('http').Server(express);
var io = require('socket.io')(http);

const controls = {
  "UM-ONE": [ 54, 55, 56, 57, 58, 59, 60, 61 ]
}

const inputs = midi.getInputs();
console.log("inputs", inputs);
var input;
var mics = [];
var state = {};
var active_control;

for(var key in controls) {
  for(var i of inputs) {
    if(i.match(key)) {
      console.log("match", i);
      input = new midi.Input(i);
      mics = controls[key];
    }
  }
}

console.log("mics", mics);

if(!input) process.exit();
if(mics.length == 0) process.exit();
for(var i = 0; i < mics.length; i++) {
  state[i+1] = false;
}
 
console.log("state", state);

input.on('cc', (msg) => {
  console.log("cc", msg);
  for(var i = 0; i < mics.length; i++) {
    /*if(mics[i] == msg.controller) {
      state[i+1] = msg.value>0;
      bcast(i+1, msg.value>0);
    }*/
    if(mics[i] == msg.value && msg.controller == 98) {
      active_control = msg.value;
    }
    if(mics[i] == active_control && msg.controller == 6) {
      active_control = -1;
      state[i+1] = msg.value>0;
      bcast(i+1, msg.value>0);
    }
  }
})

input.on('noteon', (msg) => {
  console.log("on", msg);
})

input.on('noteoff', (msg) => {
  console.log("off", msg);
})

var bcast = (n, state) => {
  io.emit('msg', { mic: 1*n, state: state });
}

express.get('/', (req, res) => {
  res.sendFile(__dirname + '/index.html');
});

io.on('connection', (socket) => {
  //console.log("connection", socket);
  for(var i in state) {
    bcast(i, state[i]);
  }
});

//http.listen(1337);
