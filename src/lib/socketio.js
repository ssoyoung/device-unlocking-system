var socket_io = require('socket.io');
var io       = socket_io();
var socketio = {};
socketio.io  = io;
var tracer = require('tracer');
const logger = tracer.colorConsole();

var dbmanager = require('./dbmanager');

io.on('connection', function(socket){
    
    logger.info('connected');

    socket.on('get otp', function (data) {
        const phoneNumber = data.phoneNumber;
        const vin = data.vin;

        dbmanager.makeOtp(phoneNumber, vin, (makeCb) => {

            if(makeCb.code !== 200) {
                socket.emit('no otp', makeCb.message, '(' + makeCb.code +')');
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
                socket.emit('no otp', checkCb.message + '(' + checkCb.code + ')');
            } else {
                socket.emit('otp success', checkCb.message);
           
                // **********************************
                // SEND PAIR CODE TO VEHICLE (Assume)
                dbmanager.startPairing(data.vin, (pairingCb) => {
                    if(pairingCb.code !== 200){
                        socket.emit('pairing error', pairingCb.message + '(' + pairingCb.code + ')');
                    } else{
                        socket.emit('pairing code', pairingCb.message);
                    } 
                });

            }
        });
    });


    socket.on('send pairing', (data) => {
        dbmanager.checkPairing(data, (pairingCb) => {
            if(pairingCb.code !== 200) {
                socket.emit('pairing error', pairingCb.message + '(' + pairingCb.code + ')');
            } else {
                socket.emit('pair success', pairingCb.message);
            }
        });
    });

    socket.on('locked', (data) => {
        dbmanager.setVehicleLock(data, (setCb) => {
            socket.emit('locked', (setCb).message + '(' + setCb.code + ')');
        });
    });
    
});

io.on('dissconnection', function(socket){
    logger.info('disconnected ' + socket.id);
});
 
module.exports = socketio;