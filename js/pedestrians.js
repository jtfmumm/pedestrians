//
// PEDESTRIANS - Simulating social rules
//

var c = document.getElementById("screen");
var ctx = c.getContext("2d");

var walkerImage = new Image();
walkerImage.src = "sprites/pedestrian.png";

var range = function(low, high) {
    var thisRange = [];
    for (var i = low; i < high; i++) {
        thisRange.push(i);
    }
    return thisRange;
}

var chooseRand = function(low, high) {
    return Math.floor(Math.random() * (++high - low)) + low;
}

var makeCounter = function() {
    var c = 0;
    return function() {
        return c++;
    }
}

var makeID = makeCounter();

var spriteSize = 16;
var startingY = 340;
var leftLaneX = 160;
var rightLaneX = 177;
var arrivals = 0; //Number of pedestrians having made it to the train

var pedestrians = []; //Active pedestrians
var waitingLine = []; //Pedestrians waiting to start


var clearScreen = function() {
    ctx.clearRect(0, 0, 1000, 1000);
}

var getRect = function(x, y, xSide, ySide) {
    var rect = {pos: {x: x, y: y},
                size: {x: xSide, y: ySide}};
    return rect;   
}

var getBox = function(x, y, side) {
    return getRect(x, y, side, side);
}

var isColliding = function(pedestrianA, pedestrianB) {
    return !(pedestrianA.pos.x + pedestrianA.size.x < pedestrianB.pos.x
             || pedestrianB.pos.x + pedestrianB.size.x < pedestrianA.pos.x
             || pedestrianA.pos.y + pedestrianA.size.y < pedestrianB.pos.y
             || pedestrianB.pos.y + pedestrianB.size.y < pedestrianA.pos.y)
}

var checkBox = function(box, id) {
    for (i = 0; i < pedestrians.length; i++) {
        if (isColliding(box, pedestrians[i])) {
            if (pedestrians[i].id !== id) { return pedestrians[i].actualSpeed; }           
        }
    }
    return false;   
}

var checkFront = function(x, y, id) {
    frontBox = getRect(x, (y - 3), spriteSize, 3);
    return checkBox(frontBox, id);
}

var openPass = function(x, pedestrian) {
    //x is the startingX of the side you're trying to pass to
    var y = pedestrian.pos.y;
    var id = pedestrian.id;
    var opposingBox = getRect(x, y, spriteSize, spriteSize);
    var opposingDownBox = getRect(x, (y - (spriteSize / 2)), spriteSize, spriteSize);
    return (!checkBox(opposingBox, id)); //&& !(checkBox(leftDownBox, id)));
}

var getOppositeX = function(side) {
    if (side === "right") {
        return leftLaneX;
    } else { return rightLaneX; }
}

