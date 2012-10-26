module.exports = function(self){
	return {
	"showInHelp": false,//whether to show this action to users when they type help
	"actionName": "feeling",//name in the help list
	"helpText": "More or less just let's you find out if the bot can hear you",
	"simpleTrigger": "feeling?",/*any of these words will flag this action for consideration*/
	"trigger": /how\ are\ you\ feeling\?/gi,/*the text must match this exactly (this is a regex) in order for doAction to be triggered*/
	"doAction": function(from, msg, matches){return "fine, " + from + ", thanks!";},/*can return a string that the bot will use to respond. This happens if the regex evaluates to true*/
	"responseMethods": {"pm":"pm", "public":"public"}/*determines how the bot should respond to each message type*/
	};
};