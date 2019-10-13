var tracer = require('tracer');
var mongodb = require('./mongodb-connection');
var mongoose = require('mongoose')
const logger = tracer.colorConsole();

const UserAccount= require('./UserAccountModel');

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

exports.createUser = createUser;