var Pedestrian = function(x, y, speed, id) {
    this.id = id;
	this.side = (x === leftLaneX) ? "left" : "right";
    this.pos = {x: x, y: y};
	this.size = {x: spriteSize, y: spriteSize};
    this.blocked = 0;
    this.passing = 0;
    this.desiredSpeed = speed;
    this.actualSpeed = speed;
    this.passSpeed = 0; //Passing speed (may not be active)
    this.xSpeed = 0; //Actual speed along x axis
	this.img = walkerImage;
	this.walk = function() {
		this.pos.y = this.pos.y - this.actualSpeed;
        this.pos.x = this.pos.x - this.xSpeed;
	}
    this.draw = function() {
        ctx.drawImage(this.img, this.pos.x, this.pos.y);
    }
    this.checkZone = function() {
        var newSpeed = checkFront(this.pos.x, this.pos.y, this.id);
        if (newSpeed) { 
            this.blocked = 1;
            this.actualSpeed = Math.min(newSpeed, this.actualSpeed); 
        } else if (this.blocked === 1) {
            this.blocked = 0;  
            this.actualSpeed = this.desiredSpeed; 
        }
    }
    this.pass = function() {
        if (this.blocked === 1) {
            if (openPass(getOppositeX(this.side), this)) {
                this.passSpeed = (this.side === "right") ? this.actualSpeed : (0 - this.actualSpeed);
                this.xSpeed = this.passSpeed;
                this.passing = 1;
                this.walk();
            }
        }
    }
    this.endPass = function() {
        if (this.passing === 1) {
            var newSpeed = checkFront(this.pos.x, this.pos.y, this.id);
            if (newSpeed) {
                this.xSpeed = 0;
                this.actualSpeed = newSpeed; 
            }

            if (this.pos.x < leftLaneX) {
                this.passSpeed = 0;
                this.xSpeed = 0;
                this.pos.x = leftLaneX;
                this.actualSpeed = this.desiredSpeed;
                this.passing = 0;
                this.side = "left";
            } else if (this.pos.x > rightLaneX) {
                this.passSpeed = 0;
                this.xSpeed = 0;
                this.pos.x = rightLaneX;
                this.actualSpeed = this.desiredSpeed; 
                this.passing = 0;
                this.side = "right";  
            }            
        }
    }
    this.lookAround = function() {
        if (this.passSpeed === 0) {
            if (this.blocked === 1 && this.passing === 0) {
                this.pass();
            }
        } else if (this.passSpeed > 0) {
            if (checkFront(rightLaneX, this.pos.y, this.id) &&
                !checkFront(leftLaneX, this.pos.y, this.id)) {
                this.passSpeed = 0 - this.passSpeed;
                this.xSpeed = 0 - this.xSpeed;
                this.side = "right";
            }
        } else if (this.passSpeed < 0) {
            if (checkFront(leftLaneX, this.pos.y, this.id) &&
               !checkFront(rightLaneX, this.pos.y, this.id)) {
                this.passSpeed = 0 - this.passSpeed;
                this.xSpeed = 0 - this.xSpeed;
                this.side = "left";
            }
        }
    }
    this.checkArrive = function() {
        if (this.pos.y < -18) { 
            arrivals++; 
            console.log(arrivals + " have made it so far!");
        }
    }
}

var getSpeed = function() {
    speedCategory = chooseRand(1, 7);
    if (speedCategory === 1) {
            return 0.1;
    } else if (speedCategory > 1 && speedCategory < 5) {
            return (0.2 + (Math.random() * 0.2));
    } else {
            return (0.4 + (Math.random() * 0.4));
    }
}

var generatePedestrian = function() {
    var x, y, speed, id;
    x = ((Math.random() * 2) < 1) ? leftLaneX : rightLaneX;
    y = startingY;
    var startingLeftBox = getRect(x, startingY, 0.1);
    var startingRightBox = getRect(x, startingY - 8, 0.1);
    speed = getSpeed();
    id = makeID();
    console.log(id);
    if (!checkBox(startingLeftBox, 0.1)) { //&& (!checkBox(startingRightBox, 0.1))) {
        pedestrians.push(new Pedestrian(x, y, speed, id));
    }
    else {
        waitingLine.push(new Pedestrian(x, y, speed, id));
        console.log("Waiting!");
    }
}

var nextInLine = function() {
    if (waitingLine[0] !== undefined) {
        var waitingLineClose = getRect(waitingLine[0].pos.x, startingY, spriteSize, spriteSize);
        var waitingLineBack = getRect(waitingLine[0].pos.x, startingY - 8, spriteSize, spriteSize);
        if (!checkBox(waitingLineClose, waitingLine[0].id) && !checkBox(waitingLineBack, waitingLine[0].id))
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
        if (pedestrians[i].pos.y > -18) {
            pedestrians[i].checkZone();
            pedestrians[i].pass();
            pedestrians[i].lookAround();                
            pedestrians[i].endPass();
            pedestrians[i].walk();
            pedestrians[i].draw();
            pedestrians[i].checkArrive();
        }
    }
    drawLanes();
}

// The main game loop
var lastTime;
var startTrial = Date.now();
function main() {
    var now = Date.now();
    var dt = (now - lastTime) / 1000.0;

    // update(dt);
    render();

    if (rollAgainst(3)) { generatePedestrian(); }
    nextInLine();

    lastTime = now;
    
    if (arrivals < 100) { 
        requestAnimationFrame(main);
    } else {
        var elapsed = Date.now() - startTrial;
        var minutes = Math.floor(elapsed / 60000);
        var seconds = Math.floor((elapsed - (minutes * 60000)) / 1000);
        console.log("The trial took " + minutes + " minutes and " + seconds + " seconds!");
    }
};

walkerImage.onload = function() {
	main();
}