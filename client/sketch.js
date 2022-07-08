const players = new Map();
const keys = new Map(); 

let dx = 0;
let dy = 0;
let sequence = 0;


function setup() {
	canvas = createCanvas(960, 540);
	canvas.elt.addEventListener('contextmenu', event => event.preventDefault());
	scaleMultiplier = scaleToWindow(canvas.elt);
	
	noLoop();

	socket = new Network(address);

	let promise = socket.connect(received);
	if (promise) {
        promise.then(() => {
			loop();
        }).catch((err) => {
            alert("Server is offline !");
        });
    }
}

function draw() {
	let dt = deltaTime / 1000;
	if (dt > 0.033) dt = 0.033;

	update(dt);
	
	// Draw
	background(255);

	for(const player of players.values()) {
		player.render();
	}
}

function update(dt) {
	if(!connectionSuccess) return;

	dx = 0;
	dy = 0;
	if(keys.get(65)) { //left
		dx -= 1;
	}
	if(keys.get(87)) { //up
		dy -= 1;
	}
	if(keys.get(68)) { //right
		dx += 1;
	}
	if(keys.get(83)) { //down
		dy += 1;
	}

	socket.send({
		input_time: dt,
		move_angle: atan2(dy, dx),
		moving: dx != 0 || dy != 0,
		shooting: false,
		look_angle: 0,
		sequence: sequence++,
	});
}

function keyPressed() {
	keys.set(keyCode, true);
}

function keyReleased() {
	keys.delete(keyCode);
}

function received(header, obj) {
	state = obj;
	players.clear();
	for(const player of state.players) {
		players.set(player.id, new PlayerEntity(player));
	}
}

function windowResized() {
	scaleMultiplier = scaleToWindow(canvas.elt);
}