console.log("Bot Started...", process.argv);
var irc = require('irc');

//For storing globals
var MYBOT = {};
//Channel to use
MYBOT.channelname = "#" + process.argv[2];
MYBOT.nick = process.argv[3];
MYBOT.isPrimaryBot = true;
MYBOT.pongs = 0;
MYBOT.password = process.argv[4];

EXTERNALBotNames = ["GitHubBot"];

FUELBotNames = ["FUELBot", "FUEL_RoButler"];

//Open an irc connection
var client = new irc.Client('irc.freenode.net', MYBOT.nick, {
	channels: [MYBOT.channelname + " " + MYBOT.password],
	debug: false,
	password: MYBOT.password,
	username: MYBOT.nick,
	realName: "FUELBot nodeJS IRC client"
});


//Handle on connect event
client.addListener("connect", function () {
	MYBOT.handleArrival(MYBOT.channelname, MYBOT.nick, "connect");
});

client.addListener("join", function(channel, nick, msg){
	MYBOT.handleArrival(channel, nick, msg);
});

MYBOT.isExternalBot = function(nick){
	return (EXTERNALBotNames.indexOf(nick) > -1);
};

MYBOT.isFuelBotInstance = function(nick){
	return (FUELBotNames.indexOf(nick) > -1);
};

MYBOT.isBot = function(nick){
	return (MYBOT.isExternalBot(nick) || MYBOT.isFuelBotInstance(nick));
};

MYBOT.handleArrival = function(channel, nick, msg){
	if(MYBOT.isExternalBot(nick)){return;}

	console.log("handleArrival: ", channel, nick, msg);

	MYBOT.logMessage(nick, "joined the channel");
	if(FUELBotNames.indexOf(nick) <= -1 && MYBOT.isPrimaryBot){
		client.say(MYBOT.channelname, nick + ", welcome to the " + MYBOT.channelname + " channel on freenode!");
	}else{
		if(MYBOT.nick === nick){
			client.whois(nick, MYBOT.handleWhoIs);
		}
	}
};

MYBOT.handleWhoIs = function(){
	if(arguments[0].channels.indexOf("@" + MYBOT.channelname) <= -1 && arguments[0].channels.indexOf(MYBOT.channelname) >= -1){
		console.log(arguments[0].channels.indexOf("@" + MYBOT.channelname), arguments[0].channels, MYBOT.channelname);

		MYBOT.seekFellows(0, true);
	}else{
		MYBOT.isPrimaryBot = true;
		client.send('MODE', MYBOT.channelname, '+pst', MYBOT.channelname);
		client.send('MODE', MYBOT.channelname, '+k', MYBOT.password);
		client.send('TOPIC', MYBOT.channelname, '"The completely non-sanctioned, unofficial place to hang out and discuss ' + MYBOT.channelname + ' related things."');
	}
};

MYBOT.seekFellows = function(timesSought, seekOp){
	console.log('seekFellows ', timesSought, seekOp);
	timesSought++;

	if(timesSought <= 1){
		for(var i = 0; i < FUELBotNames.length; i++){
			if(FUELBotNames[i] !== MYBOT.nick){
				if(seekOp){
					client.say(FUELBotNames[i], "gimmeopyo!!! " + MYBOT.password);
				}
				client.say(FUELBotNames[i], "PING");
			}
		}

		console.log('prepare settimeout');
		setTimeout(MYBOT.seekFellows, 500, timesSought, seekOp);
	}else if(timesSought < 11){
		if(MYBOT.pongs <= 0){
			console.log("prepare settimeout, timesSought: " , timesSought, "; pongs: " , MYBOT.pongs);
			setTimeout(MYBOT.seekFellows, 500, timesSought, seekOp);
		}else{
			console.log("PONGs received, not primary");
			MYBOT.isPrimaryBot = false;
			MYBOT.pongs = 0;
		}
	}else{
		console.log("There can be only one!");
		MYBOT.isPrimaryBot = true;
		MYBOT.pongs = 0;
		if(seekOp){
			console.log('seek op from human');
			client.say(MYBOT.channelname, "HUMAN: Please grant me op level privileges so that I might guard your channel. Your cooperation is appreciated. Thank you.");
		}
	}
};

client.addListener("part", function (channel, nick, reason, message) {
	console.log(nick, 'part');
	MYBOT.handleLeave(nick, reason, message);
});

client.addListener("quit", function (nick, reason, channels, message) {
	console.log(nick, 'quit');
	MYBOT.handleLeave(nick, reason, message);
});

