module.exports = function(dieRoll, nick){
	if(dieRoll[1] > 30){dieRoll[1] = 30;}
	if(dieRoll[2] > 200){dieRoll[2] = 200;}

	dieRoll[3] = 0;
	for(var i = 1; i <= dieRoll[1]; i++){
		dieRoll[3] += Math.ceil(Math.random()*dieRoll[2]);
	}

	return dieRoll;
};