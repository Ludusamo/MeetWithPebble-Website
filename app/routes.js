var User = require('../app/models/user');
var Group = require('../app/models/group');
var Event = require('../app/models/event');

var Timeline = require('../app/timeline');

var Util = require('../app/util'); 

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
	app.get('/profile', Util.isLoggedIn, function(req, res) {
		for (var i = 0; i < req.user.groups.eventInvites.length; i++) {
			Event.findOne({ 'groupName': req.user.groups.eventInvites[i].groupName, 'eventName': req.user.groups.eventInvites[i].eventName }, function(err, event) {
				if (!event) {
					req.user.removeEventInvite(req.user.groups.eventInvites[i]);
					req.user.save();
					i--;
				}	
			});
		}
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
	app.get('/edit-profile', Util.isLoggedIn, function(req, res) {
		res.render('edit-profile.ejs', {
			message: req.flash('updateMessage'),
			user: req.user
		});
	});		

	app.post('/edit-profile', updateUserInfo);			

	// LOG OUT
	app.get('/logout', function(req, res) {
		req.logout();
		res.redirect('/');
	});

	// APP CONFIG
	app.get('/app-config', function(req,res) {
		res.render('appconfig.ejs', {
			user: req.user
		});
	});
	
	app.post('/app-config', function(req,res,next) {
		options = {
			'email': req.body.email,
			'password': req.body.password
		};
		res.location = 'pebblejs://close#' + encodeURIComponent(JSON.stringify(options));	
		res.send(null);
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
