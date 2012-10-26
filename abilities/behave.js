//any optional attributes are populated with their default values for reference (and can be removed when implementing).
module.exports = function(self){
	return {
		"showInHelp": true,//optional. whether to show this action to users when they type help
		"actionName": "behave!",//optional. name in the help list
		"helpText": "Make the bot apologize",//optional. This is just a sample action that can never be triggered because it has no simpleTrigger defined
		"simpleTrigger": "behave!",//required. any of these words will flag this action for consideration
		"trigger": new RegExp(self.opts.nick + "(:|,)? behave!", "i"),//optional. the text must match this exactly (this is a regex) in order for doAction to be triggered
		"doAction": function(from, msg, matches, self){return "...I apologize. That was uncalled for.";},//required. can return a string that the bot will use to respond. This happens if the regex evaluates to true
		"responseMethods": {"pm":"public", "public":"public"}//optional. determines how the bot should respond to each message type
	};
};