var User = require('../app/models/user');
var Group = require('../app/models/group');
var Event = require('../app/models/event');

var Timeline = require('../app/timeline');

var Util = require('../app/util'); 

module.exports = function(app, passport) {
	app.get('/user-info/:email/:pass', function(req,res) {
		User.findOne({ 'local.email': req.params.email }, function(err, user) {
			res.set('Content-Type', 'application/json');
			if (user) {
				if (user.validPassword(req.params.pass)) res.send(user);
				else res.send({'error':'Invalid password.'});
			} else {
				res.send({'error':'Invalid email ' + req.params.email + '. No user found.'});
			}
		});
	});

	app.get('/set-token/:email/:pass/:token', function(req,res) {
		User.findOne({ 'local.email': req.params.email }, function(err, user) {
			res.set('Content-Type', 'application/json');
			if (user) {
				if (user.validPassword(req.params.pass)) {
					user.local.timelineToken = req.params.token;
					user.save();
					res.redirect('/');
				} else res.send({'error':'Invalid password.'});
			} else {
				res.send({'error':'Invalid email ' + req.params.email + '. No user found.'});
			}
		});
	});
};