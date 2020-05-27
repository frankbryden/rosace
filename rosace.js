var canvas = document.getElementById("myCanvas");
var ctx = canvas.getContext('2d');

var radius = 7;
var effectRadius = 150;
var baseOpacity = 0.1;

var arcWaitTime = 10; var introTime = 5;

var spawnTime = 40;
var spawnTimeFixed = 10;
var rosaceRadius = 100;
var rosaces = [];

var singleCurrentDepth = 0;
var singleMaxDepth = 6;

var followTime = 5;
var followTimer = followTime;

var spawnPoints = [];
var currentSpawnPoint = 0;

var currentMode;

var slotColours = {1: 'rgb(160, 160, 160)', 2: 'rgb(64, 188, 80)', 5: 'rgb(17, 50, 196)', 10: 'rgb(168, 29, 214)', 50: 'rgb(214, 211, 47)', 100: 'rgb(205, 89, 247)'};

var States = {
  TRACING : 1,
  DRAWN : 2,
  ERASING : 3,
  DONE : 4,
  ERASE_TIMER : 5
};

var Modes = {
  AUTO : 1,
  FIXED : 2,
  SINGLE : 3,
  FOLLOW : 4
};

canvas.width = window.innerWidth - 10;
canvas.height = window.innerHeight - 10;

function randInt(min, max) {
    let r = Math.floor(Math.random() * (max - min + 1) + min);
    return r;
}

const mouse = {
    x: innerWidth / 2,
    y: innerHeight / 2
};

function getRandColour(){
  return 'rgb(' + randInt(0, 255) + ',' + randInt(0, 255) + ',' + randInt(0, 255) + ')';
}

const colours = ['#e842f4', '#162a99', '#ce1053', '#36a00cx'];

// Event Listeners
addEventListener('mousemove', event => {
    mouse.x = event.clientX;
    mouse.y = event.clientY;
    if (followTimer == -1){
      followTimer = followTime;
    }
});

addEventListener('click', event => {
  if (event.clientX < 60 && event.clientY < 60){
    if (currentMode == Modes.AUTO){
      currentMode = Mode.FIXED;
    } else {
      currentMode = Mode.AUTO;
    }
    console.log("SWITCH");
  } else {
    console.log("New rosace ! ");
    spawnRosace(event.clientX, event.clientY, randInt(rosaceRadius/4, rosaceRadius), randInt(1, 4));
    console.log("We now have " + rosaces.length + "!");
  }
});

addEventListener('resize', function(event){
  canvas.width = window.innerWidth - 10;
  canvas.height = window.innerHeight - 10;
});

function generateSpawnPoints(){
  var rosaceHorizCount = Math.ceil((canvas.width - 2*rosaceRadius)/(rosaceRadius));
  var rosaceVertCount = Math.ceil((canvas.height - 2*rosaceRadius)/(rosaceRadius*2));
  console.log("\nrosaceHorizCount = " + rosaceHorizCount);
  console.log("rosaceVertCount = " + rosaceVertCount);
  console.log("rosaceHorizCount x rosaceVertCount = " + (rosaceHorizCount*rosaceVertCount));
  for (var i = 0; i < rosaceVertCount; i++){
    var row = [];
    for (var j = 0; j < rosaceHorizCount; j++){
      if (j%2 == 0){
        spawnPoints.push({x :rosaceRadius + rosaceRadius*j, y: rosaceRadius + 2*rosaceRadius*i});
      }
    }
  }
}

function getAngle(a){
  var diff = 0.05;
  var angles = {
    "PI/3": Math.PI/3,
    "2 * Pi/3" : 2 * Math.PI/3,
    "2 * Pi" : 2 * Math.PI,
    "7 * Pi/6" : 7 * Math.PI/6,
    "11 * Pi/6" : 11 * Math.PI / 6,
    "Pi/2" : Math.PI/2,
    "Pi": Math.PI,
    "3 * Pi/2" : 3 * Math.PI/2,
    "0" : 0
  };
  for (var ang in angles){
    if (a > angles[ang] - diff && a < angles[ang] + diff){
      return ang;
    }
  }
  return "We don't have that angle (" + a + ")... :/";
}


function ProgressiveArc(x, y, start, end, radius, wait_time){
  this.x = x;
  this.y = y;
  this.startAng = start;
  this.endAng = end;
  this.theta = this.startAng;
  this.radius = radius;
  this.drawSpeed = 0.1;
  this.state = States.TRACING;
  this.wait_timer = wait_time;

  this.update = function(){
    if (this.state == States.TRACING){
      this.theta += this.drawSpeed;
      //this.theta = this.theta % (2*Math.PI);
      if (this.theta >= this.endAng){
        this.state = States.DRAWN;
      }
    } else if (this.state == States.DRAWN){
      
    } else if (this.state == States.ERASE_TIMER){
      this.wait_timer -= 1;
      if (this.wait_timer <= 0){
        this.state = States.ERASING;
      }
    } else if (this.state == States.ERASING){
      this.theta -= this.drawSpeed;
      if (this.theta <= this.startAng){
        this.state = States.DONE;
      }
    }
    
    if (this.state != States.DONE){
      this.draw();
    }
    //this.draw();
  };
  
  this.erase = function(){
    this.state = States.ERASE_TIMER;
  }
  
  this.draw = function(){
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius, this.startAng, this.theta, false);
    ctx.stroke();
  };
}

