const players = {};

let dx = 0;
let dy = 0;

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
	socket.send({
		input_time: dt,
		move_angle: atan2(dy, dx),
		moving: dx != 0 || dy != 0,
		shooting: false,
		look_angle: 0,
	});
}

function keyPressed() {
	dx = 0;
	dy = 0;
	if(keyCode == 65) { //left
		dx -= 1;
	}
	if(keyCode == 87) { //up
		dy -= 1;
	}
	if(keyCode == 68) { //right
		dx += 1;
	}
	if(keyCode == 83) { //down
		dy += 1;
	}
}

function keyReleased() {
	dx = 0;
	dy = 0;
}

function received(header, obj) {
	state = obj;
	players.clear();
	for(const player of state.players) {
		players[player.id] = new Player(player);
	}
}

function windowResized() {
	scaleMultiplier = scaleToWindow(canvas.elt);
}