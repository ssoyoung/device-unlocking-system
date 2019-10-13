var tracer = require('tracer');
var mongodb = require('./mongodb-connection');
var mongoose = require('mongoose')
const logger = tracer.colorConsole();

const UserAccount= require('./UserAccountModel');
const Vehicle = require('./VehicleModel');

mongodb.mongoConnect();

const updateOptions = {
    new: true,  // check schema validation
    runValidators : true,    // print out updated document
    useFindAndModify: false
};
/*
 * function for create user
 */
async function createUser(userInfo, createCb)
{
    try {
        if(userInfo === null || userInfo.phoneNumber === null || userInfo.phoneNumber.length === 0) {
            createCb({
                code: 400,
                message: 'empty info entered'
            });
        }
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
            otp: 0,
            retry: 0
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

/*
 * function for create vehicle
 */
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

/*
 * function for make OTP
 */
async function makeOtp(phoneNumber, vin, makeCb)
{
    try {
        const vhCondition = {
            vin: vin
        };
        let vhFound = await Vehicle.findOne(vhCondition);
        // logger.log('#####');
        // logger.log(vhFound);

        // error handling
        if(vhFound === null) {
            makeCb({
                code : 404,
                message: 'no such vehicle exist'
            });
            return;
        }
        if(vhFound.usability === false) {
            makeCb({
                code : 400,
                message: 'can not use that vehicle, please contact agent'
            });
            return;

        }
        if(vhFound.paired === true) {
            makeCb({
                code: 400,
                message: 'already paired'
            });
            return;
        }

        const userCondition = {
            phoneNumber: phoneNumber
        }
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

        // save to user db
        const updateCondition = {
            phoneNumber: phoneNumber
        };

        const updateUser = {
            retry: userFound.retry + 1,
            otp : otpCode
        };

        await UserAccount.findOneAndUpdate(updateCondition, updateUser, updateOptions); 

        makeCb({
            code: 200,
            message: otpCode
        });

        return;

    } catch(err) {
        console.log(err);
        makeCb({
            code: 500,
            message: 'internal server error'
        });
        return;
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

async function otpCheck(info, checkCb)
{
    const phoneNumber = info.phoneNumber;
    const vin = info.vin;
    const otp = info.otp;

    // mongo transaction session
    const session = await mongoose.startSession();
    session.startTransaction();
    const opts = { session };
    
    try {
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

        checkCb({
            code: 500,
            message: err
        });
    }
}

async function startPairing(vin, paringCb)
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
        const found = await Vehicle.findOne(findCondition);
        if(found === null) {
            paringCb({
                code: 404,
                message: 'invalid vehicle selected'
            });
            return;
        }
        
        await Vehicle.findOneAndUpdate(findCondition, updateData, updateOptions);
        paringCb({
            code: 200,
            message: pairCode
        });
        return;
    } catch(err) {
        logger.error('vehicle pairing code update error');
        logger.error(err);
        paringCb({
            code : 500,
            message : 'SERVER ERROR'
        })
    }
}

async function checkPairing(pairingData, pairingCb) {
    const phoneNumber = pairingData.phoneNumber;
    const vin = pairingData.vin;
    const pairCode = pairingData.pairCode;
    
    // mongo transaction session
    const session = await mongoose.startSession();
    session.startTransaction();
    const opts = { session };
    
    try {

        const vhCondition = {
            vin: vin,
            usability: true,
            paired: false,
            pairCode: pairCode
        };
        let vhFound = await Vehicle.findOne(vhCondition);
        if(vhFound === null) {
            logger.error('wrong info');
            await session.commitTransaction();
            session.endSession();    
            pairingCb({
                code: 404,
                message: 'wrong pairing information'
            });
            return;    
        }


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

        // set vins : vin
        const vinInfoUser = {
            vin : vin,
            history : []
        };
        let updateData = {
            vins: vinInfoUser
        };
        await UserAccount.updateOne(userCondition, {$push: updateData}, updateOptions);

        // set retry 0
        // set otp ""
        updateData = {
            retry: 0,
            otp : ""
        }
        await UserAccount.updateOne(userCondition, updateData, updateOptions);
   
        
        // Update Vehicle Document
        // set paired : true, phoneNumber: phoneNumber
        await Vehicle.updateOne(vhCondition, {paired: true, phoneNumber: phoneNumber});

        await session.commitTransaction();
        session.endSession();    
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

async function setVehicleLock(vhInfo, lockCb)
{
    try {
        const foundOne = await Vehicle.findOne({vin: vhInfo.vin});
        if(foundOne === null) {
            lockCb({
                code: 400,
                message: "no such vehicle exist"
            });
            return;
        }
    
        const findQuery = {
            vin : vhInfo.vin,
            phoneNumber : vhInfo.phoneNumber
        }
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

async function resetProcess(resetInfo, resetCb)
{
    const session = await mongoose.startSession();
    session.startTransaction();

    try {    

        const userCondition = {
            phoneNumber: resetInfo.phoneNumber
        };
        // BUG : DOES NOT PROPERY WORKED
        const userUpdate=  {
            retry: 0,
            $pull: {'vins': {'vin' : [resetInfo.vin]}}
        };

        const updated = await UserAccount.findOneAndUpdate(userCondition, userUpdate, updateOptions);
        if(updated === null) {
            await session.abortTransaction();
            session.endSession();        
            resetCb({
                code: 404,
                message : 'no such user exist'
            });
            return;
        }

        const vhCondition = {
            vin: resetInfo.vin
        };
        const foundVh = Vehicle.findOne(vhCondition);
        if(foundVh === null) {
            await session.abortTransaction();
            session.endSession();
            resetCb({
                code: 404,
                message : 'no such vehicle exist'
            });
            return;
        }
        
        const vhUpdate = {
            usability: true,
            paired: false,
            phoneNumber: ''
        }
        await Vehicle.updateOne(vhCondition, vhUpdate, updateOptions);
        await session.commitTransaction();
        session.endSession();    

        resetCb({
            code: 200,
            message: 'reset successfully'
        });

    } catch (err) {
        await session.abortTransaction();
        session.endSession();

        logger.error(err);
        resetCb({
            code: 500,
            message: 'INTERNAL SERVER ERROR'
        });
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