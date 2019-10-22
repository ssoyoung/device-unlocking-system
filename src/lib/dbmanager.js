var mongodb = require('./mongodb-connection');
var mongoose = require('mongoose');

const UserAccount= require('./UserAccountModel');
const Vehicle = require('./VehicleModel');

mongodb.mongoConnect();

const updateOptions = {
    new: true,  // check schema validation
    runValidators : true,    // print out updated document
    useFindAndModify: false
};

var timerMap = new Map();

const Validator = require('./validator');
const validator = new Validator();

var tracer = require('tracer');
const logger = tracer.colorConsole();

/*
 * function for creating user
 */
async function createUser(userInfo)
{
    try {
        // data payload check
        if(userInfo === null || userInfo.phoneNumber === null || userInfo.phoneNumber.length === 0) {
            throw{
                code: 400,
                message: 'empty info entered'
            };
        }
        const phoneNumber = userInfo.phoneNumber;

        // phone number validation check
        await validator.validatePhoneNumber(phoneNumber);
        const condition = {
            phoneNumber: phoneNumber
        };

        // user existence check
        let found = await UserAccount.find(condition);
        if(found.length !== 0) {
            throw{
                code : 409,
                message: 'Same Account ID exist'
            };
        }

        let ua = new UserAccount({
            phoneNumber: phoneNumber,
            vins: [],
            otp: 0,
            retry: 0
        });

        // save to UserAccount Collection
        await ua.save();
        return({
            code: 201,
            message: 'user account create successfully!'
        });

    } catch(err) {
        logger.error(err);
        let code = 500;
        let message = 'internal server error';
        if(err.code) {
            code = err.code;
        }
        if(err.message) {
            message = err.message;
        }

        throw{
            code: code,
            message: message
        };
    }

}

/*
 * function for creating vehicle
 */
async function createVehicle(vehicleInfo, createCb)
{
    try {
        // data payload check
        if(vehicleInfo === null || vehicleInfo.vin === null || vehicleInfo.vin.length === 0) {
            createCb({
                code: 400,
                message: 'empty info entered'
            });
            return;
        }

        const vin = vehicleInfo.vin;
        const condition = {
            vin: vin
        };

        let found = await Vehicle.find(condition);
        logger.debug(found.length);
        if(found.length !== 0) {
            createCb({
                code : 409,
                message: 'Same Vehicle exist'
            });
            return;
        }

        // TBD
        // DOES IT REALLY NEEDED IN FIRST STEP????
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
        logger.error(err);
        createCb({
            code: 500,
            message: 'internal server error'
        });
    }
}

/*
 * function for making OTP
 */
async function makeOtp(phoneNumber, vin, makeCb)
{
    try {
        await vehicleAvailabilityCheck(vin);

        const userCondition = {
            phoneNumber: phoneNumber
        };
        let userFound = await UserAccount.findOne(userCondition);
        if(userFound === null) {
            makeCb({
                code: 404,
                message: 'no such user exist'
            });
            return;
        }
        if(userFound.retry >= 3) {
            makeCb({
                code: 401,
                message: 'retry OTP exceed. please contact customer agent'
            });
            return;
        }
        
        const otpCode = await generateCode();

        // update user document with generated otp code
        const updateCondition = {
            phoneNumber: phoneNumber
        };
        const updateUser = {
            otp : otpCode
        };

        await UserAccount.findOneAndUpdate(updateCondition, updateUser, updateOptions); 

        makeCb({
            code: 200,
            message: otpCode
        });

        return;

    } catch(err) {
        logger.error(err);

        let code = 500;
        let message = 'INTERNAL SERVER ERROR';

        if(err.code) {
            code = err.code;
        }
        if(err.message) {
            message = err.message;
        }
        makeCb({
            code: code,
            message: message
        });
        return;
    }    
}

/*
 * function for generating random code
 * (used for OTP & Pairing Code)
 */
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

        // if code is number, change to string
        if(isNaN(code)) {
            code = code.toString();
        }
        resolve(code);
    });
}

/*
 * function for checking vehicle availability
 * : vehicle existence check / usability & paired fields check 
 */
