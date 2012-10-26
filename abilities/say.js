module.exports = function(self){
	return {
		"simpleTrigger": "say",/*any of these words will flag this action for consideration*/
		"trigger": new RegExp(self.nick + ": say "),
		"doAction": function(from, msg, matches){return msg.replace('say ', '');}/*can return a string that the bot will use to respond. This happens if the regex evaluates to true*/
	};
};