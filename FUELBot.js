console.log("Bot Started...", process.argv);

var config = require('./config').config;
var irc = require('irc');
var bot = require('./MYBOT');

var args = process.argv;
while(args.length > 0){
	var arg = args[0].split('=');
	var key = arg[0];
	var val = arg[1];

	switch(key){
		case 'channelName':
			config.channelName = "#" + val;
			break;
		case 'nick':
			config.nick = val;
			break;
		case 'password':
			config.password = val;
			break;
	}

	args.shift();
}

var MYBOT = new bot.MYBOT(config);


//load in the bot's abilities
	//loop through the abilities directory and require each file
console.log(MYBOT);

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
	MYBOT.handleArrival(MYBOT.opts.channelname, MYBOT.opts.nick, "connect");
});

client.addListener("join", function(channel, nick, msg){
	MYBOT.handleArrival(channel, nick, msg);
});

client.addListener("part", function (channel, nick, reason, message) {
	console.log(nick, 'part');
	MYBOT.handleLeave(nick, reason, message);
});

client.addListener("quit", function (nick, reason, channels, message) {
	console.log(nick, 'quit');
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
	MYBOT.logMessage(nick, text);

	MYBOT.parseMentions(nick, MYBOT.opts.channelName, text);

	if(MYBOT.isPrimaryBot){
		if(!MYBOT.isExternalBot(nick)){
			//reset to false for next time...
			MYBOT.handledMsg = false;
			MYBOT.parseMessage(nick, text);
			if(!handledMsg){
				client.say(nick, nick + ", I don't understand '" + text + "'");
			}
		}
	}else{
		console.log('not primary, defer to primary');
	}
});


