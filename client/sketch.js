function setup() {
	canvas = createCanvas(960, 540);
	canvas.elt.addEventListener('contextmenu', event => event.preventDefault());
	scaleMultiplier = scaleToWindow(canvas.elt);

	mouse = {x: 0, y: 0};
	
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
	// if(touches.length) {
	// 	mouse.x = touches[0].x / scaleMultiplier;
	// 	mouse.y = touches[0].y / scaleMultiplier;
	// 	mouseIsPressed = true;
	// }else {
	// 	mouse.x = mouseX / scaleMultiplier;
	// 	mouse.y = mouseY / scaleMultiplier;
	// }
	
	update(dt);
	
	// Draw
	background(255);
	if(!state) return;
	for(const player of state.players) {
		circle(player.x, player.y, 10);
	}
}

function update(dt) {
	if(!connectionSuccess) return;
	socket.send({
		move: 1,
		look: 0,
		moving: true,
		shooting: false
	});
}

function received(header, obj) {
	state = obj;
}

function windowResized() {
	scaleMultiplier = scaleToWindow(canvas.elt);
}