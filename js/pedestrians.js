//
// PEDESTRIANS - Simulating social rules
//

var c = document.getElementById("screen");
var ctx = c.getContext("2d");

ctx.lineTo(0,0);
ctx.moveTo(-200,-200);
ctx.stroke();

var walkerImage = new Image();
walkerImage.src = "sprites/pedestrian.png";

//var img = new Image();
//img.src = "sprites/pedestrian.png";
//img.onload = function() {
//	ctx.drawImage(img, 10, 10);	
//};

var range = function(low, high) {
    var thisRange = [];
    for (var i = low; i < high; i++) {
        thisRange.push(i);
    }
    return thisRange;
}

var spriteSize = 16;

var startingY = 340;
var leftLaneX = 160;
var rightLaneX = 177;

var pedestrians = []; //Active pedestrians
var waitingLine = []; //Pedestrians waiting to start


var clearScreen = function() {
    ctx.clearRect(0, 0, 1000, 1000);
}

var getBox = function(x, y, side) {
    var box = [];
    for (var i = x; i < (x + side); i++) {
        for (var j = y; j < (y + side); j++) {
            box.push([i, j]);
        }
    } 
    return box;   
}

var coordsCompare = function(coords1, coords2) {
    return ((coords1[0] === coords2[0]) && (coords1[1] === coords2[1]));
}

var boxCompare = function(box1, box2) {
    for (var i = 0; i < box1.length; i++) {
        for (var j = 0; j < box2.length; j++) {
            if (coordsCompare(box1[i], box2[j])) {
                return true;
            }
        }
    }
    return false;    
}

var boxOverlap = function(x1, y1, x2, y2, side) {
    var box1 = getBox(x1, y1, side);
    var box2 = getBox(x2, y2, side);
    return boxCompare(box1, box2); 
}

var boxContain = function(boxX, boxY, queryX, queryY, side) {
    var box = [];
    for (var i = boxX; i < (boxX + side); i++) {
        for (var j = boxY; j < (boxY + side); j++) {
            box1.push([i, j]);
        }
    }    
    for (var i = 0; i < box.length; i++) {
        if (coordsCompare(box[i], [queryX, queryY])) {
            return true;
        }
    }
    return false;
}

var checkBox = function(box) {
    for (i = 0; i < pedestrians.length; i++) {
        var thisBox = getBox(pedestrians[i].x, pedestrians[i].y, spriteSize);
        if (boxCompare(thisBox, box)) {
            return pedestrians[i].actualSpeed;
        }
    }
    return false;   
}

var checkFront = function(x, y) {
    frontBox = getBox(x, (y - 2), 2);
    return checkBox(frontBox);
}

var openPass = function(x, y) {
    return (!checkBox(x, y) && !(checkBox(x, (y + spriteSize))));
}

var getOppositeX = function(left) {
    if (left === 0) {
        return leftLaneX;
    } else { return rightLaneX; }
}

var Pedestrian = function(x, y, speed) {
	this.left = (x === leftLaneX) ? 1 : 0;
    this.x = x;
	this.y = y;
    this.blocked = 0;
    this.passing = 0;
    this.desiredSpeed = speed;
    this.actualSpeed = speed;
    this.passSpeed = 0;
	this.img = walkerImage;
	this.walk = function() {
		this.y = this.y - this.actualSpeed;
        this.x = this.x - this.passSpeed;
	}
    this.draw = function() {
        ctx.drawImage(this.img, this.x, this.y);
    }
    this.checkZone = function() {
        var newSpeed = checkFront(this.x, this.y);
        if (newSpeed) { 
            this.blocked = 1;
            this.actualSpeed = Math.min(newSpeed, this.actualSpeed); 
        } else { this.blocked = 0; }
    }
    this.pass = function() {
        if (openPass(getOppositeX(this.left), this.y)) {
            this.passSpeed = (this.left === 0) ? this.actualSpeed : (0 - this.actualSpeed);
            this.passing = 1;
            this.walk();
        } else { this.passSpeed = 0; }
    }
    this.endPass = function() {
        if (this.x < leftLaneX) {
            this.passSpeed = 0;
            this.x = leftLaneX;
            this.actualSpeed = this.desiredSpeed;
            this.passing = 0;
            this.left = 1;
        } else if (this.x > rightLaneX) {
            this.passSpeed = 0;
            this.x = rightLaneX;
            this.actualSpeed = this.desiredSpeed; 
            this.passing = 0;
            this.left = 0;  
        }
    }
}

var generatePedestrian = function() {
    var x, y, speed;
    x = ((Math.random() * 2) < 1) ? leftLaneX : rightLaneX;
    y = startingY;
    speed = 0.1 + (Math.random() * 1);   
    if (checkBox(x, startingY)) {
        pedestrians.push(new Pedestrian(x, y, speed));
    }
    else {
        waitingLine.push(new Pedestrian(x, y, speed));
    }
}

var nextInLine = function() {
    if (waitingLine[0] !== undefined) {
        if (!checkBox(waitingLine[0].x, startingY))
            pedestrians.push(waitingLine.shift());
    }
}

var drawLanes = function() {
    ctx.beginPath();
    ctx.moveTo(193,350);
    ctx.lineTo(193,50);
    ctx.stroke();    
    ctx.beginPath();
    ctx.moveTo(160,350);
    ctx.lineTo(160,50);
    ctx.stroke();
}

var rollAgainst = function(target) {
    var roll = Math.random() * 100;
    return (roll < target);
}

var render = function() {
    for (var i = 0; i < pedestrians.length; i++) {
        pedestrians[i].checkZone();
        if (pedestrians[i].blocked === 1) {
            pedestrians[i].pass();
        }
        if (pedestrians[i].passing === 1) {
            pedestrians[i].endPass();
        }
        pedestrians[i].walk();
        pedestrians[i].draw();
    }
    drawLanes();
}

// The main game loop
var lastTime;
function main() {
    var now = Date.now();
    var dt = (now - lastTime) / 1000.0;

   // update(dt);
    render();

    if (rollAgainst(1)) { generatePedestrian(); }
    nextInLine();

    lastTime = now;
    requestAnimationFrame(main);
};

walkerImage.onload = function() {
	main();
}