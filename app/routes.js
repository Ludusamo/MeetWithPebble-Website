var User = require('../app/models/user');

module.exports = function(app, passport) {

	// HOME PAGE
	app.get('/', function(req, res) {
		res.render('index.ejs');
	});

	// LOG IN
	app.get('/login', function(req, res) {
		res.render('login.ejs', { message:req.flash('loginMessage') });
	});

	app.post('/login', passport.authenticate('local-login', {
		successRedirect: '/profile',
		failureRedirect: '/login',
		failureFlash: true
	}));

	// SIGN UP
	app.get('/signup', function(req,res) {
		res.render('signup.ejs', { message: req.flash('signupMessage') });
	});

	app.post('/signup', passport.authenticate('local-signup', {
		successRedirect: '/profile',
		failureRedirect: '/signup',
		failureFlash: true
	}));

	// PROFILE
	app.get('/profile', isLoggedIn, function(req, res) {
		res.render('profile.ejs', {
			user: req.user
		});
	});

	// Edit Info
	app.get('/edit-profile', isLoggedIn, function(req, res) {
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
};

function isLoggedIn(req, res, next) {
	if (req.isAuthenticated())
		return next();

	res.redirect('/');
};

function updateUserInfo(req, res, next) {
	User.findOne({ 'local.email': req.user.local.email }, function(err, user) {
		if (err)
			return done(err);
		if (!user) {
			req.flash('updateMessage', 'No user found.');
			res.redirect('/edit-profile');
		}
		if (req.body.password != req.body.confirmPass) {
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
