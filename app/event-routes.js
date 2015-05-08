var User = require('../app/models/user');
var Group = require('../app/models/group');
var Event = require('../app/models/event');

var Timeline = require('../app/timeline');

var Util = require('../app/util');

module.exports = function(app, passport) {
	// CREATE EVENT
	app.get('/group/:groupName/create-event', Util.isLoggedIn, function(req, res) {
		res.render('create-event.ejs', {
			message: req.flash('eventMessage'),
			user: req.user,
			groupName: req.params.groupName
		});
	});

	app.post('/group/:groupName/create-event', createEvent);

	// EVENT PAGE
	app.get('/group/:groupName/:eventName', function(req, res) {
		Event.findOne({ 'groupName': req.params.groupName, 'eventName': req.params.eventName }, function(err, event) {
			if (err)
				return done(err);
			Group.findOne({ 'groupName': req.params.groupName }, function(err, group) {
				if (event) {
					res.render('event.ejs', {
						successMessage: req.flash('successMessage'),
						errorMessage: req.flash('errorMessage'),
						user: req.user,
						event: event,
						groupPage: group
					});
				} else {
					res.render('event-dne.ejs', {'user': req.user});
				}
			});	
		});
	});

	app.get('/group/:groupName/:eventName/delete-event', function(req, res) {
		Group.findOne({ 'groupName': req.params.groupName }, function(err, group) {
			Event.findOne({ 'groupName': req.params.groupName, 'eventName': req.params.eventName }, function(err, event) {
				if (event) {
					group.removeEvent(event.eventName);
					group.save();
					event.remove();
					req.flash('successMessage', 'Deleted Event');
					res.redirect('/group/' + req.params.groupName);
				}
			});
		});
	});

	// ATTENDING EVENT
	app.get('/group/:groupName/:eventName/accept/:email', Util.isLoggedIn, attendingAccept);
	// NOT ATTENDING EVENT
	app.get('/group/:groupName/:eventName/reject/:email', Util.isLoggedIn, attendingReject);
};

function attendingAccept(req, res, next) {
	Event.findOne({ 'groupName': req.params.groupName, 'eventName': req.params.eventName }, function(err, event) {
		if (err)
			return done(err);
			event.switchToAttending(req.params.email);
			event.save();
			Group.findOne({ 'groupName': req.params.groupName }, function(err, group) {
				var pin = Timeline.createPin(group, event);
				Timeline.sendPin(req.user, pin);	
			});
	});
	req.user.removeEventInvite({'groupName': req.params.groupName, 'eventName': req.params.eventName});
	req.user.save();
	req.flash('successMessage', 'Attending.');
	res.redirect('/group/' + req.params.groupName + '/' + req.params.eventName);
};

function attendingReject(req, res, next) {
	Event.findOne({ 'groupName': req.params.groupName, 'eventName': req.params.eventName }, function(err, event) {
		if (err)
			return done(err);
		event.switchToNotAttending(req.params.email);
		event.save();
	});
	req.user.removeEventInvite({'groupName': req.params.groupName, 'eventName': req.params.eventName});
	req.user.save();
	req.flash('successMessage', 'Not attending.');
	res.redirect('/group/' + req.params.groupName + '/' + req.params.eventName);
}

function createEvent(req, res, next) {
	Group.findOne({ 'groupName': req.params.groupName }, function(err, group) {
		if (err)
			return done(err);
		if (group.hasEvent(req.body.eventName)) {
			req.flash('eventMessage', 'Event already exists.');
			res.redirect('/group/' + req.params.groupName + 'create-event');
		} else {
			

			group.addEvent(req.body.eventName);
			group.save();

			newEvent = new Event();
			newEvent.groupName = req.params.groupName;
			newEvent.eventName = req.body.eventName;
			newEvent.description = req.body.description;
			newEvent.location = req.body.eventLocation;
			console.log(req.body.dateTime);
			newEvent.time = Util.convertToLocal(req.body.dateTime);
			newEvent.duration = req.body.duration;
			for (var i = 0; i < group.members.users.length; i++) {
				newEvent.addPending(group.members.users[i]);		
				User.findOne({'local.email': group.members.users[i]}, function(err, user) {
					user.addEventInvite({groupName: req.params.groupName, 
						eventName: req.body.eventName});
					user.save();
				});
			}
			newEvent.save();

			res.redirect('/group/' + req.params.groupName);
		}
	});
};
