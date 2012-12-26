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

socketio.listen(server).on('connection', function (socket) {
	var MYBOT = new bot.MYBOT(config);


	socket.on('createClient', function (opts, fn) {
		MYBOT.opts.nick = opts[0];
		MYBOT.opts.FUELBotNames = [opts[0]];

		//Open an irc connection
		MYBOT.client = new irc.Client('irc.freenode.net', opts[0], {
			channels: [MYBOT.opts.channelName + " " + opts[1]],
			debug: false,
			password: opts[1],
			username: opts[0],
			realName: "FUELBot nodeJS IRC client"
		});

		//Handle private messages
		MYBOT.client.addListener('pm', function (from, message) {
			console.log('PM', from, message);
			var when = MYBOT.getTime();
			socket.emit('message', '<span class="pm">' + when + ' (' + from + ') PM: ' + message + '</span>');
		});//End of pm listener

		//Allow to be kicked
		MYBOT.client.addListener("kick" + MYBOT.opts.channelName, function(nick, by, reason, message){
			if(nick === MYBOT.opts.nick){
				socket.emit('message', 'You have been kicket by ' + by);
				socket.disconnect();
				MYBOT.client.disconnect();
				delete socket;
				delete MYBOT;
			}
		});

		//Handle on message in target channel event
		MYBOT.client.addListener("message" + MYBOT.opts.channelName, function (nick,text) {
			console.log('message', nick, text);

			var when = MYBOT.getTime();
			socket.emit('message', '<span class="light">' + when + ' (' + nick + ')</span> ' + text);
		});

		MYBOT.client.addListener("join", function(channel, nick, msg){
			console.log('join', channel, nick, msg);
			var when = MYBOT.getTime();
			socket.emit('message', '<span class="statusUpdate"><span class="light">' + when + '</span> ' + nick + ' joined ' + channel + '</span>');
		});

		MYBOT.client.addListener("part", function (channel, nick, reason, message) {
			console.log('part', channel, nick, reason, message);
			var when = MYBOT.getTime();
			socket.emit('message', '<span class="statusUpdate"><span class="light">' + when + ' (' + nick + ')</span> ' + message + " - " + reason + "</span>");
		});
	});
	socket.on('showHistory', function (name, fn) {
		console.log('show history');
		fn(FUELBot.targetedActions['show history [N]'].doAction("browser", "show history 10", [10,10], MYBOT));
	});
	socket.on('message', function (msg) {
		console.log('message from me', msg);
		MYBOT.client.say('#fuel_platform_team', msg);
		var when = MYBOT.getTime();
		socket.emit('message', '<span class="fromme"><span class="light">' + when + ' (' + MYBOT.opts.nick + ')</span> ' + msg + '</span>');
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