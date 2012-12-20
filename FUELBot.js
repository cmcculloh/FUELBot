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

var FUELBot = new bot.MYBOT(config);
//Open an irc connection
FUELBot.client = new irc.Client('irc.freenode.net', FUELBot.opts.nick, {
	channels: [FUELBot.opts.channelName + " " + FUELBot.opts.password],
	debug: false,
	password: FUELBot.password,
	username: FUELBot.nick,
	realName: "FUELBot nodeJS IRC client"
});

//Handle on connect event
FUELBot.client.addListener("connect", function () {
	FUELBot.handleArrival(FUELBot.opts.channelName, FUELBot.opts.nick, "connect");
});

FUELBot.client.addListener("join", function(channel, nick, msg){
	FUELBot.handleArrival(channel, nick, msg);
});

FUELBot.client.addListener("part", function (channel, nick, reason, message) {
	FUELBot.handleLeave(nick, reason, message);
});

FUELBot.client.addListener("quit", function (nick, reason, channels, message) {
	FUELBot.handleLeave(nick, reason, message);
});

//Handle private messages
FUELBot.client.addListener('pm', function (from, message) {
		console.log(from + ' => ME: ' + message);
		if(message === "PING"){
			console.log('received PING from ', from, ' responding...');
			FUELBot.client.say(from, "PONG");
		}else if(message === "PONG"){
			console.log('received PONG from ', from, ' logging...');
			FUELBot.pongs++;
		}


		//reset to false for next time...
		FUELBot.handledMsg = false;
		FUELBot.parseMentions(from, from, message);
		FUELBot.parsePM(from, message);
		FUELBot.parseMessage(from, message);
		if(!handledMsg){
			FUELBot.client.say(from, from + ", I don't understand '" + text + "'");
		}
});//End of pm listener

//Handle on message in target channel event
FUELBot.client.addListener("message" + FUELBot.opts.channelName, function (nick,text) {
	FUELBot.handleMessage(nick, text);
});

var fs = require('fs')
		, http = require('http')
		, socketio = require('socket.io');

var server = http.createServer(function(req, res) {
		res.writeHead(200, { 'Content-type': 'text/html'});
		res.end(fs.readFileSync(__dirname + '/index.html'));
}).listen(3000, function() {
		console.log("Nodebot listening");
});
/*
socketio.listen(server).on('connection', function (socket) {
	config.nick=socket.id;
	config.FUELBotNames=[socket.id];
	var MYBOT = new bot.MYBOT(config);
	MYBOT.client = new irc.Client('irc.freenode.net', config.nick, {
		channels: [MYBOT.opts.channelName + " " + MYBOT.opts.password],
		debug: false,
		password: MYBOT.password,
		username: config.nick,
		realName: "FUELBot nodeJS IRC client"
	});
	//Handle on message in target channel event
	MYBOT.client.addListener("message" + MYBOT.opts.channelName, function (nick,text) {
		//MYBOT.handleMessage(nick, text);
		console.log('got message from irc:', nick, text);
		var now = new Date();

		var when = now.getMonth() + "/" + now.getDate() + "/" + now.getFullYear() + " " + now.getHours() + ":" + now.getMinutes();
		socket.emit('message', socket.id + ": " + when + ' (' + nick + ') ' + text);
		console.log('got to here');
	});
	socket.on('message', function (msg) {
		console.log('Message Received: ', msg);
		MYBOT.client.say('#fuel_platform_team', msg);
		socket.emit('message', socket.id + ": " + msg);
	});
});*/
socketio.listen(server).on('connection', function (socket) {
	var MYBOT = new bot.MYBOT(config);

	socket.on('createClient', function (name, fn) {
		MYBOT.opts.nick = name;
		MYBOT.opts.FUELBotNames = [name];

		//Open an irc connection
		MYBOT.client = new irc.Client('irc.freenode.net', name, {
			channels: [MYBOT.opts.channelName + " " + MYBOT.opts.password],
			debug: false,
			password: MYBOT.password,
			username: name,
			realName: "FUELBot nodeJS IRC client"
		});

		//Handle private messages
		MYBOT.client.addListener('pm', function (from, message) {
				console.log(from + ' => ME: ' + message);
				if(message === "PING"){
					console.log('received PING from ', from, ' responding...');
					MYBOT.client.say(from, "PONG");
				}else if(message === "PONG"){
					console.log('received PONG from ', from, ' logging...');
					MYBOT.pongs++;
				}


			var now = new Date();

			var when = now.getMonth() + "/" + now.getDate() + "/" + now.getFullYear() + " " + now.getHours() + ":" + now.getMinutes();
			socket.emit('message', '<b><i>PM:' + when + ' (' + from + ') ' + message + '</i></b>');
		});//End of pm listener

		//Handle on message in target channel event
		MYBOT.client.addListener("message" + MYBOT.opts.channelName, function (nick,text) {
			//MYBOT.handleMessage(nick, text);
			console.log('got message from irc:', nick, text);
			var now = new Date();

			var when = now.getMonth() + "/" + now.getDate() + "/" + now.getFullYear() + " " + now.getHours() + ":" + now.getMinutes();
			socket.emit('message', '<span class="light">' + when + ' (' + nick + ')</span> ' + text);
			console.log('got to here');
		});
	});
	socket.on('showHistory', function (name, fn) {
		console.log('show history');
		fn(MYBOT.targetedActions['show history [N]'].doAction("browser", "show history 10", [10,10], MYBOT));
	});
	socket.on('message', function (msg) {
			console.log('Message Received: ', msg);
			//socket.broadcast.emit('message', 'from socket.on message:'+ msg);
			MYBOT.client.say('#fuel_platform_team', msg);
			var now = new Date();

			var when = now.getMonth() + "/" + now.getDate() + "/" + now.getFullYear() + " " + now.getHours() + ":" + now.getMinutes();
			socket.emit('message', '<span class="light">' + when + ' (' + MYBOT.opts.nick + ')</span> ' + msg);
			console.log('done with message');
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