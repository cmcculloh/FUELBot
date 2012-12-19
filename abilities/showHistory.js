module.exports = function(self){
	return {
	"showInHelp": true,//whether to show this action to users when they type help
	"actionName": "show history [N]",//name in the help list
	"helpText": "PMs you a history of previous conversations that the bot has listened to",
	"simpleTrigger":"history",
	"trigger": /show history ([0-9]*)/i,
	"doAction":function(from, msg, matches, self){
		var num;
		var newline = '\n';

		if(matches[1] && matches[1] > 0){
			num = matches[1];
		}else{
			num = 10;
			if(num > self.msgs.length){
				num = self.msgs.length;
			}
		}

		if(from === "browser"){
			newline = '<br>';
		}

		var response = "history: ";
		while(num > 0){
			slot = self.msgs.length - num;
			if(!!self.msgs[slot]){
				response += newline + self.msgs[slot].when + " (" + self.msgs[slot].nick + ") " + self.msgs[slot].text;
			}
			num--;
		}

		return response;
	},
	"responseMethods":{"pm":"pm","public":"pm"}
	};
};