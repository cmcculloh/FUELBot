module.exports = function(self){
	return {
		"simpleTrigger": "say",/*any of these words will flag this action for consideration*/
		"trigger": new RegExp("(" + self.opts.nick + ")(,|:)? say ", "i"),
		"doAction": function(from, msg, matches){
			return msg.replace(matches[1], '').replace(matches[2], '').replace(" say", '');
		},/*can return a string that the bot will use to respond. This happens if the regex evaluates to true*/
		"responseMethods": {"pm":"public", "public":"public"}
	};
};