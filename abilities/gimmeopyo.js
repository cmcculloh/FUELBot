module.exports = function(self){
	return {
	"showInHelp": false,
	"actionName": "gimmeopyo",
	"helpText": "used for bots to give each other op",
	"simpleTrigger": "gimmeopyo",/*any of these words will flag this action for consideration*/
	"trigger": /gimmeopyo[\ ]*(\S)*/gi,/*the text must match this exactly (this is a regex) in order for doAction to be triggered*/
	"doAction": function(from, msg, matches, self){
		if(isBot(from) && msg.indexOf(self.opts.password) > -1){
			self.grantOp(from);
		}
	},/*can return a string that the bot will use to respond. This happens if the regex evaluates to true*/
	"responseMethods": {"pm":"pm", "public":"pm"}/*determines how the bot should respond to each message type*/
	};
};