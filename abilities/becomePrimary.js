//any optional attributes are populated with their default values for reference (and can be removed when implementing).
module.exports = function(self){
	return {
		"simpleTrigger": "become primary",//required. any of these words will flag this action for consideration
		"doAction": function(from, msg, matches, self){
			MYBOT.isPrimaryBot = true;
			return "I am now primary";
		},//required. can return a string that the bot will use to respond. This happens if the regex evaluates to true
		"responseMethods": {"pm":"public", "public":"public"}//optional. determines how the bot should respond to each message type
	};
};