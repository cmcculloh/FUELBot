//any optional attributes are populated with their default values for reference (and can be removed when implementing).
module.exports = function(self){
	return {
		"showInHelp": true,//optional. whether to show this action to users when they type help
		"actionName": "roll dice",//optional. name in the help list
		"helpText": "[NdN] to roll dice, ie [1d20] or [2d4], etc",//optional. This is just a sample action that can never be triggered because it has no simpleTrigger defined
		"simpleTrigger": "d",//required. any of these words will flag this action for consideration
		"trigger": /\[([0-9]+)d([0-9]+)\]/,//optional. the text must match this exactly (this is a regex) in order for doAction to be triggered
		"doAction": function(from, msg, matches, self){
			var dieRoll = self.handleDieRoll(matches);

			return [from, ": ", dieRoll[1], "d", dieRoll[2], ": ", dieRoll[3]].join('');
		},//required. can return a string that the bot will use to respond. This happens if the regex evaluates to true
		"responseMethods": {"pm":"pm", "public":"public"}//optional. determines how the bot should respond to each message type
	};
};