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
    var box = [];
    for (var i = x; i < (x + xSide); i++) {
        box.push([i, (y + 1)]);
        box.push([i, (y + ySide - 1)]);
    }     
    for (var i = y; i < (y + ySide); i++) {
        box.push([x, i]);
        box.push([x + ySide, i]);
    } 
    return box;   
}

var getBox = function(x, y, side) {
    return getRect(x, y, side, side);
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

var checkBox = function(box, id) {
    for (i = 0; i < pedestrians.length; i++) {
        var x, y, thisBox;
        x = Math.floor(pedestrians[i].x);
        y = Math.floor(pedestrians[i].y);
        thisBox = getBox(x, y, spriteSize);
        if (boxCompare(thisBox, box)) {
            if (pedestrians[i].id !== id) { return pedestrians[i].actualSpeed; }           
        }
    }
    return false;   
}

var checkFront = function(x, y, id) {
    frontBox = getRect(x, (y - 3), spriteSize, 3);
    return checkBox(frontBox, id);
}

var openPass = function(x, y, id) {
    return (!checkBox(x, y, id) && !(checkBox(x, (y - spriteSize), id)));
}

var getOppositeX = function(side) {
    if (side === "right") {
        return leftLaneX;
    } else { return rightLaneX; }
}

var Pedestrian = function(x, y, speed, id) {
    this.id = id;
	this.side = (x === leftLaneX) ? "left" : "right";
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
        var checkX, checkY, newSpeed;
        checkX = Math.floor(this.x);
        checkY = Math.floor(this.y);
        newSpeed = checkFront(checkX, checkY, this.id);
        if (newSpeed) { 
            this.blocked = 1;
            this.actualSpeed = Math.min(newSpeed, this.actualSpeed); 
        } else { this.blocked = 0; }
    }
    this.pass = function() {
        if (openPass(getOppositeX(this.side), this.y, this.id)) {
            this.passSpeed = (this.side === "right") ? this.actualSpeed : (0 - this.actualSpeed);
            this.passing = 1;
            this.walk();
        } else { this.passSpeed = 0; }
    }
    this.endPass = function() {
        var checkX, checkY, newSpeed;
        checkX = Math.floor(this.x);
        checkY = Math.floor(this.y);
        newSpeed = checkFront(checkX, checkY, this.id);
        if (newSpeed) {
            this.passSpeed = 0;
            this.actualSpeed = newSpeed; 
        }
        if (this.x < leftLaneX) {
            this.passSpeed = 0;
            this.x = leftLaneX;
            this.actualSpeed = this.desiredSpeed;
            this.passing = 0;
            this.side = "left";
        } else if (this.x > rightLaneX) {
            this.passSpeed = 0;
            this.x = rightLaneX;
            this.actualSpeed = this.desiredSpeed; 
            this.passing = 0;
            this.side = "right";  
        }
    }
    this.checkArrive = function() {
        if (this.y < -18) { arrivals++; }
    }
}

var generatePedestrian = function() {
    var x, y, speed, id;
    x = ((Math.random() * 2) < 1) ? leftLaneX : rightLaneX;
    y = startingY;
    speed = 0.1 + (Math.random() * 1);   
    id = makeID();
    console.log(id);
    if (!checkBox(x, startingY, 0.1) && (!checkBox(x, startingY - 8, 0.1))) {
        pedestrians.push(new Pedestrian(x, y, speed, id));
    }
    else {
        waitingLine.push(new Pedestrian(x, y, speed, id));
        console.log("Waiting!");
    }
}

var nextInLine = function() {
    if (waitingLine[0] !== undefined) {
        if (!checkBox(waitingLine[0].x, startingY, waitingLine[0].id) && !checkBox(waitingLine[0].x, startingY - 8, waitingLine[0].id))
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
        if (pedestrians[i].y > -18) {
            pedestrians[i].checkZone();
            // if (pedestrians[i].blocked === 1) {
            //     pedestrians[i].pass();
            // }
            // if (pedestrians[i].passing === 1) {
            //     pedestrians[i].endPass();
            // }
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

    if (rollAgainst(2)) { generatePedestrian(); }
    nextInLine();

    lastTime = now;
    
    if (arrivals < 100) { 
        requestAnimationFrame(main);
    } else {
        var elapsed = Date.now() - startTrial;
        var minutes = Math.floor(elapsed / 60000);
        var seconds = Math.floor(elapsed / 1000) - (minutes * 60000);
        console.log("The trial took " + minutes + " minutes and " + seconds + " seconds!");
    }
};

walkerImage.onload = function() {
	main();
}