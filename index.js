// ------------------------------ const defns ------------------------------ //
var PORT = 4200;

var dbURI = 'mongodb://admin:admin@ds131826.mlab.com:31826/phatchat';

// ------------------------------ requires ------------------------------ //

var express = require('express');
var bodyParser = require('body-parser');
var cookieParser = require('cookie-parser');
var app = require('express')();
var fs = require('fs');

var mongoose = require('mongoose');
var socket_io = require("socket.io");
var session = require('express-session');
var MongoStore = require('connect-mongo')(session);

// ------------------------------ mongoose ------------------------------ //

mongoose.Promise = global.Promise;

mongoose.connect(dbURI, {
	useMongoClient: true,
});
mongoose.connection.on('error', function(err) {
	console.log('mongoose connection error: ' + err);
});

// when node closes, close connection
process.on('SIGINT', function() {
	mongoose.connection.close(function () {
		process.exit(0);
	});
	for (var name in global.Rooms) {
		global.Rooms[name] = [];
	}
	fs.writeFileSync(__dirname+'/globalCache/Users.json', JSON.stringify(global.Users));
	fs.writeFileSync(__dirname+'/globalCache/Rooms.json', JSON.stringify(global.Rooms));
});

// ------------------------------ [app.use] ------------------------------ //

app.use(express.static('public'));
app.use(cookieParser());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
var sessionMidware = session({
	secret: 'phatchatsecret',
	saveUninitialized: true,
	resave: true,
	store: new MongoStore({
		mongooseConnection: mongoose.connection,
		ttl: (1 * 60 * 60),
	}),
	cookie: {
		path: "/",
	},
});
app.use(sessionMidware);

// ------------------------------ routers ------------------------------ //

global.Users = { };

global.findUserBySid = function(sid) {
	return Users[sid];
}

global.Rooms = { };

if (fs.existsSync(__dirname + '/globalCache/Users.json')) {
	global.Users = JSON.parse(fs.readFileSync(__dirname + '/globalCache/Users.json', 'utf-8'));
	global.Rooms = JSON.parse(fs.readFileSync(__dirname + '/globalCache/Rooms.json', 'utf-8'));};

app.use('/', require('./routing.js'))


// ------------------------------ inits ------------------------------ //

// express server

var server = app.listen(PORT, function() {
	console.log('Server is listening on port ' + PORT);
});

// api

var socket = socket_io(server).use(function(socket, next) {
	sessionMidware(socket.request, {}, next);
});
require('./server/sockets.js')(socket);
