importScripts('https://cdnjs.cloudflare.com/ajax/libs/socket.io/2.0.4/socket.io.js');
var socket = io();
	
socket.emit('getCurrentUser', function(currentUser) {
	postMessage(currentUser);
});