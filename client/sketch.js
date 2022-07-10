const players = new Map();
const snowballs = new Map();
const keys = new Map();

let accumulator = 0.0;

let dx = 0;
let dy = 0;
let sequence = 0;
let pending_inputs = [];
const server_tick = 33;

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
	if (myID == -1) return;

	let dt = deltaTime / 1000;
	if (dt > 0.033) dt = 0.033;

	//Interpolate
	interpolateEntities(dt);

	const server_dt = server_tick / 1000.0;
	accumulator += dt;
	while (accumulator >= server_dt) {
		accumulator -= server_dt;
		updatePhysics();
	}

	//Send
	send(dt);

	//Draw
	background(255);

	for (const snowball of snowballs.values()) {
		snowball.render();
	}

	for (const player of players.values()) {
		player.render();
	}
}

function interpolateEntities(dt) {
	const now = Date.now();
	const render_timestamp = now - server_tick;

	for (const [id, player] of players.entries()) {
		if (id == myID) continue;
		player.interpolate(render_timestamp);
	}

	for (const snowball of snowballs.values()) {
		snowball.interpolate(render_timestamp);
	}
}

function send(dt) {
	if (myID == -1 || !players.has(myID)) return;

	dx = 0;
	dy = 0;
	if (keys.get(65)) { //left
		dx -= 1;
	}
	if (keys.get(87)) { //up
		dy -= 1;
	}
	if (keys.get(68)) { //right
		dx += 1;
	}
	if (keys.get(83)) { //down
		dy += 1;
	}

	const mdx = mouseX / scaleMultiplier - players.get(myID).data.x;
	const mdy = mouseY / scaleMultiplier - players.get(myID).data.y;

	const input = {
		input_time: dt,
		move_angle: atan2(dy, dx),
		moving: dx != 0 || dy != 0,
		shooting: mouseIsPressed,
		look_angle: atan2(mdy, mdx),
		sequence: sequence++,
	};
	socket.send(input);
	//setTimeout(() => socket.send(input), 100);
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
	const now = Date.now();
	for (const pState of state.players) {
		if (!players.has(pState.id)) {
			players.set(pState.id, new PlayerEntity(pState));
		} else {
			const player = players.get(pState.id);
			player.deleteNextFrame = false;
			if (pState.id == myID) {
				player.data = pState;
				player.body.pos[0] = pState.x;
				player.body.pos[1] = pState.y;
				pending_inputs = pending_inputs.filter(input => {
					return input.sequence > state.my_last_seq;
				});
				pending_inputs.forEach(input => {
					player.applyInput(input);
				});
			} else {
				player.pos_buffer.push([now, pState]);
			}
		}
	}
	for (const [id, player] of players.entries()) {
		if (player.deleteNextFrame) {
			players.delete(id);
		} else {
			player.deleteNextFrame = true;
		}
	}

	////////////////////
	for (const sState of state.snowballs) {
		//if(sState.parent_id != myID) {
		const key = `${sState.id}|${sState.parent_id}`;
		if (!snowballs.has(key)) {
			snowballs.set(key, new SnowballEntity(sState));
		}
		const snowball = snowballs.get(key);
		snowball.deleteNextFrame = false;
		print(sState);
		snowball.pos_buffer.push([now, sState]);
		//}
		//if(sState.parent_id == myID) {
		//const key = `${sState.id}|${sState.parent_id}`;
		// if (!mySnowballs.has(key)) {
		// 	mySnowballs.set(key, new SnowballEntity({
		// 		id: sState.id,
		// 		parent_id: sState.parent_id,
		// 		x: sState.x,
		// 		y: sState.y,
		// 		angle: sState.angle,
		// 	}));
		// }
		//}
	}
	for (const [key, snowball] of snowballs.entries()) {
		if (snowball.deleteNextFrame) {
			snowballs.delete(key);
		} else {
			snowball.deleteNextFrame = true;
		}
	}
}

function windowResized() {
	scaleMultiplier = scaleToWindow(canvas.elt);
}

function updatePhysics() {
	for (const snowball of snowballs.values()) {
		snowball.body.pos[0] = snowball.data.x;
		snowball.body.pos[1] = snowball.data.y;
		snowball.body.update(0.033);
	}
	for (const player of players.values()) {
		for (const other of players.values()) {
			if (player == other) continue;
			if (Physics.circle_circle_collision(player.body, other.body)) {
				Physics.circle_circle_pen_res(player.body, other.body);
				Physics.circle_circle_coll_res(player.body, other.body);
			}
		}
		for (const snowball of snowballs.values()) {
			if (player.id == snowball.parent_id) continue;
			if (Physics.circle_circle_collision(player.body, snowball.body)) {
				Physics.circle_circle_pen_res(player.body, snowball.body);
				Physics.circle_circle_coll_res(player.body, snowball.body);
			}
		}
	}
}