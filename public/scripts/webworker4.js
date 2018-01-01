importScripts('https://cdnjs.cloudflare.com/ajax/libs/socket.io/2.0.4/socket.io.js');
var socket = io();
onmessage = function(e) {
	var data = e.data;
	socket.emit('sendMessage', data.mInput, data.currentRoomName, function(resp) {
		postMessage(resp);
	});
}