function Rosace(x, y, radius, depth, colour){
  this.update = function(){
  };
  
  this.updateCount = function(deph){
    this.count = 6 * Math.pow(2, depth);
    this.arcs = [];
    this.step = (2 * Math.PI)/this.count;
    for (var i = 1; i <= this.count; i++){
      var startAng = (i * this.step) % (2*Math.PI);
      if (this.verbose){
        console.log("\nWorking with angle : " + getAngle(startAng) + " (modulo of " + getAngle(2*Math.PI) + ")");
      }
      var x = this.getX(startAng);
      var y = this.getY(startAng);
      var startArc = (startAng + 4*Math.PI/6) % (2*Math.PI);// + (i - 1) * step;
      var endArc = (startArc + 2*Math.PI/3);// % (2*Math.PI);
      if (this.verbose){
        console.log("Drawing arc from " + getAngle(startArc) + " to " + getAngle(endArc));
        console.log("Creating arc with params " + x + ", " +  y + ", " +  startArc + ", " + endArc + ", " + this.radius + "!");
      }
      this.arcs.push(new ProgressiveArc(x, y, startArc, endArc, this.radius, arcWaitTime));
      
    }
    
  };
  
  this.getX = function(ang){
    return this.x + (Math.cos(ang) * this.radius);
  };
  
  this.getY = function(ang){
    return this.y + (Math.sin(ang) * this.radius);
  };
  
  this.draw = function(){
    var startCount = this.arcs.length;
    ctx.save();
    ctx.strokeStyle = this.colour;
    for ( var i = 0; i < this.currentArc + 1; i++ ){
      this.arcs[i].update();
      if (this.arcs[i].state == States.DONE){
        startCount -= 1;
      }
    }
    ctx.restore();
    if (this.currentArc == this.arcs.length - 1 && this.arcs[this.currentArc].state == States.DRAWN){
      if (!this.erasedArcs){
        this.eraseArcs();
      }
    }
    
    if (startCount == 0){
      this.state = States.DONE;
    }
    
    this.introTimer -= 1;
    if (this.introTimer <= 0 && this.currentArc < this.arcs.length - 1){
      this.currentArc += 1;
      this.introTimer = introTime;
    }
    
    /*
    if (this.arcs[this.currentArc].state == States.DRAWN){
      if (this.currentArc < this.arcs.length - 1){
        this.currentArc += 1;
      }
    }*/
    
    
  };
  
  this.eraseArcs = function(){
    for ( var i = 0; i < this.arcs.length; i++ ){
      this.arcs[i].erase();
    }
    this.erasedArcs = true;
  }
  
  this.x = x;
  this.y = y;
  this.radius = radius;
  this.state = States.CALCULATING;
  this.firstArc = null;
  this.verbose = false;
  this.state = States.DRAWING;
  this.currentArc = 0;
  this.updateCount(depth);
  this.erasedArcs = false;
  this.introTimer = introTime;
  this.colour = colour;
  
}

function spawnRosace(x, y, radius, depth){
  //rosaces.push(new Rosace(x, y, rosaceRadius, 2, getRandColour()));
  rosaces.push(new Rosace(x, y, radius, depth, getRandColour()));
}

var circ = new ProgressiveArc(200, 200, 0, 1.8*Math.PI, 80);
//var ros = new Rosace(850, 400, 100);
function init(){
  generateSpawnPoints();
}

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

var count = 0;
var spawnTimer = spawnTime;
var currentMode = Modes.SINGLE;

function animate(){
  //console.log(spawnPoints);
  //count++;
  if (count < 5){
    requestAnimationFrame(animate);
  }
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  var removeIndices = [];
  for (var i = 0; i < rosaces.length; i++){
    rosaces[i].draw();
    //console.log(rosaces[i].state)
    if (rosaces[i].state == States.DONE){
      removeIndices.push(i);
    }
  }
  for (var i = 0; i < removeIndices.length; i++){
    rosaces.splice(removeIndices[i], 1);
  }
  if (currentMode == Modes.AUTO){
    spawnTimer--;
    if (spawnTimer <= 0){
      spawnRosace(randInt(rosaceRadius/2, canvas.width - rosaceRadius/2), randInt(rosaceRadius/2, canvas.height - rosaceRadius/2), randInt(rosaceRadius/4, rosaceRadius), randInt(1, 4));
      spawnTimer = spawnTime;
    }
  } else if (currentMode == Modes.FIXED){
    spawnTimer--;
    if (spawnTimer <= 0){
      var spawnPoint = spawnPoints[currentSpawnPoint];
      spawnRosace(spawnPoint.x, spawnPoint.y, rosaceRadius, 0);
      currentSpawnPoint++;
      if (currentSpawnPoint >= spawnPoints.length){
        currentSpawnPoint = 0;
      }
      spawnTimer = spawnTimeFixed;
    }
  } else if (currentMode == Modes.SINGLE){
    if (rosaces.length > 1){
      rosaces  = [];
    }
    if (rosaces.length == 0){
      spawnRosace(canvas.width/2, canvas.height/2, canvas.height/2, singleCurrentDepth);
      singleCurrentDepth++;
      if (singleCurrentDepth >= singleMaxDepth){
        singleCurrentDepth = 0;
      }
    }
  } else if (currentMode == Modes.FOLLOW){
    if (followTimer != -1){
      followTimer--;
      
    }
    if (followTimer == 0){
      followTimer = -1;
      spawnRosace(mouse.x, mouse.y, rosaceRadius, 1);
    }
  }
  
  
}

init();
animate();

console.log("Angle is " + getAngle(Math.PI/2));
