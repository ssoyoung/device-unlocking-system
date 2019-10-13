var socket_io = require('socket.io');
var io       = socket_io();
var socketio = {};
socketio.io  = io;

var dbmanager = require('./dbmanager');

io.on('connection', function(socket){
    
    console.log('connected');

    socket.on('get otp', function (data) {
        const phoneNumber = data.phoneNumber;
        const vin = data.vin;

        dbmanager.makeOtp(phoneNumber, vin, (makeCb) => {
            console.log('makeCb is called');

            if(makeCb.code !== 200) {
                socket.emit('no otp', makeCb.message);
            } else {
                const otpData = makeCb.message;
                socket.emit('new otp', otpData);    
            }
        });

    });

    socket.on('validation', function(data) {

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