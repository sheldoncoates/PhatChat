
var sanitizeHtml = require('sanitize-html');

var sanitizeString = function(str) {
	return sanitizeHtml(str, {
		allowedTags: [],
	});
};

var CONVO_ROOM_PREFIX = 'chat:convo_room:';
var	ROOM_LIST_CHANNEL = 'chat:room_list';


module.exports = function(io) {
	io.on('connection', function(socket) {

		var sid = socket.request.session.id;
		if (!(global.findUserBySid(sid))) {
			return;
		};
		var user = global.findUserBySid(sid);

		socket.on('getCurrentUser', function(callback) {
			callback(global.findUserBySid(sid));
		});

		socket.on('getRooms', function(callback) {
			var roomNames = [];
			for (var name in global.Rooms) {
				roomNames.push({
					name: name,
					memberCount: global.Rooms[name].length,
				});
			};
			socket.join(ROOM_LIST_CHANNEL);
			callback(roomNames);
		});

		socket.on('createRoom', function(newRoomName, callback) {
			if (global.Rooms[newRoomName]) {
				callback('exists');
			} else {
				global.Rooms[newRoomName] = [];
				callback('created');
				io.to(ROOM_LIST_CHANNEL).emit(ROOM_LIST_CHANNEL, {
					updated: true,
				});
			};
		});

		socket.on('joinRoom', function(newRoomName, callback) {
			if (!global.Rooms[newRoomName]) {
				callback('room does not exist');
			} else {
				socket.join(CONVO_ROOM_PREFIX + newRoomName);
				global.Rooms[newRoomName].push(global.findUserBySid(sid));
				global.Users[sid].currentRoom = newRoomName;
				socket.broadcast.to(CONVO_ROOM_PREFIX + newRoomName).emit((CONVO_ROOM_PREFIX + newRoomName), {
					members: global.Rooms[newRoomName],
					userInfoMessageHTML: '<li><p>'+user.name+' joined the room</p></li>',
				});
				io.to(ROOM_LIST_CHANNEL).emit(ROOM_LIST_CHANNEL, {
					updated: true,
				});
				callback(global.Rooms[newRoomName]);
			}
		});

		socket.on('sendMessage', function(message, toRoom, callback) {
			socket.broadcast.to(CONVO_ROOM_PREFIX + toRoom).emit((CONVO_ROOM_PREFIX + toRoom), {
				from: user.name,
				sid: user.sid,
				message: sanitizeString(message),
			});
			callback(sanitizeString(message));
		});

		socket.on('hasLeft', function() {
			if (global.Users[sid] && global.Users[sid].currentRoom) {
				var idx = global.Rooms[global.Users[sid].currentRoom].findIndex(function(userItem) {
					return userItem.sid == sid;
				});
				if (idx > -1) {
					global.Rooms[global.Users[sid].currentRoom].splice(idx, 1);
				};
				var currentRoom = global.Users[sid].currentRoom;
				socket.broadcast.to(CONVO_ROOM_PREFIX + currentRoom).emit((CONVO_ROOM_PREFIX + currentRoom), {
					members: global.Rooms[currentRoom],
					userInfoMessageHTML: '<li><p>'+global.Users[sid].name+' left the room</p></li>',
				});
				io.to(ROOM_LIST_CHANNEL).emit(ROOM_LIST_CHANNEL, {
					updated: true,
				});
				delete global.Users[sid].currentRoom;
			};

			socket.leave(ROOM_LIST_CHANNEL);
		});

	});
}