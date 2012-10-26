//any optional attributes are populated with their default values for reference (and can be removed when implementing).
module.exports = function(self){
	return {
		"simpleTrigger": "who is primary?",//required. any of these words will flag this action for consideration
		"doAction": function(from, msg, matches, self){
			if(self.isPrimaryBot){
				return "I am!";
			}
		}//required. can return a string that the bot will use to respond. This happens if the regex evaluates to true
	};
};