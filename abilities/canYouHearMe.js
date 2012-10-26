module.exports = function(self){
	return {
		"showInHelp": true,
		"helpText": "makes bot respond telling you that he can hear you",
		"simpleTrigger": "can you hear me?",/*any of these words will flag this action for consideration*/
		"doAction": function(from, msg, matches){return "yes I can!";}/*can return a string that the bot will use to respond. This happens if the regex evaluates to true*/
	};
};