var socket = io();

$(document).ready(function() {
	var compiledContainer = Handlebars.compile($('#container-template').html());


	$('#createRoom').on('submit', function(e) {
		e.preventDefault();
		var roomName = e.target.roomName.value.trim();
		if (!roomName.length) {
			return alert("Please enter a room name.");
		};
		socket.emit('createRoom', roomName, function(resp) {
			if (resp == 'exists') {
				alert('This room already exists');
			} else {
				alert('Created!');
				window.location.reload();
			}
		});
	});

	

	socket.on('chat:room_list', function(data) {
		if(data.updated) {
			updateList();
		}
	});

	updateList();

	function updateList() {
		socket.emit('getCurrentUser', function(currentUser) {
			if (!currentUser) {
				alert('You are not logged in.');
				window.location.href = '/';
				return;
			};
			socket.emit('getRooms', function(rooms) {
				$('#container').html(compiledContainer({
					rooms: rooms,
					currentUser: currentUser,
				}));
			});
		});
	}
});