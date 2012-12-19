console.log("Bot Started...", process.argv);

var rawArgs = process.argv;
var args = {configFile:'config'};//setup args object, put default in for config file

while(rawArgs.length > 0){
	var arg = rawArgs[0].split('=');
	var key = arg[0];
	var val = arg[1];

	switch(key){
		case 'channelName':
			args.channelName = "#" + val;
			break;
		case 'nick':
			args.nick = val;
			break;
		case 'password':
			args.password = val;
			break;
		case 'configFile':
			args.configFile = val;
			break;
	}

	rawArgs.shift();
}

console.log('args:', args);

var config = require('./configs/' + args.configFile).config;
var irc = require('irc');
var bot = require('./MYBOT');
var MYBOT = new bot.MYBOT(config);

var fs = require('fs')
		, http = require('http')
		, socketio = require('socket.io');

var server = http.createServer(function(req, res) {
		res.writeHead(200, { 'Content-type': 'text/html'});
		res.end(fs.readFileSync(__dirname + '/index.html'));
}).listen(8080, function() {
		console.log('Listening at: http://localhost:8080');
});

socketio.listen(server).on('connection', function (socket) {
	//Open an irc connection
	var client = new irc.Client('irc.freenode.net', MYBOT.opts.nick, {
		channels: [MYBOT.opts.channelName + " " + MYBOT.opts.password],
		debug: false,
		password: MYBOT.password,
		username: MYBOT.nick,
		realName: "FUELBot nodeJS IRC client"
	});

	MYBOT.client = client;

	//Handle on connect event
	client.addListener("connect", function () {
		MYBOT.handleArrival(MYBOT.opts.channelName, MYBOT.opts.nick, "connect");
	});

	client.addListener("join", function(channel, nick, msg){
		MYBOT.handleArrival(channel, nick, msg);
	});

	client.addListener("part", function (channel, nick, reason, message) {
		MYBOT.handleLeave(nick, reason, message);
	});

	client.addListener("quit", function (nick, reason, channels, message) {
		MYBOT.handleLeave(nick, reason, message);
	});

	//Handle private messages
	client.addListener('pm', function (from, message) {
			console.log(from + ' => ME: ' + message);
			if(message === "PING"){
				console.log('received PING from ', from, ' responding...');
				client.say(from, "PONG");
			}else if(message === "PONG"){
				console.log('received PONG from ', from, ' logging...');
				MYBOT.pongs++;
			}


			//reset to false for next time...
			MYBOT.handledMsg = false;
			MYBOT.parseMentions(from, from, message);
			MYBOT.parsePM(from, message);
			MYBOT.parseMessage(from, message);
			if(!handledMsg){
				client.say(from, from + ", I don't understand '" + text + "'");
			}
	});//End of pm listener

	//Handle on message in target channel event
	client.addListener("message" + MYBOT.opts.channelName, function (nick,text) {
		MYBOT.handleMessage(nick, text);

		var now = new Date();

		var when = now.getMonth() + "/" + now.getDate() + "/" + now.getFullYear() + " " + now.getHours() + ":" + now.getMinutes();
		socket.broadcast.emit('message', when + ' (' + nick + ') ' + text);
	});

	socket.on('showHistory', function (name, fn) {
		fn(MYBOT.targetedActions['show history [N]'].doAction("browser", "show history 10", [10,10], MYBOT));
	});
	socket.on('message', function (msg) {
			console.log('Message Received: ', msg);
			socket.broadcast.emit('message', msg);
			client.say('#fuel_platform_team', msg);
	});
});

/*
var app = require('express').createServer();
app.get('/', function(req, res) {
	if(!!config.password && req.query.password===config.password){
		res.send('FUELBot running on cloud foundry. <p>' + MYBOT.targetedActions['show history [N]'].doAction("browser", "show history 10", [10,10], MYBOT));
	}else{
		res.send('FUELBot running on cloud foundry.');
	}
});
app.listen(3000);
*/