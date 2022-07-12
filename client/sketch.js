const players = new Map();
const snowballs = new Map();
const keys = new Map();

let accumulator = 0.0;

let dx = 0;
let dy = 0;
let sequence = 0;
let pending_inputs = [];
const server_tick = 45;

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

	const server_dt = server_tick / 1000.0;
	accumulator += dt;
	while (accumulator >= server_dt) {
		accumulator -= server_dt;
		updatePhysics();
	}

	//Interpolate
	interpolateEntities(dt);

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

	for (const li of lines) {
		stroke(200, 100, 50);
		line(li.start[0], li.start[1], li.end[0], li.end[1]);
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
			player.body.pos[0] = pState.x;
			player.body.pos[1] = pState.y;
			if (pState.id == myID) {
				player.data = pState;
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
	for (const snowball of snowballs.values()) {
		snowball.deleteNextFrame = true;
	}

	for (const sState of state.snowballs) {
		const key = `${sState.id}|${sState.parent_id}`;
		if (!snowballs.has(key)) {
			snowballs.set(key, new SnowballEntity(sState));
		}
		const snowball = snowballs.get(key);
		snowball.deleteNextFrame = false;
		snowball.pos_buffer.push([now, sState]);
	}
}

function windowResized() {
	scaleMultiplier = scaleToWindow(canvas.elt);
}

function updatePhysics() {
	for (const player of players.values()) {
		for (const other of players.values()) {
			if (player == other) continue;
			if (Physics.circle_circle_collision(player.body, other.body)) {
				Physics.circle_circle_pen_res(player.body, other.body);
				Physics.circle_circle_coll_res(player.body, other.body);
			}
		}
	}

	for (const player of players.values()) {
		for (const line of lines) {
			if (Physics.circle_line_collision(player.body, line)) {
				Physics.circle_line_pen_res(player.body, line);
				Physics.circle_line_col_res(player.body, line);
				player.data.x = player.body.pos[0];
				player.data.y = player.body.pos[1];
			}
		}
	}
}