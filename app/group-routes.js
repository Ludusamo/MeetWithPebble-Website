var User = require('../app/models/user');
var Group = require('../app/models/group');
var Event = require('../app/models/event');

var Timeline = require('../app/timeline');

var Util = require('../app/util'); 

module.exports = function(app, passport) {
	// CREATE GROUP
	app.get('/group/create-group', Util.isLoggedIn, function(req, res) {
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
				for (var i = 0; i < group.events.length; i++) {
					console.log(group.events[i]);
					Event.findOne({ 'groupName': group.groupName, 'eventName': group.events[i] }, function(err, event) {
						var d = new Date();
						var dorig = new Date();
						d.setUTCHours(d.getHours() - (d.getTimezoneOffset() / 60));
						if (d.getDate() != dorig.getDate()) {
							d.setDate(dorig.getDate());
						}
						if (event) {
							if (event.time < d) {
								for (var i = 0; i < group.members.users.length; i++) {
									User.findOne({ 'local.email': group.members.users[i] }, function(err, user) {
										Timeline.deletePin(user, group, event);
									});
								}
								group.removeEvent(event.eventName);
								group.save();
								event.remove();
							}
						}
					});
				}
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

	// INVITING USERS
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
	app.get('/group/:groupName/accept', Util.isLoggedIn, joinGroup);
	// REJECT INVITE
	app.get('/group/:groupName/reject', Util.isLoggedIn, rejectGroup);
	// LEAVE GROUP
	app.get('/group/:groupName/leave-group', Util.isLoggedIn, leaveGroup);
	// REQUEST ENTRY
	app.get('/group/:groupName/request-join', Util.isLoggedIn, requestJoin);	
	// ACCEPT ENTRY	
	app.get('/group/:groupName/accept/:email', Util.isLoggedIn, acceptJoin);
	// REJECT ENTRY
	app.get('/group/:groupName/reject/:email', Util.isLoggedIn, rejectJoin);

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
