var User = require('../app/models/user');
var Group = require('../app/models/group');
var Event = require('../app/models/event');

module.exports = function(app, passport) {

	// HOME PAGE
	app.get('/', function(req, res) {
		res.render('index.ejs', {
			user: req.user	
		});
	});

	// LOG IN
	app.get('/login', function(req, res) {
		res.render('login.ejs', { 
			message:req.flash('loginMessage'),
			user: req.user
		});
	});

	app.post('/login', passport.authenticate('local-login', {
		successRedirect: '/profile',
		failureRedirect: '/login',
		failureFlash: true
	}));

	// SIGN UP
	app.get('/signup', function(req,res) {
		res.render('signup.ejs', { 
			message: req.flash('signupMessage'),
			user: req.user
		});
	});

	app.post('/signup', passport.authenticate('local-signup', {
		successRedirect: '/profile',
		failureRedirect: '/signup',
		failureFlash: true
	}));

	// PROFILE
	app.get('/profile', isLoggedIn, function(req, res) {
		res.render('profile.ejs', {
			user: req.user,
			groups: req.user.groups.groups,
			invites: req.user.groups.invites,
			eventInvites: req.user.groups.eventInvites,
			successMessage: req.flash('successMessage'),
			errorMessage: req.flash('errorMessage')
		});
	});

	// EDIT INFO
	app.get('/edit-profile', isLoggedIn, function(req, res) {
		res.render('edit-profile.ejs', {
			message: req.flash('updateMessage'),
			user: req.user
		});
	});		

	app.post('/edit-profile', updateUserInfo);

	// CREATE GROUP
	app.get('/group/create-group', isLoggedIn, function(req, res) {
		res.render('create-group.ejs', {
			message: req.flash('groupMessage'),
			user: req.user
		});
	});

	app.post('/group/create-group', createGroup);	

	// GROUP PORTAL
	var searchString = '';	
	app.get('/group/portal', function(req, res) {
		Group.find({ 'groupName': {"$regex": searchString, "$options": "i"}}, 
		function(err, docs) {
			res.render('group-portal.ejs', {
				groups:	docs,
				user: req.user
			});
		});
	});

	app.post('/group/portal', function(req, res, next) {
		searchString = req.body.groupName;
		console.log(searchString);
		res.redirect('/group/portal');
	});

	// GROUP PAGE
	app.get('/group/:groupName', function(req, res) {
		Group.findOne({ 'groupName': req.params.groupName }, function(err, group) {
			if (err)
				return done(err);
			if (group) {
				res.render('group.ejs', {
					successMessage: req.flash('successMessage'),
					errorMessage: req.flash('errorMessage'),
					user: req.user,
					groupPage: group,
					requests: group.requests
				});
			} else {
				res.render('group-dne.ejs', {'user': req.user});
			}
		});
	});
	
	app.post('/group/:groupName', function(req, res) {
		User.findOne({ 'local.email': req.body.email }, function(err, user) {
			if (err)
				return done(err);		
			if (!user) {
				req.flash('errorMessage', 'User does not exist.');
				res.redirect('/group/' + req.params.groupName);
			} else if (user.hasInvite(req.params.groupName)) {
				req.flash('errorMessage', 'User already has invite.');
				res.redirect('/group/' + req.params.groupName);
			} else if (user.isInGroup(req.params.groupName)) {
				req.flash('errorMessage', 'User is already a part of the group.');
				res.redirect('/group/' + req.params.groupName);
			} else {
				req.flash('successMessage', 'Invite was sent.');
				user.addInvite(req.params.groupName);
				user.save(function(err) {
					if (err)
						throw err;
					return res.redirect('/group/' + req.params.groupName);
				});
			}
		});
	});	

	// ACCEPT INVITE
	app.get('/group/:groupName/accept', isLoggedIn, joinGroup);
	// REJECT INVITE
	app.get('/group/:groupName/reject', isLoggedIn, rejectGroup);
	// LEAVE GROUP
	app.get('/group/:groupName/leave-group', isLoggedIn, leaveGroup);
	// REQUEST ENTRY
	app.get('/group/:groupName/request-join', isLoggedIn, requestJoin);	
	// ACCEPT ENTRY	
	app.get('/group/:groupName/accept/:email', isLoggedIn, acceptJoin);
	// REJECT ENTRY
	app.get('/group/:groupName/reject/:email', isLoggedIn, rejectJoin);
	// ATTENDING EVENT
	app.get('/group/:groupName/:eventName/accept/:email', isLoggedIn, attendingAccept);
	// NOT ATTENDING EVENT
	app.get('/group/:groupName/:eventName/reject/:email', isLoggedIn, attendingReject);

	// CREATE EVENT
	app.get('/group/:groupName/create-event', isLoggedIn, function(req, res) {
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
			if (event) {
				res.render('event.ejs', {
					successMessage: req.flash('successMessage'),
					errorMessage: req.flash('errorMessage'),
					user: req.user,
					event: event,
				});
			} else {
				res.render('event-dne.ejs', {'user': req.user});
			}
		});
	});

	// LOG OUT
	app.get('/logout', function(req, res) {
		req.logout();
		res.redirect('/');
	});
};

