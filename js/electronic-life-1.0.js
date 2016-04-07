
Object.prototype.toString = function() {
    var str = "[";
    for (var p in this) {
        if (this.hasOwnProperty(p)) {
            str += p + ':' + this[p].name + ', ';
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
    return element.originChar;
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