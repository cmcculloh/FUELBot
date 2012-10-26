module.exports = function(self){
	return {
	"actionName": "giveop",
	"helpText": "Just say 'giveop' followed by the password to be made op",
	"simpleTrigger": "giveop",
	"trigger": /giveop ?(\S)*/i,/*the text must match this exactly (this is a regex) in order for doAction to be triggered*/
	"doAction": function(from, msg, matches, self){
		if(msg.indexOf(self.opts.password) > -1){
			self.grantOp(from);
			return self.randomAdminQuote(to);
		}else{
			return "uh uh uh! You didn't say the magic word!";
		}
	},/*can return a string that the bot will use to respond. This happens if the regex evaluates to true*/
	"responseMethods": {"pm":"public", "public":"public"}/*determines how the bot should respond to each message type*/
	};
};