async function vehicleAvailabilityCheck(vin)
{
    return new Promise((resolve, reject) => {
        const vhCondition = {
            vin: vin
        };
        Vehicle.findOne(vhCondition).then((vhFound) => {

            if(vhFound === null) {
                reject({
                    code : 404,
                    message: 'no such vehicle exist'
                });
                return;
            }
            if(vhFound.usability === false) {
                reject({
                    code : 400,
                    message: 'can not use that vehicle, please contact agent'
                });
                return;
            }

            if(vhFound.paired === true) {
                reject({
                    code: 400,
                    message: 'already paired'
                });
                return;
            }

            resolve({
                code: 200,
                message: 'available vehicle'
            });
    
            return;
        }).catch((vhErr)=>{
            logger.error(vhErr);
            reject({
                code: 500,
                message: 'INTERNAL SERVER ERROR'
            });
            return;
        });
    });
}

/*
 * function for checking entered OTP
 */
async function otpCheck(info, checkCb)
{
    const phoneNumber = info.phoneNumber;
    const vin = info.vin;
    const otp = info.otp;
        
    // mongo transaction session
    const session = await mongoose.startSession();
    session.startTransaction();
    
    try {
        // Vehicle availability check
        await vehicleAvailabilityCheck(vin);

        const userCondition = {
            phoneNumber : phoneNumber
        };

        let userFound = await UserAccount.findOne(userCondition);
        if(userFound === null) {
            checkCb({
                code: 404,
                message: 'no such user exist'
            });
            return;
        }

        // retrial check
        if(userFound.retry >= 3) {
            checkCb({
                code: 401,
                message: 'otp excess, please contact agent'
            });
            return;
        }

        let updateUser;
        if(userFound.otp == otp) {
            // update retry : set to 0
            updateUser = {
                retry : 0
            };
            await UserAccount.findOneAndUpdate(userCondition, updateUser, updateOptions);
            await session.commitTransaction();
            session.endSession();    

            checkCb({
                code: 200,
                message: 'otp matched!'
            });

            return;
        } else {

            // update retry
            updateUser = {
                retry:  userFound.retry + 1
            };
            await UserAccount.findOneAndUpdate(userCondition, updateUser, updateOptions);
            await session.commitTransaction();
            session.endSession();
    
            checkCb({
                code: 401,
                message: 'otp code is wrong'
            });
            return;
        }
    } catch(err) {
        await session.abortTransaction();
        session.endSession();

        let code = 500;
        let message = 'INTERNAL SERVER ERROR';
        if(err.code) {
            code = err.code;
        }
        if(err.message){
            message = err.message;
        }
        checkCb({
            code: code,
            message: message
        });
    }
}

/*
 * function for making & sending pairing code
*/
async function startPairing(vin, pairingCb)
{
    // Generating pairing number
    const findCondition = {
        vin: vin,
        paired: false,
        usability: true
    };

    const pairCode = await generateCode();

    const updateData = {
        pairCode: pairCode
    };

    try {
        // 1. vehicle existence check
        const found = await Vehicle.findOne(findCondition);
        if(found === null) {
            pairingCb({
                code: 404,
                message: 'invalid vehicle selected'
            });
            return;
        }

        // 2. update vehicle DB with generated pairing code
        await Vehicle.findOneAndUpdate(findCondition, updateData, updateOptions);
        pairingCb({
            code: 200,
            message: pairCode
        });

        // 3. set time out during 2 min
        const timerId = setTimeout(() => {

            const updateCondition = {
                vin: vin
            };
            const updateData = {
                usability: false
            };

            Vehicle.findOneAndUpdate(updateCondition, updateData, updateOptions)
                .then((updated) => {

                    timerMap.delete(vin);

                    if(updated === null) {
                        pairingCb({
                            code: 400,
                            message: 'there is no such device to be paired'
                        });
                    }
                    else {
                        pairingCb({
                            code: 400,
                            message: 'time exceed to enter pairing code'
                        });
                    }
    
                }).catch((updateErr) => {

                    logger.error(updateErr);
                    pairingCb({
                        code: 500,
                        message: 'INTERNAL SERVER ERROR'
                    });
        
                });
        }, 120000);

        // update timer map
        timerMap.set(vin, timerId);
        return;
    } catch(err) {
        logger.error('vehicle pairing code update error');
        logger.error(err);
        pairingCb({
            code : 500,
            message : 'SERVER ERROR'
        });
    }
}

/*
 * function for checking pairing code
 *   if pairing code matches,
 *   then update UserAccount, Vehicle Document,
 *   and cancel timer
 */
