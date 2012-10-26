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


var config = require('./configs/' + args.configFile).config;
var irc = require('irc');
var bot = require('./MYBOT');
var MYBOT = new bot.MYBOT(config);

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
});


