var mongoose = require('mongoose');
mongoose.set('useNewUrlParser', true);
mongoose.set('useUnifiedTopology', true );
mongoose.set('useFindAndModify', true);

const Schema = mongoose.Schema;
const VehicleSechema = new Schema({
    vin: {type: String, required : true},
    usability: Boolean,
    phoneNumber: String,
    paired: Boolean,
    locked: Boolean,
    pairCode: String
});

module.exports = mongoose.model('Vehicles', VehicleSechema);