exports.MYBOT = MYBOT;

function MYBOT(config){
	var self = this;
	self.opts = {
		channelName: config.channelName || "#fuelbottest",
		nick: config.nick || "FUELBot",
		password: config.password || "",
		EXTERNALBotNames: config.EXTERNALBotNames || ["GitHubBot"],
		FUELBotNames: config.FUELBotNames || ["FUELBot", "FUELBot1", "FUELBot2"]
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

	self.handleWhoIs = function(){
		if(arguments[0].channels.indexOf("@" + self.opts.channelName) <= -1 && arguments[0].channels.indexOf(self.opts.channelName) >= -1){
			console.log(arguments[0].channels.indexOf("@" + self.opts.channelName), arguments[0].channels, self.opts.channelName);

			self.seekFellows(0, true);
		}else{
			self.isPrimaryBot = true;
			self.client.send('MODE', self.opts.channelName, '+pst', self.opts.channelName);
			self.client.send('MODE', self.opts.channelName, '+k', self.opts.password);
			self.client.send('TOPIC', self.opts.channelName, '"The completely non-sanctioned, unofficial place to hang out and discuss ' + self.opts.channelName + ' related things."');
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

			console.log('prepare settimeout');
			setTimeout(self.seekFellows, 500, timesSought, seekOp);
		}else if(timesSought < 11){
			if(self.pongs <= 0){
				console.log("prepare settimeout, timesSought: " , timesSought, "; pongs: " , self.pongs);
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

	self.handleDieRoll = function(dieRoll, nick){
		if(dieRoll[1] > 30){dieRoll[1] = 30;}
		if(dieRoll[2] > 200){dieRoll[2] = 200;}

		var total = 0;
		for(var i = 1; i <= dieRoll[1]; i++){
			total += Math.ceil(Math.random()*dieRoll[2]);
		}
		self.client.say(self.opts.channelName, [nick, ": ", dieRoll[1], "d", dieRoll[2], ": ", total].join(''));

		return total;
	};

	//responses to messages
	var responses = {
		"how are you feeling": function(){return "fine, thanks!";},
		"behave!": function(){return "...I apologize. That was uncalled for.";},
		"can you hear me?": function(){return "yes, I can.";}
	};

	//public responses to private messages
	var publicPMResponses = {
		"say": function(msg){return msg.replace('say ', '');},
		"become primary": function(){
			self.isPrimaryBot = true;
			return "I am now primary";
		}
	};

	self.parseMentions = function(from, to, text){
		var lwcsText = text.toLowerCase();
		var botnick = self.opts.nick.toLowerCase();
		var botNameSaid = (lwcsText.indexOf(botnick) > -1);

		console.log('parseMentions: ', to, text);

		//handle messages that require the bot's name to have been said
		if(botNameSaid && !isBot(from) && !self.handledMsg){
			self.respond(to, lwcsText, responses);
		}
	};

	self.respond = function(to, msg, list){
		lwcsMsg = msg.toLowerCase();

		for(var trigger in list){
			console.log('trigger: ', trigger, msg);
			if(lwcsMsg.indexOf(trigger) > -1){
				console.log('yes');
				var say = list[trigger](msg);
				console.log(msg);
				self.handled = true;
				self.client.say(to, say);
			}
		}
	};

	self.parsePM = function(nick, text){
		self.respond(self.opts.channelName, text, publicPMResponses);
		self.respond(nick, text, responses);
	};

	self.parseMessage = function(nick, text){
		var lwcsText = text.toLowerCase();

		if(lwcsText.indexOf("who is primary?") > -1){
			if(self.isPrimaryBot){
				self.client.say(self.opts.channelName, "I am!");
			}else{
				self.client.say(nick, "Not me");
			}
			self.handledMsg = true;
		}

		self.handlePrimary(nick, text);

		if(lwcsText.indexOf("help") > -1){
			self.client.say(nick, "commands are: 'show history N', 'help', 'behave!', 'giveop', 'who is primary?', 'say [your msg here, ommit the brackets]'");
			self.client.say(nick, "roll dice by specifying the number of dice followed by a 'd' followed by the sides the die should have all inside brackets. Like: [1d20] or [3d4]. To do a skill check, say 'skill check dc N(1-20)' like: 'skill check dc 12'");
			self.handledMsg = true;
		}

		var dieRollRE = /\[([0-9]+)d([0-9]+)\]/g;
		var dieRoll = dieRollRE.exec(lwcsText);

		if(dieRoll && dieRoll.length > 0){
			self.handleDieRoll(dieRoll, nick);
			self.handledMsg = true;
		}


		var dcRE = /(dc|difficulty)?[\ ]*([0-9]+)/g;
		var dc = dcRE.exec(lwcsText);

		if(lwcsText.indexOf('skill check') > -1 && dc && dc.length > 1){
			var roll = self.handleDieRoll(["[1d20]", 1, 20], nick);

			if(dc[2] <= roll){
				self.client.say(self.opts.channelName, "Succeed!");
			}else{
				self.client.say(self.opts.channelName, "Fail :(");
			}

			self.handledMsg = true;
		}

		if(lwcsText.indexOf("show history") > -1){
			self.showHistory(nick, lwcsText);

			self.handledMsg = true;
		}

		if(lwcsText.indexOf("giveop") > -1){
			if(lwcsText.indexOf(self.opts.password) > -1){
				self.client.say(self.opts.channelName, self.randomAdminQuote(nick));
				self.client.send('MODE', self.opts.channelName, '+o', nick);
			}else{
				self.client.say(self.opts.channelName, "uh uh uh! You didn't say the magic word!");
			}

			self.handledMsg = true;
		}

		if(lwcsText.indexOf("gimmeopyo") > -1 && isBot(nick) && lwcsText.indexOf(self.opts.password) > -1){
			self.client.send('MODE', self.opts.channelName, '+o', nick);

			self.handledMsg = true;
		}

		if(lwcsText === "cookie"){
			self.client.say(self.opts.channelName, "EXTERMINATE! EXTERMINATE!");

			self.handledMsg = true;
		}
	};

	self.handlePrimary = function(nick, text){
		var findPrimary = /make ([a-zA-Z0-9\_\-]+) primary/g;
		var primary = findPrimary.exec(text);

		if(self.isPrimaryBot && primary && primary[1] && primary[1].length > 0){
			self.client.say(primary[1], "become primary");
			self.seekFellows(0, true);//failsafe in case the other bot doesn't exist
		}
	};

	self.showHistory = function(nick, text){
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
		self.client.say(nick, response);
		console.log('history:', response);
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
