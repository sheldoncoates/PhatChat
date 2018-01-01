var fs = require('fs');
var express = require('express');
var sanitizeHtml = require('sanitize-html');

var Handlebars = require('handlebars');

var models = require('./models');

var sanitizeString = function(str) {
	return sanitizeHtml(str, {
		allowedTags: [],
	});
};

var router = express.Router();

router.get('/', function(req, res) {
	if (global.findUserBySid(req.session.id)) {
		return res.redirect('/dash');
	}
	var fileString = fs.readFileSync('./client/views/index.html', 'utf-8');
	var compiled = Handlebars.compile(fileString);
	res.send(compiled({}));
});
router.get('/dash', function(req, res) {
	if (!global.findUserBySid(req.session.id)) {
		return res.redirect('/');
	}
	res.sendFile(__dirname + '/client/views/dash.html');
});
router.get('/chat', function(req, res) {
	if (!global.findUserBySid(req.session.id)) {
		console.log('hit')
		return res.redirect('/');
	}
	res.sendFile(__dirname + '/client/views/chatroom.html')
});

router.post('/login', function(req, res) {
	var sid = req.session.id;
	if (global.findUserBySid(sid)) {
		res.redirect('/dash');
	} else {
		global.Users[sid] = {
			name: sanitizeString(req.body.name),
			sid: sid,
		};
		res.redirect('/dash');
	};
});

router.get('/logout', function(req, res) {
	var sid = req.session.id;
	if (global.Users[sid]) {
		delete global.Users[sid];
	};
	res.redirect('/');
});


module.exports = router;
