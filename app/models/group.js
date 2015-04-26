var mongoose = require('mongoose');

var groupSchema = mongoose.Schema({
	groupName: String,
    	requests: [String],
	members: {
		users: [String]
	}
});

groupSchema.methods.removeMember = function(member) {
	var index = this.members.users.indexOf(member);
	if (index > -1) this.members.users.splice(index, 1);
};

groupSchema.methods.addMember = function(member) {
	this.members.users.push(member);
};

groupSchema.methods.hasMember = function(email) {
	var index = this.members.users.indexOf(email);
	if (index > -1) return true;
	return false;
};

groupSchema.methods.rejectRequest = function(email) {
	this.removeRequest(email);
};

groupSchema.methods.acceptRequest = function(email) {
	this.removeRequest(email);
	this.members.users.push(email);
};

groupSchema.methods.removeRequest = function(email) {
	var index = this.requests.indexOf(email);
	this.requests.splice(index, 1);
};

groupSchema.methods.addRequest = function(email) {
	this.requests.push(email);
};

groupSchema.methods.hasRequest = function(email) {
	var index = this.requests.indexOf(email);
	if (index > -1) return true;
	return false;
};

module.exports = mongoose.model('Group', groupSchema);
