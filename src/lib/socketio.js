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

    socket.on('send otp', function(data) {

        // STEP 1: otp validation check (retry check & data validation check)
        // STEP 2: if passes, sends uccess message
        // socket.emit('otp success', 'enter paring code');

        dbmanager.otpCheck(data, (checkCb) =>{
            if(checkCb.code !== 200) {
                socket.emit('no otp', checkCb.message);
            } else {
                socket.emit('otp success', checkCb.message);
           
                // **********************************
                // SEND PAIR CODE TO VEHICLE (Assume)
                dbmanager.startPairing(data.vin, (pairingCb) => {
                    if(pairingCb.code !== 200){
                        socket.emit('pairing error', pairingCb.message);
                    } else{
                        socket.emit('pairing code', pairingCb.message);
                    } 
                });

            }
        });
    });


    socket.on('send pairing', (data) => {
        dbmanager.checkPairing(data, (pairingCb) => {
            console.log('pairing CB is called');
            console.log(pairingCb.code);
            console.log(pairingCb.message);
            if(pairingCb.code !== 200) {
                socket.emit('pair err', pairingCb.message);
            } else {
                socket.emit('pair success', pairingCb.message);
            }
        });
    });
    
});

io.on('dissconnection', function(socket){

});
 
module.exports = socketio;