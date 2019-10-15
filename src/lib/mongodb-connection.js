var mongoose = require('mongoose');
var tracer = require('tracer');
const logger = tracer.colorConsole();

const UserAccount= require('./UserAccountModel');
const Vehicle = require('./VehicleModel');

var retryConnectCount = 0;
function handleError()
{
    if(retryConnectCount > 10) {
        console.log('can not start server');
        console.log('- please restart server manually');
        process.exit(1);
    }

    console.log('Mongo DB connection retry...');
    setTimeout(() => {
        retryConnectCount++;
        mongoConnect();
    }, 30000);

}

/*
 * function initMongoDatabase()
 *  : connect to docker container mongo DB
*/

function mongoConnect()
{
    const mongoDbUrl = 'mongodb://mongo0:27017,mongo1:27018,mongo2:27019/unlockingsystem';
    const connectOption ={
        replicaSet: 'rs0', 
        reconnectTries: 60,
        reconnectInterval:2000
    };

    mongoose.connect(mongoDbUrl, connectOption).then((result) => {

        console.log('success to connect mongo DB!');
        logger.debug(result);
        // Create Collection (Vehicle/UserAccount) if not exist in db
        initCollection();

        mongoose.connection.on('error', (e) => {
            if (e.message.code === 'ETIMEDOUT') {
                mongoose.connect(mongoDbUrl, connectOption);
            }
            logger.error(e);
        });
        mongoose.connection.once('open', function() {
            logger.info('DB connection open');
        });
        mongoose.connection.on('connected', function () {
            logger.info('DB connected');
        });
        mongoose.connection.on('disconnected', function () {
            logger.info('DB disconnected');
        });

    }).catch((err) => {
        console.log('fail to connect mongo DB');
        console.log(err);
        handleError();
    });

}

async function initCollection()
{
    try {
        let findCb = await Vehicle.findOne({vin: 'vehicle-1'});
        if(findCb === null) {
            logger.debug('make new vehicle document');

            // make vehicle collection
            let vehicle = new Vehicle({
                vin : 'vehicle-1',
                usability : true,
                phoneNumber : null,
                paired : false,
                locked : true,
                pairCode : 1234
            });
            await vehicle.save();
        }
    } catch(err) {
        console.log(err);
    }

    // Account Collection
    try {
        let findCb = await UserAccount.findOne({phoneNumber: 'na'});
        if(findCb === null) {
            logger.debug('make new user account document');

            let ua = new UserAccount({
                phoneNumber : 'na',
                vins : [],
                otp: 0,
                retry: 0
            });
            await ua.save();
        }
    } catch(err) {
        console.log(err);
    }

}


exports.mongoConnect = mongoConnect;