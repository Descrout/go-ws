class SnowballEntity {
    constructor(data) {
        this.data = data;
        this.deleteNextFrame = false;
        this.pos_buffer = [];

        this.body = new Body(data.y, data.y, 15, 0.8);
        this.body.apply_force(cos(data.angle) * 15000.0, sin(data.angle) * 15000.0);
        this.body.friction = 0.95;
    }

    render() {
        noStroke();
        fill(0);
        circle(this.data.x, this.data.y, this.body.r);
    }

    // move(dt) {
    //     this.body.pos[0] = this.data.x;
    //     this.body.pos[1] = this.data.y;

    //     this.body.update(dt);

    //     this.data.x = this.body.pos[0];
    //     this.data.y = this.body.pos[1];
    // }

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

            //Position lerp
            this.data.x = state0.x + (state1.x - state0.x) * lerp_factor;
            this.data.y = state0.y + (state1.y - state0.y) * lerp_factor;
            this.data.angle = state1.angle;
        } else {
            //this.data.x = this.body.pos[0];
            //this.data.y = this.body.pos[1];
            //this.move(dt);
        }
    }
}