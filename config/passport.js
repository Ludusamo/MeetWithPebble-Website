var LocalStrategy = require('passport-local').Strategy;

var User = require('../app/models/user');

module.exports = function(passport) {
	passport.serializeUser(function(user, done) {
		done(null, user.id);
	});
	
	passport.deserializeUser(function(id, done) {
		User.findById(id, function(err, user) {
			done(err, user);	
		});
	});

	// SIGNUP STRATEGY
	passport.use('local-signup', new LocalStrategy({
		usernameField: 'email',
		passwordField: 'password',
		passReqToCallback: true
	},
	function(req, email, password, done) {
		process.nextTick(function() {
			User.findOne({ 'local.email' : email }, function(err, user) {
				if (err)
					return done(err);
				if (user) {
					return done(null, false, req.flash('signupMessage', 'That email is already taken.'));
				} else if (password != req.body.confirmPass) {
					return done(null, false, req.flash('signupMessage', 'Passwords do not match.'));
				} else {
					var newUser = new User();
					newUser.local.firstName = req.body.firstName;
					newUser.local.lastName = req.body.lastName;
					newUser.local.email = email;
					newUser.local.password = newUser.generateHash(password);

					newUser.local.timelineToken = req.body.timelineToken;
					newUser.save(function(err) {
						if (err)
							throw err;
						return done(null, newUser);
					});
				}
			});
		});
	}));

	// LOGIN STRATEGY
	passport.use('local-login', new LocalStrategy({
		usernameField: 'email',
		passwordField: 'password',
		passReqToCallback: true
	},
	function (req, email, password, done) {
		User.findOne({ 'local.email': email }, function(err,user) {
			if (err)
				return done(err);
			
			if (!user)
				return done(null, false, req.flash('loginMessage', 'No user found.'));
			if (!user.validPassword(password))
				return done(null, false, req.flash('loginMessage', 'Oops! Wrong password.'));
			return done(null, user);
		});
	}));

	// UPDATE STRATEGY
	passport.use('local-update', new LocalStrategy({
		usernameField: 'email',
		passwordField: 'password',
		passReqToCallback: true
	},
	function (req, email, password, done) {
		User.findOne({ 'local.email': req.user.local.email }, function(err, user) {
			if (err)
				return done(err);
			if (!user)
				return done(null, false, req.flash('updateMessage', 'No user found.'));
			/*if (req.body.password != req.body.confirmPass) {
				return done(null, false, req.flash('updateMessage', 'Passwords do not match.'));
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
					return done(null, user);
				});
			}*/
			return done(null, user);
		});
	}));
};
