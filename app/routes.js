var User = require('../app/models/user');
var Group = require('../app/models/group');

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
				res.render('group-dne.ejs');
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
		if (group.members.users.length == 0) group.remove();
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
	var reservedNames = [ 'create-group', 'accept', 'reject', 'portal' ]; // Can't use these names.
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
