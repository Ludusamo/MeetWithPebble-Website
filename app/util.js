module.exports = {
	convertToLocal: function(time) {
		var newTime = new Date(time);	
		var originalTime = new Date(time);
		console.log(newTime.getTimezoneOffset());
		newTime.setHours(newTime.getHours() + (newTime.getTimezoneOffset() / 60));
		return newTime;
	},
	isLoggedIn: function(req, res, next) {
		if (req.isAuthenticated())
			return next();

		res.redirect('/');
	}
};
