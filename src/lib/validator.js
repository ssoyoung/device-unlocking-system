const phoneUtil = require('google-libphonenumber').PhoneNumberUtil.getInstance();
var tracer = require('tracer');
const logger = tracer.colorConsole();

class Validator {

    constructor() {

    }

    validatePhoneNumber(phoneNumber) {
        return new Promise((resolve, reject) => {
            try {
                const number = phoneUtil.parseAndKeepRawInput(phoneNumber, 'UA');
                if(phoneUtil.isPossibleNumber(number)){
                    resolve({
                        status: 200,
                        message: 'phone number validation checked'
                    });
                }
                else {
                    reject({
                        status: 400,
                        message: 'wrong format phone number is entered'
                    });
                }
                return;
    
            } catch(err) {
                logger.error(err);
                reject({
                    status: 400,
                    message: 'phone number is in wrong format'
                });
                return;
            }
        });
    }
    
}

module.exports = Validator;