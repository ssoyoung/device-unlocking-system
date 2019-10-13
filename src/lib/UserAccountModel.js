var mongoose = require('mongoose');
mongoose.set('useNewUrlParser', true);
mongoose.set('useUnifiedTopology', true );
mongoose.set('useFindAndModify', true);

const Schema = mongoose.Schema;
const UserAccountSchema = new Schema({
    phoneNumber: {type: String, required : true},
    vins: [Object],
    otp: String,
    retry : Number
});

module.exports = mongoose.model('UserAccounts', UserAccountSchema);