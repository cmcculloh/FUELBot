module.exports = function(self){
	return {
	"showInHelp": true,//whether to show this action to users when they type help
	"actionName": "help",//name in the help list
	"helpText": "Shows this help menu",
	"simpleTrigger": "help",/*any of these words will flag this action for consideration*/
	"trigger": /^help$/gi,/*the text must match this exactly (this is a regex) in order for doAction to be triggered*/
	"doAction": function(from, msg, matches, self){
		var response = "";

		for(var i=0; i<self.actions.length; i++){
			if(!self.actions[i].showInHelp){continue;}

			response += "\n" + self.actions[i].actionName + ": " + self.actions[i].helpText;
		}

		return response;
	},/*can return a string that the bot will use to respond. This happens if the regex evaluates to true*/
	"responseMethods": {"pm":"pm", "public":"pm"}/*determines how the bot should respond to each message type*/
	};
};