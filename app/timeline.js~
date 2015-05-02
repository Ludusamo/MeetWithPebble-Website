var Timeline = require('pebble-api');

var timeline = new Timeline();

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
	sendPin: function(user, pin) {
		timeline.sendUserPin(user.local.timelineToken, pin, function(err) {
			if (err) console.error(err);
			else console.log("Pin successfully sent.");
		});
	},
	deletePin: function(user, group, event) {
		var p = new Timeline.Pin ({
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
		timeline.deleteUserPin(user, p, function(err) {
			if (err) console.error(err);
			else console.log("Pin successfuly deleted.");
		});
	}
};
