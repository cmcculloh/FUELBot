exports.MYBOT = MYBOT;

function MYBOT(config){
	var self = this;
	self.opts = {
		channelName: config.channelName || "#fuelbottest",
		nick: config.nick || "FUELBot",
		password: config.password || "",
		EXTERNALBotNames: config.EXTERNALBotNames || ["GitHubBot"],
		FUELBotNames: config.FUELBotNames || ["FUELBot", "FUELBot1", "FUELBot2"],
		mode: config.mode || "+t-n",
		privateChannel: config.privateChannel || false,
		topic: config.topic || 'The completely non-sanctioned, unofficial place to hang out and discuss ' + config.channelName + ' related things.'
	};
	self.msgs = [];
	self.handledMsg = false;
	self.isPrimaryBot = true;
	self.pongs = 0;

	var isExternalBot = function(nick){
		return (self.opts.EXTERNALBotNames.indexOf(nick) > -1);
	};

	var isFuelBotInstance = function(nick){
		return (self.opts.FUELBotNames.indexOf(nick) > -1);
	};

	var isBot = function(nick){
		return (isExternalBot(nick) || isFuelBotInstance(nick));
	};

	var isMe = function(nick){
		return (nick === self.opts.nick);
	};

	self.handleArrival= function(channel, nick, msg){
		if(isExternalBot(nick)){return;}

		console.log("handleArrival: ", channel, nick, msg);

		self.logMessage(nick, "joined the channel");
		if(!isFuelBotInstance(nick) && self.isPrimaryBot){
			self.client.say(self.opts.channelName, nick + ", welcome to the " + self.opts.channelName + " channel on freenode!");
		}else{
			if(self.opts.nick === nick){
				self.client.whois(nick, self.handleWhoIs);
			}
		}
	};

	self.handleMessage = function(nick, text){
		self.logMessage(nick, text);

		self.parseMentions(nick, self.opts.channelName, text);

		if(self.isPrimaryBot){
			if(!isExternalBot(nick)){
				//reset to false for next time...
				self.handledMsg = false;
				self.parseMessage(nick, text);
				if(!self.handledMsg){
					client.say(nick, nick + ", I don't understand '" + text + "'");
				}
			}else{
				console.log(nick + ' is an external bot, ignoring');
			}
		}else{
			console.log('not primary, defer to primary');
		}
	};

	self.handleWhoIs = function(){
		if(arguments[0].channels.indexOf("@" + self.opts.channelName) <= -1 && arguments[0].channels.indexOf(self.opts.channelName) >= -1){
			console.log(arguments[0].channels.indexOf("@" + self.opts.channelName), arguments[0].channels, self.opts.channelName);

			self.seekFellows(0, true);
		}else{
			self.isPrimaryBot = true;
			if(self.opts.mode){
				self.client.send('MODE', self.opts.channelName, config.mode, self.opts.channelName);
			}
			if(self.opts.privateChannel){
				self.client.send('MODE', self.opts.channelName, '+k', self.opts.password);
			}
			self.client.send('TOPIC', self.opts.channelName, self.opts.topic);
		}
	};

	self.seekFellows = function(timesSought, seekOp){
		console.log('seekFellows ', timesSought, seekOp);
		timesSought++;

		if(timesSought <= 1){
			for(var i = 0; i < self.opts.FUELBotNames.length; i++){
				var nick = self.opts.FUELBotNames[i];

				if(!isMe(nick)){
					if(seekOp){
						self.client.say(nick, "gimmeopyo!!! " + self.opts.password);
					}
					self.client.say(nick, "PING");
				}
			}

			setTimeout(self.seekFellows, 500, timesSought, seekOp);
		}else if(timesSought < 11){
			if(self.pongs <= 0){
				setTimeout(self.seekFellows, 500, timesSought, seekOp);
			}else{
				console.log("PONGs received, not primary");
				self.isPrimaryBot = false;
				self.pongs = 0;
			}
		}else{
			console.log("There can be only one!");
			self.isPrimaryBot = true;
			self.pongs = 0;
			if(seekOp){
				console.log('seek op from human');
				self.client.say(self.opts.channelName, "HUMAN: Please grant me op level privileges so that I might guard your channel. Your cooperation is appreciated. Thank you.");
			}
		}
	};

	self.handleLeave = function(nick, reason, message){
		if(isExternalBot(nick)) return;

		if(isBot(nick)){
			if(!self.isPrimaryBot){self.seekFellows(0, false);}
		}else{
			self.logMessage(nick, "left the channel because " + reason);
			self.client.say(self.opts.channelName, "Thanks for coming " + nick + "! (" + reason + ")");
		}
	};

	self.logMessage = function(nick, text){
		var now = new Date();

		var when = now.getMonth() + "/" + now.getDate() + "/" + now.getFullYear() + " " + now.getHours() + ":" + now.getMinutes();
		self.msgs.push({"when": when, "nick":nick, "text":text});
		console.log(when, nick, text);
	};

	self.grantOp = function(nick){
		self.client.send('MODE', self.opts.channelName, '+o', nick);
	};

	self.deOp = function(nick){
		self.client.send('MODE', self.opts.channelName, '-o', nick);
	};

	self.handleDieRoll = function(dieRoll, nick){
		if(dieRoll[1] > 30){dieRoll[1] = 30;}
		if(dieRoll[2] > 200){dieRoll[2] = 200;}

		dieRoll[3] = 0;
		for(var i = 1; i <= dieRoll[1]; i++){
			dieRoll[3] += Math.ceil(Math.random()*dieRoll[2]);
		}

		return dieRoll;
	};


	//responses to messages can either manifest as public messages or PMs
	self.responses = {
		"how are you feeling": function(){return "fine, thanks!";},
		"behave!": function(){return "...I apologize. That was uncalled for.";},
		"can you hear me?": function(){return "yes, I can.";},
		"who is primary?": function(){
			if(self.isPrimaryBot){
				return "I am!";
			}
		},
		"d": function(msg, to, from){
			var dieRollRE = /\[([0-9]+)d([0-9]+)\]/g;
			var dieRoll = dieRollRE.exec(msg);

			if(dieRoll && dieRoll.length > 0){
				dieRoll = self.handleDieRoll(dieRoll);

				return [from, ": ", dieRoll[1], "d", dieRoll[2], ": ", dieRoll[3]].join('');
			}
		},
		"skill check": function(msg, to, from){
			var dcRE = /(dc|difficulty)?[\ ]*([0-9]+)/g;
			var dc = dcRE.exec(msg);

			if(dc && dc.length > 1){
				var roll = self.handleDieRoll(["[1d20]", 1, 20], from);

				if(dc[2] <= roll[3]){
					return [roll[3], "/", dc[2], "; ", from, " succeeds!"].join('');
				}else{
					return roll[3] + "/" + dc[2] + "; " + from + " fails :(";
				}
			}
		},
		"giveop": function(msg, to, from){
			if(msg.indexOf(self.opts.password) > -1){
				self.grantOp(from);
				return self.randomAdminQuote(to);
			}else{
				return "uh uh uh! You didn't say the magic word!";
			}
		},
		"gimmeopyo": function(msg, to){
			if(isBot(to) && msg.indexOf(self.opts.password) > -1){
				self.grantOp(to);
			}
		},
		"cookie": function(){
			return "EXTERMINATE! EXTERMINATE!";
		}
	};

	//public responses to private messages
	self.publicPMResponses = {
		"say": function(msg){return msg.replace('say ', '');},
		"become primary": function(){
			self.isPrimaryBot = true;
			return "I am now primary";
		}
	};

	//responses intended only to be PMed to a user
	self.privateResponses = {
		"help": function(){
			var response = "";

			response += "Bots will respond publicly to these PMs:";
			for(var trigger in self.publicPMResponses){
				response += "\n    " + trigger;
			}

			response += "\n\nBots will respond in kind to these messages and PMs:";
			for(var trigger in self.responses){
				response += "\n    " + trigger;
			}

			response += "\n\nBots will respond privately to these messages and PMs:";
			for(var trigger in self.privateResponses){
				response += "\n    " + trigger;
			}
			return response;
		},
		"show history":function(msg){
			var findN = /show\ history\ ([0-9]*)/g;
			var foundN = findN.exec(text);
			var num;

			if(foundN && foundN[1] && foundN[1] > 0){
				num = foundN[1];
			}else{
				num = 10;
				if(num > self.msgs.length){
					num = self.msgs.length;
				}
			}

			var response = "history: ";
			while(num > 0){
				slot = self.msgs.length - num;
				response += "\n " + self.msgs[slot].when + " (" + self.msgs[slot].nick + ") " + self.msgs[slot].text;
				num--;
			}

			return response;
		}
	};

	self.respond = function(to, from, msg, list){
		lwcsMsg = msg.toLowerCase();

		for(var trigger in list){
			if(lwcsMsg.indexOf(trigger) > -1){
				var say = list[trigger](msg, to, from);

				if(say){
					console.log('say: ', to, ", ", say);
					self.handled = true;
					self.client.say(to, say);
				}
			}
		}
	};

	self.parseMentions = function(from, to, text){
		var lwcsText = text.toLowerCase();
		var botnick = self.opts.nick.toLowerCase();
		var botNameSaid = (lwcsText.indexOf(botnick) > -1);

		//handle messages that require the bot's name to have been said
		if(botNameSaid && !isBot(from) && !self.handledMsg){
			self.respond(to, from, lwcsText, self.responses);
			self.respond(from, from, lwcsText, self.privateResponses);
		}
	};


	self.parsePM = function(nick, text){
		self.respond(self.opts.channelName, nick, text, self.publicPMResponses);
		self.respond(nick, nick, text, self.responses);
		self.respond(nick, nick, lwcsText, self.privateResponses);
	};

	self.parseMessage = function(nick, text){
		self.respond(self.opts.channelName, nick, text, self.responses);
		self.respond(nick, nick, text, self.privateResponses);

		self.handlePrimary(nick, text);
	};

	self.handlePrimary = function(nick, text){
		var findPrimary = /make ([a-zA-Z0-9\_\-]+) primary/g;
		var primary = findPrimary.exec(text);

		if(self.isPrimaryBot && primary && primary[1] && primary[1].length > 0){
			self.client.say(primary[1], "become primary");
			self.seekFellows(0, true);//failsafe in case the other bot doesn't exist
		}
	};

	self.randomAdminQuote = function(nick){
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
	};

	return self;
}
