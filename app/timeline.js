var Timeline = require('pebble-api');

var timeline = new Timeline();

var pin;

module.exports = {
	createPin: function(group, event) {
		return new Timeline.Pin ({
			"id": group._id.oid + event._id.oid,
			"time": event.time,
			"duration": event.duration * 60,
			"layout": new Timeline.Pin.Layout({
				"type": "calendarPin",
				"title": event.eventName,
				"locationName": event.location,
				"body": event.description
			})
		})
	},
	sendPin(user, pin): {
		timeline.sendUserPin(user.timelineToken, pin, function(err) {
			if (err) console.error(err);
			console.log("Pin successfully sent.");
		});
	},
	sendPin(users, pin): {
		for (var i = 0; i < users.length; i++) {
			sendPin(users[i], pin);	
		}
	}
};
