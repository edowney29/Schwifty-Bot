const PI_FLOAT = 3.14159265
const PIBY2_FLOAT = 1.5707963

module.exports.checkMove = checkMove
module.exports.getDistance = getDistance
module.exports.getRadian = getRadian
module.exports.atan2_approximation2 = atan2_approximation2
module.exports.getRandomRange = getRandomRange

function getDistance(x1, y1, x2, y2) {
	var distance = 0.0
	distance = Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2))
	return distance
}

function getRadian(x1, y1, x2, y2) {
	var radian = 0.0
	radian = Math.atan2(y2 - y1, x2 - x1)
	//radian = atan2_approximation2(x2 - x1, y2 - y1)
	return radian
}


function checkMove(enemy, radian) {
	var moveX = Math.cos(radian) * 100 //(Math.random(100 - 50) + 50)
	var moveY = Math.sin(radian) * 100 //(Math.random(100 - 50) + 50)
	enemy.positionX += moveX
	enemy.positionY += moveY
	return enemy
}

// |error| < 0.005
function atan2_approximation2(x, y) {
	if (x == 0.0) {
		if (y > 0.0) return PIBY2_FLOAT
		if (y == 0.0) return 0.0
		return -PIBY2_FLOAT
	}
	var atan
	var z = y / x;
	if (Math.abs(z) < 1.0) {
		atan = z / (1.0 + 0.28 * z * z)
		if (x < 0.0) {
			if (y < 0.0) return atan - PI_FLOAT
			return atan + PI_FLOAT
		}
	}
	else {
		atan = PIBY2_FLOAT - z / (z * z + 0.28)
		if (y < 0.0) return atan - PI_FLOAT
	}
	return atan
}

// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Math/random
function getRandomRange(number) {
	var min = number - 100
	var max = number + 100
	min = Math.ceil(min);
	max = Math.floor(max);
	return Math.floor(Math.random() * (max - min + 1)) + min; //The maximum is inclusive and the minimum is inclusive 
}

/*
// End of move area (bounce back)
// Needs to be changed to have zones and worlds	
if (enemy.positionX < 1245) {
	enemy.positionX = 1245
	enemy.target = ''
	checkMove(enemy, radian + Math.PI / 2)
}
else if (enemy.positionX > 1602) {
	enemy.positionX = 1602
	enemy.target = ''
	checkMove(enemy, radian + Math.PI / 2)
}
else if (enemy.positionY > -1309) {
	enemy.positionY = -1309
	enemy.target = ''
	checkMove(enemy, radian + Math.PI / 2)
}
else if (enemy.positionY < -1568) {
	enemy.positionY = -1568
	enemy.target = ''
	checkMove(enemy, radian + Math.PI / 2)
}
*/	