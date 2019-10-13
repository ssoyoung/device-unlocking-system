var mongoose = require('mongoose');
mongoose.set('useNewUrlParser', true);
mongoose.set('useUnifiedTopology', true );
mongoose.set('useFindAndModify', true);

const Schema = mongoose.Schema;
const UserAccountSchema = new Schema({
    phoneNumber: String, vins: [Object], otp: Number, retry : Number
});

module.exports = mongoose.model('UserAccounts', UserAccountSchema);