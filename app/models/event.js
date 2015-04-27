var mongoose = require('mongoose');

var eventSchema = mongoose.Schema({
	eventName: String,
    	description: String,
    	time: { type: Date, default: Date.now },	
    	duration: Number,
    	attending: [String],
    	notAttending: [String],
    	pending: [String]
});

eventSchema.methods.switchToAttending = function(member) {
	this.removeNotAttending(member);
	this.removePending(member);
	this.addAttending(member);
};

eventSchema.methods.switchToNotAttending = function(member) {
	this.addNotAttending(member);
	this.removePending(member);
	this.removeAttending(member);
};

eventSchema.methods.switchToPending = function(member) {
	this.removeNotAttending(member);
	this.addPending(member);
	this.removeAttending(member);
};

eventSchema.methods.removeAttending = function(member) {
	var index = this.attending.indexOf(member);
	if (index > -1) this.attending.splice(index, 1);
};

eventSchema.methods.addNotAttending = function(member) {
	this.attending.push(member);
};

eventSchema.methods.removeNotAttending = function(member) {
	var index = this.notAttending.indexOf(member);
	if (index > -1) this.notAttending.splice(index, 1);
};

eventSchema.methods.addNotAttending = function(member) {
	this.notAttending.push(member);
};

eventSchema.methods.removePending = function(member) {
	var index = this.pending.indexOf(member);
	if (index > -1) this.pending.splice(index, 1);
};

eventSchema.methods.addPending = function(member) {
	this.pending.push(member);
};

module.exports = mongoose.model('Event', eventSchema);