async function checkPairing(pairingData, pairingCb) {
    const phoneNumber = pairingData.phoneNumber;
    const vin = pairingData.vin;
    const pairCode = pairingData.pairCode;

    // mongo transaction session
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const vhCondition = {
            vin: vin,
            usability: true,
            paired: false,
            pairCode: pairCode
        };

        // 1. Check Pairing Code
        let vhFound = await Vehicle.findOne(vhCondition);
        if(vhFound === null) {
            logger.error('wrong info');
            await session.commitTransaction();
            session.endSession();    
            pairingCb({
                code: 404,
                message: 'wrong pairing code entered or vehicle is already paired'
            });
            return;    
        }

        // 2. Update User Document
        const userCondition  = {
            phoneNumber : phoneNumber,
            vins: {$ne: vin}
        };
        let foundUser = UserAccount.findOne(userCondition);
        if(foundUser === null) {
            await session.commitTransaction();
            session.endSession();    
            pairingCb({
                code: 400,
                message: 'wrong user info OR already registered Vehicle'
            });
            return;    
        }

        // set vins : vin, retry 0, otp ''
        const vinInfoUser = {
            vin : vin,
            history : []
        };
        let updateData = {
            vins: vinInfoUser
        };
        await UserAccount.updateOne(userCondition, {$push: updateData, retry: 0, otp: ''}, updateOptions);
   
   
        // 3. Update Vehicle Document
        // set paired : true, phoneNumber: phoneNumber
        await Vehicle.updateOne(vhCondition, {paired: true, phoneNumber: phoneNumber});
        await session.commitTransaction();
        session.endSession();


        // 4. Cancel timer
        if(timerMap.has(vin)) {
            const timerId = timerMap.get(vin);
            clearTimeout(timerId);
            timerMap.delete(vin);
        }
        else {
            logger.error('timerMap has no such ID ', vin);
        }
        pairingCb({
            code: 200,
            message: 'success to pairing with device!'
        });
        return;
    } catch(err) {
        logger.error(err);

        await session.abortTransaction();
        session.endSession();

        pairingCb({
            code: 500,
            message: 'SERVER ERROR'
        });
    }
}

/*
 * function for setting device lock/unlock
 */
async function setVehicleLock(vhInfo, lockCb)
{
    try {
        const foundOne = await Vehicle.findOne({vin: vhInfo.vin});
        if(foundOne === null) {
            lockCb({
                code: 404,
                message: 'no such vehicle exist'
            });
            return;
        }
    
        const findQuery = {
            vin : vhInfo.vin,
            phoneNumber : vhInfo.phoneNumber
        };
        const updateResult = await Vehicle.findOneAndUpdate(findQuery, {locked: vhInfo.locked}, updateOptions);
        if(updateResult !== null)
            lockCb({
                code: 200,
                message: 'success to lock ' + vhInfo.locked
            });

        else
            lockCb({
                code: 400,
                message: 'can not lock the device'
            });
    } catch(err) {
        logger.error(err);
        lockCb({
            code: 500,
            message: 'SERVER ERROR'
        });
    }
}

/*
 * function for reset all pairing process
 */
async function resetProcess(resetInfo)
{
    // TODO : resetInfo null body check

    const session = await mongoose.startSession();
    session.startTransaction();

    try {    

        const userCondition = {
            phoneNumber: resetInfo.phoneNumber
        };

        const userUpdate=  {
            retry: 0,
            $pull: {'vins': {'vin' : resetInfo.vin}}
        };

        const updated = await UserAccount.findOneAndUpdate(userCondition, userUpdate, updateOptions);
        if(updated === null) {
            throw({
                code: 404,
                message : 'no such user exist'
            });
        }

        const vhCondition = {
            vin: resetInfo.vin
        };
        const foundVh = await Vehicle.findOne(vhCondition);
        if(foundVh === null) {
            throw ({
                code: 404,
                message : 'no such vehicle exist'
            });
        }
        
        const vhUpdate = {
            usability: true,
            paired: false,
            phoneNumber: ''
        };
        await Vehicle.updateOne(vhCondition, vhUpdate, updateOptions);
        await session.commitTransaction();
        session.endSession();    

        return({
            code: 200,
            message: 'reset successfully'
        });

    } catch (err) {
        logger.error(err);

        // cancel transaction
        await session.abortTransaction();
        session.endSession();

        let code = 500;
        let message = 'INTERNAL SERVER ERROR';

        if(err.code)
            code = err.code;
        if(err.message)
            message = err.message;
        throw {
            code: code,
            message: message
        };
    }
}


exports.createUser = createUser;
exports.createVehicle = createVehicle;
exports.makeOtp = makeOtp;
exports.otpCheck = otpCheck;
exports.startPairing = startPairing;
exports.checkPairing = checkPairing;
exports.setVehicleLock = setVehicleLock;
exports.resetProcess = resetProcess;