function isLoggedIn(req, res, next) {
	if (req.isAuthenticated())
		return next();

	res.redirect('/');
};

function joinGroup(req, res, next) {
	Group.findOne({ 'groupName': req.params.groupName }, function(err, group) {
		if (err)
			return done(err);
		if (!group) {
			req.flash('errorMessage', 'Group no longer exists.');
			res.redirect('/profile');
		} else {
			req.user.addGroup(req.params.groupName);
			req.user.removeInvite(req.params.groupName);
			req.user.save(function(err) { if (err) throw err; });

			group.addMember(req.user.local.email);
			group.save(function(err) { if (err) throw err; });

			req.flash('successMessage', 'Successfully joined group.');
			res.redirect('/profile');
		}
	});
};

function rejectGroup(req, res, next) {
	req.user.removeInvite(req.params.groupName);
	req.user.save(function(err) { if (err) throw err; });
	res.redirect('/profile');
};

function leaveGroup(req, res, next) {
	req.user.removeGroup(req.params.groupName);
	req.user.save();
	Group.findOne({ 'groupName': req.params.groupName }, function(err, group) {
		if (err)
			return done(err);
		group.removeMember(req.user.local.email);
		group.save();
		for (var i = 0; i < group.events.length; i++) {
				Event.findOne({ 'groupName': group.groupName, 'eventName': group.events[i] }, function(err, event) {
					event.removeUser(req.user.local.email);
					event.save();
				});
		}
		if (group.members.users.length == 0) {
			for (var i = 0; i < group.events.length; i++) {
				Event.findOne({ 'groupName': group.groupName, 'eventName': group.events[i] }, function(err, event) {
					event.remove();
				});
			}
			group.remove();
		}
	});
	res.redirect('/profile');
};

function requestJoin(req, res, next) {
	Group.findOne({ 'groupName': req.params.groupName }, function(err, group) {
		if (err)
			return done(err);
		group.addRequest(req.user.local.email);
		group.save();
	});
	res.redirect('/group/' + req.params.groupName);
};

function acceptJoin(req, res, next) {
	Group.findOne({ 'groupName': req.params.groupName }, function(err, group) {
		if (err)
			return done(err);
		group.acceptRequest(req.params.email);
		group.save();
	});
	User.findOne({ 'local.email': req.params.email }, function(err, user) {
		if (err)
			return done(err);
		user.addGroup(req.params.groupName);
		user.save();
	});
	req.flash('successMessage', 'Member accepted.');
	res.redirect('/group/' + req.params.groupName);
};

function rejectJoin(req, res, next) {
	Group.findOne({ 'groupName': req.params.groupName }, function(err, group) {
		if (err)
			return done(err);
		group.rejectRequest(req.user.local.email);
		group.save();
	});
	req.flash('successMessage', 'Member rejected.');
	res.redirect('/group/' + req.params.groupName);
};

function attendingAccept(req, res, next) {
	Event.findOne({ 'groupName': req.params.groupName, 'eventName': req.params.eventName }, function(err, event) {
		if (err)
			return done(err);
		event.switchToAttending(req.params.email);
		event.save();
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
};

function createGroup(req, res, next) {
	var reservedNames = [ 'create-group', 'accept', 'reject', 'portal', 'create-event' ]; // Can't use these names.
	var isReserved = (reservedNames.indexOf(req.body.groupName) > -1) ? true : false;
	Group.findOne({ 'groupName': req.body.groupName }, function(err, group) {
		if (err)
			return done(err);
		if (group) {
			req.flash('groupMessage', 'Group already exists.');
			res.redirect('/group/create-group');
		} else if (isReserved) {
			req.flash('groupMessage', 'Cannot use reserved name.');
			res.redirect('/group/create-group');
		} else {
			req.user.addGroup(req.body.groupName);
			req.user.save();

			newGroup = new Group();
			newGroup.groupName = req.body.groupName;
			newGroup.addMember(req.user.local.email);
			newGroup.save(function(err) {
				if (err)
					throw err;
				return res.redirect('/group/' + req.body.groupName);
			});	
		}
	});
};

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
			console.log(req.body.dateTime);
			newEvent.time = req.body.dateTime;
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

function updateUserInfo(req, res, next) {
	User.findOne({ 'local.email': req.user.local.email }, function(err, user) {
		if (err)
			return done(err);
		if (!user) {
			req.flash('updateMessage', 'No user found.');
			res.redirect('/edit-profile');
		} else if (req.body.password != req.body.confirmPass) {
			req.flash('updateMessage', 'Passwords do not match.');
			res.redirect('/edit-profile');
		} else {
			if (req.body.firstName != '')
				user.local.firstName = req.body.firstName;
			if (req.body.lastName != '')
				user.local.lastName = req.body.lastName;
			if (req.body.password != '') 
				user.local.password = req.body.password;
			if (req.body.timelineToken != '')
				user.local.timelineToken = req.body.timelineToken;
			user.save(function(err) {
				if (err)
					throw err;
				return res.redirect('/profile');
			});
		}
	});
};
