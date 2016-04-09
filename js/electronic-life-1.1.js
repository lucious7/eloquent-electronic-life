/**
 * Version 1.0
 */

Object.prototype.toString = function() {
    var str = "[";
    for (var p in this) {
        if (this.hasOwnProperty(p)) {
            str += '('+ p + ')' + this[p].name + ', ';
        }
    }
    return str.slice(0,-2) + "]";
}

/**
 * 
 */
function Vector(x, y) {
    this.x = x;
    this.y = y;
}
Vector.prototype.plus = function(other) {
    return new Vector(this.x + other.x, this.y + other.y);
};
/** 
 * 
*/
function Grid(width, height) {
    this.space = new Array(width);
    for (var x = 0; x < this.space.length; x++) {
        this.space[x] = new Array(height);
    }
    this.width = width;
    this.height = height;
}
Grid.prototype.isInside = function(vector) {
    return vector.x >= 0 && vector.x <= this.width &&
        vector.y >= 0 && vector.y <= this.height;
};
Grid.prototype.get = function(vector) {
    return this.space[vector.x][vector.y];
};
Grid.prototype.set = function(vector, value) {
    this.space[vector.x][vector.y] = value;
};
Grid.prototype.forEach = function(f, context) {
    for (var x = 0; x < this.width; x++) {
        for (var y = 0; y < this.height; y++) {
            var value = this.space[x][y];
            if (value !== null)
                f.call(context, value, new Vector(x, y));
        }
    }
};
/** 
 * 
*/
var directions = {
    "n": new Vector(0, -1),
    "ne": new Vector(1, -1),
    "e": new Vector(1, 0),
    "se": new Vector(1, 1),
    "s": new Vector(0, 1),
    "sw": new Vector(-1, 1),
    "w": new Vector(-1, 0),
    "nw": new Vector(-1, -1)
};
/** */
function randomElement(array) {
    return array[Math.floor(Math.random() * array.length)];
}
function BouncingCritter() {
    let directionNames = "n ne e se s sw w nw".split(" ");
    this.direction = randomElement(directionNames);
}
BouncingCritter.prototype.act = function(view) {
    if (view.look(this.direction) != " ") {
        this.direction = view.find(" ") || "s";
    }
    return { type: "move", direction: this.direction };
};
/** 
 * 
*/
function elementFromChar(legend, ch) {
    if (ch == " ") return null;
    let element = new legend[ch]();
    element.originChar = ch;
    return element;
}
function World(map, legend) {
    this.grid = new Grid(map[0].length, map.length);
    this.legend = legend;
    this.turnNumber = 0;

    map.forEach(function(line, y) {
        for (let x = 0; x < line.length; x++) {
            this.grid.set(new Vector(x, y), elementFromChar(legend, line[x]));
        }
    }, this);
}
function charFromElement(element) {
    if (element == null) return " ";
    return element.getChar();
}
World.prototype.turn = function() {
    this.turnNumber++;
    var acted = [];
    this.grid.forEach(function(critter, vector) {
        if (critter.act && acted.indexOf(critter) == -1) {
            acted.push(critter);
            this.letAct(critter, vector);
        }
    }, this);
};
World.prototype.letAct = function(critter, vector) {
    var action = critter.act(new View(this, vector));
    if (action && action.type == "move") {
        var dest = this.checkDestination(action, vector);
        if (dest && this.grid.get(dest) == null) {
            this.grid.set(vector, null);
            this.grid.set(dest, critter);
        }
    }
};
World.prototype.checkDestination = function(action, vector) {
    if (directions.hasOwnProperty(action.direction)) {
        var dest = vector.plus(directions[action.direction]);
        if (this.grid.isInside(dest))
            return dest;
    }
};
World.prototype.toString = function() {
    let output = "Turno:" + this.turnNumber + "\n";
    for (let y = 0; y < this.grid.height; y++) {
        for (let x = 0; x < this.grid.width; x++) {
            let element = this.grid.get(new Vector(x, y));
            output += charFromElement(element);
        }
        output += "\n";
    }
    output += this.legend.toString();
    return output;
};
/**
 * 
 */
function View(world, vector) {
    this.world = world;
    this.vector = vector;
}
View.prototype.look = function(dir) {
    var target = this.vector.plus(directions[dir]);
    if (this.world.grid.isInside(target)) {
        return charFromElement(this.world.grid.get(target));
    } else return "#";
};
View.prototype.findAll = function(ch) {
    var found = [];
    for (var dir in directions) {
        if (this.look(dir) == ch) {
            found.push(dir);
        }
    }
    return found;
};
View.prototype.find = function(ch) {
    var found = this.findAll(ch);
    if (found.length == 0) return null;
    return randomElement(found);
};
/** 
 * 
*/
function Wall() { }
Wall.prototype.getChar = function (){
    return "#";
};
/**
 * Version 1.1
 */
var actionTypes = Object.create(null);

actionTypes.grow = function (critter){
    critter.energy += 0.5;
    return true;
};

actionTypes.move = function (critter, vector, action){
    var dest = this.checkDestination(action, vector);
    if(dest == null || critter.energy <= 1 || this.grid.get(dest) != null) return false;
    critter.energy -= 1;
    this.grid.set(vector, null);
    this.grid.set(dest, critter);
    return true;
};

actionTypes.eat = function (critter, vector, action){
    var dest = this.checkDestination(action, vector);
    var atDest = dest != null && this.grid.get(dest);
    if(!atDest || atDest.energy == null) return false;
    critter.energy += atDest.energy;
    this.grid.set(dest, null);
    return true;
};

actionTypes.reproduce = function (critter, vector, action){
    var baby = elementFromChar(this.legend, critter.originChar);
    var dest = this.checkDestination(action, vector);
    if(dest == null || critter.energy <= 2 * baby.energy 
            || this.grid.get(dest) != null) return false;
    critter.energy -= 2 * baby.energy;
    this.grid.set(dest, baby);
    return true;
};
/**
 * 
 */
function WildWorld(map, legend){
    World.call(this, map, legend);
}

WildWorld.prototype = Object.create(World.prototype);

WildWorld.prototype.letAct = function (critter, vector) {
    var action = critter.act(new View(this, vector));
    var handled = action && action.type in actionTypes && 
        actionTypes[action.type].call(this, critter, vector, action);
    if(!handled){
        critter.energy -= 0.2;
        if(critter.energy <= 0)
            this.grid.set(vector, null);
    }
};
/**
 * 
 */
function Plant(){
    this.energy = 3 + Math.random() * 4;
    this.legend = ". ! * %".split(" ");
}

Plant.prototype.act = function (view){
    if(this.energy > 15){
        var space = view.find(" ");
        if(space) return {type: "reproduce", direction: space};
    }
    if(this.energy < 20) return {type: "grow"};
};
Plant.prototype.getChar = function () {
    var energy = Math.min(Math.floor(this.energy/5), 3);

    return this.legend[energy];
};

/**
 * 
 */
function PlantEater(){
    this.energy = 20;
    this.legend = "o O 0 Ω".split(" ");
}

PlantEater.prototype.act = function (view){
    var space = view.find(" ");
    if(this.energy > 60 && space) return {type: "reproduce", direction: space};
    var plant = view.find(".");
    if(plant) return {type: "eat", direction: plant};
    if(space) return {type: "move", direction: space};
};
PlantEater.prototype.getChar = function (){
    var energy = Math.min(Math.floor(this.energy/20), 3);

    return this.legend[energy];
};