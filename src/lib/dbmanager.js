var tracer = require('tracer');
var mongodb = require('./mongodb-connection');
var mongoose = require('mongoose')
const logger = tracer.colorConsole();

const UserAccount= require('./UserAccountModel');
const Vehicle = require('./VehicleModel');

mongodb.mongoConnect();

async function createUser(userInfo, createCb)
{
    try {
        const phoneNumber = userInfo.phoneNumber;
        const condition = {
            phoneNumber: phoneNumber
        };

        let found = await UserAccount.find(condition);
        console.log(found.length);
        if(found.length !== 0) {
            createCb({
                code : 409,
                message: 'Same Account ID exist'
            });
            return;
        }

        let ua = new UserAccount({
            phoneNumber: phoneNumber,
            vins: [],
            otp: {}
        });

        await ua.save();
        createCb({
            code: 201,
            message: 'user account create successfully!'
        });
        return;

    } catch(err) {
        console.log(err);
        createCb({
            code: 500,
            message: 'internal server error'
        });
    }

}

async function createVehicle(vehicleInfo, createCb)
{
    try {
        const vin = vehicleInfo.vin;
        const condition = {
            vin: vin
        };

        let found = await Vehicle.find(condition);
        console.log(found.length);
        if(found.length !== 0) {
            createCb({
                code : 409,
                message: 'Same Vehicle exist'
            });
            return;
        }

        const pairCode = await generateCode();

        let ua = new Vehicle({
            vin : vin,
            usability: true,
            phoneNumber: null,
            paired: false,
            locked: true,
            pairCode: pairCode
        });

        await ua.save();
        createCb({
            code: 201,
            message: 'vehicle create successfully!'
        });
        return;

    } catch(err) {
        console.log(err);
        createCb({
            code: 500,
            message: 'internal server error'
        });
    }

}

async function generateCode()
{
    return new Promise((resolve, reject) => {
        // Declare a digits variable  
        // which stores all digits 
        var digits = '0123456789'; 
        let code = ''; 
        for (let i = 0; i < 4; i++ ) { 
            code += digits[Math.floor(Math.random() * 10)]; 
        } 
        resolve(code);
    });
}
exports.createUser = createUser;
exports.createVehicle = createVehicle;