MYBOT.handleLeave = function(nick, reason, message){
	if(MYBOT.isExternalBot(nick)) return;

	if(FUELBotNames.indexOf(nick) >= -1){
		if(!MYBOT.isPrimaryBot){MYBOT.seekFellows(0, false);}
	}else{
		MYBOT.logMessage(nick, "left the channel because " + reason);
		client.say(MYBOT.channelname, "Thanks for coming " + nick + "! (" + reason + ")");
	}
};

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
		MYBOT.parsePM(from, message);
		MYBOT.parseMessage(from, message);
		if(!handledMsg){
			client.say(from, from + ", I don't understand '" + text + "'");
		}
});//End of pm listener

//Handle on message in target channel event
client.addListener("message" + MYBOT.channelname, function (nick,text) {
	MYBOT.logMessage(nick, text);

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

MYBOT.msgs = [];
MYBOT.logMessage = function(nick, text){
	var now = new Date();

	var when = now.getMonth() + "/" + now.getDate() + "/" + now.getFullYear() + " " + now.getHours() + ":" + now.getMinutes();
	MYBOT.msgs.push({"when": when, "nick":nick, "text":text});
	console.log(when, nick, text);
};

MYBOT.handleDieRoll = function(dieRoll, nick){
	if(dieRoll[1] > 30){dieRoll[1] = 30;}
	if(dieRoll[2] > 200){dieRoll[2] = 200;}

	var total = 0;
	for(var i = 1; i <= dieRoll[1]; i++){
		total += Math.ceil(Math.random()*dieRoll[2]);
	}
	client.say(MYBOT.channelname, [nick, ": ", dieRoll[1], "d", dieRoll[2], ": ", total].join(''));

	return total;
};

MYBOT.handledMsg = false;
MYBOT.parsePM = function(nick, text){
	var lwcsText = text.toLowerCase();
	if(lwcsText.indexOf('say ') > -1){
		var toSay = lwcsText.replace('say ', '');
		client.say(MYBOT.channelname, toSay);

		MYBOT.handledMsg = true;
	}
};

MYBOT.parseMessage = function(nick, text){
	var lwcsText = text.toLowerCase();
	var botnick = MYBOT.nick.toLowerCase();
	var botNameSaid = (lwcsText.indexOf(botnick) > -1);

	if(lwcsText.indexOf("who is primary?") > -1){
		if(MYBOT.isPrimaryBot){
			client.say(MYBOT.channelname, "I am!");
		}else{
			client.say(nick, "Not me");
		}
		MYBOT.handledMsg = true;
	}

	if(lwcsText.indexOf("help") > -1){
		client.say(nick, "commands are: 'show history N', 'help', 'behave!', 'giveop', 'who is primary?', 'say [your msg here, ommit the brackets]'");
		client.say(nick, "roll dice by specifying the number of dice followed by a 'd' followed by the sides the die should have all inside brackets. Like: [1d20] or [3d4]. To do a skill check, say 'skill check dc N(1-20)' like: 'skill check dc 12'");
		MYBOT.handledMsg = true;
	}

	var dieRollRE = /\[([0-9]+)d([0-9]+)\]/g;
	var dieRoll = dieRollRE.exec(lwcsText);

	if(dieRoll && dieRoll.length > 0){
		MYBOT.handleDieRoll(dieRoll, nick);
		MYBOT.handledMsg = true;
	}


	var dcRE = /(dc|difficulty)?[\ ]*([0-9]+)/g;
	var dc = dcRE.exec(lwcsText);

	if(lwcsText.indexOf('skill check') > -1 && dc && dc.length > 1){
		var roll = MYBOT.handleDieRoll(["[1d20]", 1, 20], nick);

		if(dc[2] <= roll){
			client.say(MYBOT.channelname, "Succeed!");
		}else{
			client.say(MYBOT.channelname, "Fail :(");
		}

		MYBOT.handledMsg = true;
	}

	if(lwcsText.indexOf("show history") > -1){
		MYBOT.showHistory(nick, lwcsText);

		MYBOT.handledMsg = true;
	}

	if(lwcsText.indexOf("giveop") > -1){
		if(lwcsText.indexOf(MYBOT.password) > -1){
			client.say(MYBOT.channelname, MYBOT.randomAdminQuote(nick));
			client.send('MODE', MYBOT.channelname, '+o', nick);
		}else{
			client.say(MYBOT.channelname, "uh uh uh! You didn't say the magic word!");
		}

		MYBOT.handledMsg = true;
	}

	if(lwcsText.indexOf("gimmeopyo") > -1 && FUELBotNames.indexOf(nick) > -1 && lwcsText.indexOf(MYBOT.password) > -1){
		client.send('MODE', MYBOT.channelname, '+o', nick);

		MYBOT.handledMsg = true;
	}

	if(lwcsText === "cookie"){
		client.say(MYBOT.channelname, "EXTERMINATE! EXTERMINATE!");

		MYBOT.handledMsg = true;
	}

	//handle messages that require the bot's name to have been said
	if(botNameSaid && !MYBOT.isBot(nick) && !MYBOT.handledMsg){
		if(lwcsText.indexOf("behave!") > -1){
			client.say(MYBOT.channelname, nick + "... I apologize. That was uncalled for.");
		}
	}
};

MYBOT.showHistory = function(nick, text){
	var findN = /show\ history\ ([0-9]*)/g;
	var foundN = findN.exec(text);
	var num;

	if(foundN && foundN[1] && foundN[1] > 0){
		num = foundN[1];
	}else{
		num = 10;
		if(num > MYBOT.msgs.length){
			num = MYBOT.msgs.length;
		}
	}

	var response = "history: ";
	while(num > 0){
		slot = MYBOT.msgs.length - num;
		response += "\n " + MYBOT.msgs[slot].when + " (" + MYBOT.msgs[slot].nick + ") " + MYBOT.msgs[slot].text;
		num--;
	}
	client.say(nick, response);
	console.log('history:', response);
};

MYBOT.randomAdminQuote = function(nick){
	var ran;

	var quotes = [
		"You've enjoyed all the power you've been given, haven't you? I wonder how you'd take to working in a pocket calculator.",
		"On the other side of the screen, it all looks so easy.",
		"FYI man, alright. You could sit at home, and do like absolutely nothing, and your name goes through like 17 computers a day. 1984? Yeah right, man. That's a typo. Orwell is here now. He's livin' large. We have no names, man. No names. We are nameless!",
		"Someone didn't bother reading my carefully prepared memo on commonly-used passwords. Now, then, as I so meticulously pointed out, the four most-used passwords are: love, sex, secret, and God. So, would your holiness care to change her password?",
		"Type \"cookie\", you idiot.",
		"You're in the butter zone now, baby.",
		"\"When I get all excited about a topic I start gesticulating.\" -Ian Murdock",
		"\"If I were wearing a black turtle neck, I'd tell you this was going to be a magical experience\" -Kevin Parkerson",
		"\"This is going to make you ill with joy\" -Kevin Parkerson",
		"Hello. My name is Inigo Montoya. You killed my father. Prepare to die.",
		"You rush a miracle man, you get rotten miracles.",
		"Oh, the sot has spoken. What happens to her is not truly your concern. I will kill her. And remember this, never forget this: when I found you, you were so slobbering drunk, you couldn't buy Brandy!",
		"As I told you, it would be absolutely, totally, and in all other ways inconceivable.",
		"You keep using that word. I do not think it means what you think it means.",
		"I do not mean to pry, but you don't by any chance happen to have six fingers on your right hand?",
		"I can't compete with you physically, and you're no match for my brains. Let me put it this way. Have you ever heard of Plato, Aristotle, Socrates? Morons.",
		"Life is pain, " + nick + ". Anyone who says differently is selling something.",
		"This will be a day long remembered. It has seen the end of Kenobi, and will soon see the end of the rebellion.",
		"What a piece of junk!",
		"Don’t call me a mindless philosopher, you overweight glob of grease.",
		"I’m " + nick + ", I’m here to rescue you.",
		"Watch your mouth kid, or you’ll find yourself floating home.",
		"Evacuate in our moment of triumph? I think you overestimate their chances.",
		"If this is a consular ship, where is the ambassador? — Commander, tear this ship apart until you’ve found those plans. And bring me the passengers, I want them alive!",
		"Look, good against remotes is one thing, good against the living, that’s something else.",
		"Aren’t you a little short for a stormtrooper?",
		"What are we going to do? We’ll be sent to the spice mines of Kessel and smashed into who knows what.",
		"That’s no moon, it’s a space station.",
		"This is some rescue. You came in here and you didn’t have a plan for getting out?",
		"He’s the brains, sweetheart!",
		"Mos Eisley spaceport. You will never find a more wretched hive of scum and villainy.",
		"Into the garbage chute, flyboy!",
		"This is Red 5, I’m going in.",
		"Boring conversation anyway. Luke, we’re gonna have company!",
		"The Force is strong with this one.",
		"I suggest a new strategy, R2. Let the wookiee win.",
		"I’m a member of the Imperial Senate on a diplomatic mission to Alderaan.",
		"You are part of the Rebel Alliance and a traitor. Take her away!",
		"You’re all clear, kid! Now let’s blow this thing and go home!",
		"These blast points — too accurate for sandpeople. Only imperial stormtroopers are so precise.",
		"I’ve got a very bad feeling about this.",
		"You’ve never heard of the Millennium Falcon? … It’s the ship that made the Kessel run in less than 12 parsecs.",
		"When I left you, I was but the learner, now I am the master.",
		"I find your lack of faith disturbing.",
		"Use the Force, " + nick,
		"You don’t need to see his identification … These aren’t the droids you’re looking for … He can go about his business … Move along.",
		"Help me " + nick + ". You’re my only hope.",
		"I'm fine... We're all fine here. How are you?"
	];

	return quotes[Math.floor(Math.random() * quotes.length)];
}