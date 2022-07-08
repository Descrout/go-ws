const players = new Map();
const snowballs = new Map();
const keys = new Map(); 

let dx = 0;
let dy = 0;
let sequence = 0;
let pending_inputs = [];
const server_tick = 50;

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
	if(myID == -1) return;

	let dt = deltaTime / 1000;
	if (dt > 0.033) dt = 0.033;

	interpolateEntities();
	
	// SEND
	send(dt);
	
	// Draw
	background(255);

	for(const player of players.values()) {
		player.render();
	}

	for(const snowball of snowballs.values()) {
		snowball.render();
	}
}

function interpolateEntities() {
	const now = Date.now();
	const render_timestamp = now - server_tick;

	for (const [id, player] of players.entries()) {
		if (id == myID) continue;

		let buffer = player.pos_buffer;


		while (buffer.length >= 2 && buffer[1][0] <= render_timestamp) {
			buffer.shift();
		}

		if (buffer.length >= 2 && buffer[0][0] <= render_timestamp && render_timestamp <= buffer[1][0]) {
			const state0 = buffer[0][1];
			const state1 = buffer[1][1];
			const t0 = buffer[0][0]; //time0
			const t1 = buffer[1][0]; //time1

			const lerp_factor = (render_timestamp - t0) / (t1 - t0);

			//Position lerp
			player.data.x = state0.x + (state1.x - state0.x) * lerp_factor;
			player.data.y = state0.y + (state1.y - state0.y) * lerp_factor;

			//Rotation lerp
			const max = Math.PI * 2;
			const da = (state1.angle - state0.angle) % max;
			const short = 2 * da % max - da;
			player.data.angle = state0.angle + short * lerp_factor;

			player.data.shooting = buffer[1][1].shooting;
		}
	}

	//////
	for (const [key, snowball] of snowballs.entries()) {
		let buffer = snowball.pos_buffer;


		while (buffer.length >= 2 && buffer[1][0] <= render_timestamp) {
			buffer.shift();
		}

		if (buffer.length >= 2 && buffer[0][0] <= render_timestamp && render_timestamp <= buffer[1][0]) {
			const state0 = buffer[0][1];
			const state1 = buffer[1][1];
			const t0 = buffer[0][0]; //time0
			const t1 = buffer[1][0]; //time1

			const lerp_factor = (render_timestamp - t0) / (t1 - t0);

			//Position lerp
			snowball.data.x = state0.x + (state1.x - state0.x) * lerp_factor;
			snowball.data.y = state0.y + (state1.y - state0.y) * lerp_factor;
		}
	}
}

function send(dt) {
	if(myID == -1 || !players.has(myID)) return;

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

	const mdx = mouseX /scaleMultiplier - players.get(myID).data.x;
	const mdy = mouseY /scaleMultiplier - players.get(myID).data.y;

	const input = {
		input_time: dt,
		move_angle: atan2(dy, dx),
		moving: dx != 0 || dy != 0,
		shooting: mouseIsPressed,
		look_angle: atan2(mdy, mdx),
		sequence: sequence++,
	};
	socket.send(input);
	players.get(myID).applyInput(input);
	pending_inputs.push(input);
}

function keyPressed() {
	keys.set(keyCode, true);
}

function keyReleased() {
	keys.delete(keyCode);
}

function received(header, obj) {
	state = obj;
	for(const pState of state.players) {
		if(!players.has(pState.id)) {
			players.set(pState.id, new PlayerEntity(pState));
		}else {
			const player = players.get(pState.id);
			player.deleteNextFrame = false;
			if(pState.id == myID) {
				player.data = pState;
				pending_inputs = pending_inputs.filter(input => {
                    return input.sequence > state.my_last_seq;
                });
                pending_inputs.forEach(input => {
                    player.applyInput(input);
                });
			}else {
				player.pos_buffer.push([Date.now(), pState]);
			}
		}
	}
	for(const [id,player] of players.entries()) {
		if(player.deleteNextFrame) {
			players.delete(id);
		}else {
			player.deleteNextFrame = true;
		}
	}

	////////////////////
	for(const sState of state.snowballs) {
		const key = `${sState.id}|${sState.parent_id}`;
		if(!snowballs.has(key)) {
			snowballs.set(key, new SnowballEntity(sState));
		}else {
			const snowball = snowballs.get(key);
			snowball.deleteNextFrame = false;
			snowball.pos_buffer.push([Date.now(), sState]);
		}
	}
	for(const [key,snowball] of snowballs.entries()) {
		if(snowball.deleteNextFrame) {
			snowballs.delete(key);
		}else {
			snowball.deleteNextFrame = true;
		}
	}
}

function windowResized() {
	scaleMultiplier = scaleToWindow(canvas.elt);
}