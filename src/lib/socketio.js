var socket_io = require('socket.io');
var io       = socket_io();
var socketio = {};
socketio.io  = io;

var dbmanager = require('./dbmanager');

io.on('connection', function(socket){
    
    console.log('connected');

    socket.on('validation', function (data) {
        const email = data.email;
        const vin = data.vin;

        // TODO : validation check
        // STEP 1: user & vehicle validty check

        // STEP 2: if passes, make & save otp
        //const otpData;

        // STEP 3: send otp to client
        socket.emit('new otp', otpData);
    });

    socket.on('otp', function(data) {

        const otpData = data;
        // STEP 1: otp validation check (retry check & data validation check)

        // STEP 2: if passes, sends uccess message
        socket.emit('otp success', 'enter paring code');
    });
    
    // TODO : pairing code
     
});

io.on('dissconnection', function(socket){

});
 
module.exports = socketio;