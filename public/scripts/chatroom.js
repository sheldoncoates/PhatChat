var socket = io();
var CONVO_ROOM_PREFIX = 'chat:convo_room:';

var currentRoomName = getParameterByName('roomName');

var Model = {
    members: [],
    messages: [],
};


var CURRENT_USER;

var updateStateWorker = new Worker('/scripts/webworker1.js');

updateStateWorker.onmessage = function(e) {
    var data = e.data;
    var resp = data.resp;
    if (data.isJoinRoomResp) {
        if (typeof resp == 'string') {
            return alert(resp);
        }
        Model.members = resp;
        redraw();
    } else {
        if (resp.members) {
            Model.members = resp.members;
            Model.messages.push({
                userInfoMessageHTML: resp.userInfoMessageHTML,
            });
        } else if(resp.from && resp.sid != CURRENT_USER.sid) {
            Model.messages.push(resp);
        };
        redraw();
    };
};

var getCurrentUserWorker = new Worker('/scripts/webworker2.js');

getCurrentUserWorker.onmessage = function(e) {
    CURRENT_USER = e.data;
    getCurrentUserWorker.terminate();
    
    updateStateWorker.postMessage({
        CONVO_ROOM_PREFIX: CONVO_ROOM_PREFIX,
        currentRoomName: currentRoomName,
    });
};



function redraw() {
    $('#users').html(Model.members.reduce(function(accum, curr) {
        return accum + '<li>'+curr.name+'</li>';
    }, ''));

    $('#messages').html(Model.messages.reduce(function(accum, curr) {
        if (curr.userInfoMessageHTML) {
            return accum + curr.userInfoMessageHTML;
        };
        return accum + '<li><p>From: ' + curr.from + '</p><p>'+curr.message+'</p></li>';
    }, ''));
};


function getParameterByName(name, url) {
    if (!url) url = window.location.href;
    name = name.replace(/[\[\]]/g, "\\$&");
    var regex = new RegExp("[?&]" + name + "(=([^&#]*)|&|#|$)"),
        results = regex.exec(url);
    if (!results) return null;
    if (!results[2]) return '';
    return decodeURIComponent(results[2].replace(/\+/g, " "));
}

$(document).ready(function() {
    $('#message-form').on('submit', function(e) {
        e.preventDefault();
        
        var mInput = e.target.message.value.trim();
        if (!mInput.length) {
            return alert("Please enter a message.");
        };
        var sendMessageWorker = new Worker('/scripts/webworker4.js');

        sendMessageWorker.onmessage = function(e) {
            var data = e.data;
            if (!CURRENT_USER) {
                alert('You are not logged in.');
                window.location.href = '/';
                return;
            };
            Model.messages.push({
                from: CURRENT_USER.name,
                sid: CURRENT_USER.sid,
                message: mInput,
            });
            $('#message').val(' ');

            redraw();
            sendMessageWorker.terminate();
        };
        sendMessageWorker.postMessage({
            mInput: mInput,
            currentRoomName: currentRoomName,
        });
    });
});

window.onunload = function() {
    socket.emit('hasLeft');
    updateStateWorker.terminate();
}