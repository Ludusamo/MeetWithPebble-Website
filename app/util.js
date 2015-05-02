module.exports = {
	convertToLocal: function(time) {
		var newTime = new Date(time);	
		var originalTime = new Date(time);
		newTime.setHours(newTime.getHours() + (newTime.getTimezoneOffset() / 60));
		return newTime;
	}
};
