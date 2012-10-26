//any optional attributes are populated with their default values for reference (and can be removed when implementing).
module.exports = function(self){
	return {
		"showInHelp": false,//optional. whether to show this action to users when they type help
		"actionName": this.simpleTrigger,//optional. name in the help list
		"helpText": "",//optional. This is just a sample action that can never be triggered because it has no simpleTrigger defined
		"simpleTrigger": "",//required. any of these words will flag this action for consideration
		"trigger": new RegExp(this.simpleTrigger),//optional. the text must match this exactly (this is a regex) in order for doAction to be triggered
		"doAction": function(from, msg, matches, self){return "whatever you want the bot to say";},//required. can return a string that the bot will use to respond. This happens if the regex evaluates to true
		"responseMethods": {"pm":"pm", "public":"public"}//optional. determines how the bot should respond to each message type
	};
};