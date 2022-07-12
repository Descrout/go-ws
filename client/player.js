class PlayerEntity {
    constructor(data) {
        this.data = data;
        this.deleteNextFrame = false;
        this.pos_buffer = [];

        this.last_moving = false;
        this.last_move_angle = 0;

        this.body = new Body(data.x, data.y, 22);
    }

    applyInput(input) {
        let speed = 800;
        if (input.shooting) {
            speed = 300;
        }
        if (input.moving) {
            this.body.acc[0] = cos(input.move_angle) * speed;
            this.body.acc[1] = sin(input.move_angle) * speed;
        }
        this.body.update(input.input_time);
        this.data.angle = input.look_angle;
        this.data.shooting = input.shooting;
        this.data.x = this.body.pos[0];
        this.data.y = this.body.pos[1];

        for (const line of lines) {
            if (Physics.circle_line_collision(this.body, line)) {
                Physics.circle_line_pen_res(this.body, line);
                Physics.circle_line_col_res(this.body, line);
            }
        }

        for (const other of players.values()) {
            if (this == other) continue;
            if (Physics.circle_circle_collision(this.body, other.body)) {
                Physics.circle_circle_pen_res(this.body, other.body);
                Physics.circle_circle_coll_res(this.body, other.body);
            }
        }
    }

    render() {
        stroke(0, 0, 255);
        if (this.data.shooting) fill(0, 255, 0);
        else fill(255, 0, 0);
        strokeWeight(2);
        circle(this.data.x, this.data.y, 40);
        line(this.data.x, this.data.y, this.data.x + cos(this.data.angle) * 20, this.data.y + sin(this.data.angle) * 20);
    }

    interpolate(render_timestamp) {
        let buffer = this.pos_buffer;


        while (buffer.length >= 2 && buffer[1][0] <= render_timestamp) {
            buffer.shift();
        }

        if (buffer.length >= 2 && buffer[0][0] <= render_timestamp && render_timestamp <= buffer[1][0]) {
            const state0 = buffer[0][1];
            const state1 = buffer[1][1];
            const t0 = buffer[0][0]; //time0
            const t1 = buffer[1][0]; //time1

            const lerp_factor = (render_timestamp - t0) / (t1 - t0);

            const beforeX = this.data.x;
            const beforeY = this.data.y;

            //Position lerp
            this.data.x = state0.x + (state1.x - state0.x) * lerp_factor;
            this.data.y = state0.y + (state1.y - state0.y) * lerp_factor;

            const dx = beforeX - this.data.x;
            const dy = beforeY - this.data.y;
            this.last_moving = dx != 0 || dy != 0;
            this.last_move_angle = atan2(dy, dx);

            //Rotation lerp
            const max = Math.PI * 2;
            const da = (state1.angle - state0.angle) % max;
            const short = 2 * da % max - da;
            this.data.angle = state0.angle + short * lerp_factor;

            this.data.shooting = state1.shooting;
        } else {
            // let speed = 100;
            // if(this.data.shooting) {
            // 	speed = 50;
            // }
            // if (this.last_moving) {
            // 	this.data.x += cos(this.last_move_angle) * speed * dt;
            // 	this.data.y += sin(this.last_move_angle) * speed * dt;
            // }
        }
    }
}