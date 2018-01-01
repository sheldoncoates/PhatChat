importScripts('https://cdnjs.cloudflare.com/ajax/libs/socket.io/2.0.4/socket.io.js');
var socket = io();
onmessage = function(e) {
	var data = e.data;
	socket.emit('joinRoom', data.currentRoomName, function(members) {
		postMessage({
			resp: members,
			isJoinRoomResp: true,
		});
		socket.on(data.CONVO_ROOM_PREFIX + data.currentRoomName, function(data) {
			postMessage({
				resp: data
			});
		});
	});
}