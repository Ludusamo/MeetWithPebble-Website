module.exports = {
	convertToLocal: function(time) {
		var newTime = new Date(time);	
		var originalTime = new Date(time);
		console.log(newTime.getTimezoneOffset());
		newTime.setHours(newTime.getHours() + (newTime.getTimezoneOffset() / 60) - 4);
		return newTime;
	}
};
