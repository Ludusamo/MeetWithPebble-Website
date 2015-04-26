var mongoose = require('mongoose');
var bcrypt   = require('bcrypt-nodejs');

var userSchema = mongoose.Schema({
	local: {
		firstName: String,
    		lastName: String,
		email: String,
    		password: String,
    		timelineToken: String,
	},
	groups: {
		invites: [String],
    		groups: [String]
	}
});

userSchema.methods.generateHash = function(password) {
	return bcrypt.hashSync(password, bcrypt.genSaltSync(8), null);
};

userSchema.methods.validPassword = function(password) {
	return bcrypt.compareSync(password, this.local.password);
};

userSchema.methods.hasInvite = function(groupName) {
	if (this.groups.invites.indexOf(groupName) > -1) return true;
	return false;
};

userSchema.methods.isInGroup = function(groupName) {
	if (this.groups.groups.indexOf(groupName) > -1) return true;
	return false;
};

userSchema.methods.addInvite = function(groupName) {
	this.groups.invites.push(groupName);
};

userSchema.methods.removeInvite = function(groupName) {
	var index = this.groups.invites.indexOf(groupName);
	this.groups.invites.splice(index, 1);
};

userSchema.methods.addGroup = function(groupName) {
	this.groups.groups.push(groupName);
};

userSchema.methods.removeGroup = function(groupName) {
	var index = this.groups.groups.indexOf(groupName);
	this.groups.groups.splice(index, 1);
};

module.exports = mongoose.model('User', userSchema);
