class SnowballEntity {
    constructor(data) {
        this.data = data;
        this.deleteNextFrame = false;
        this.pos_buffer = [];

        this.willDelete = false;

        this.r = 15;
    }

    render(isRed) {
        noStroke();
        fill(0);
        circle(this.data.x, this.data.y, this.r);
    }

    interpolate(render_timestamp) {
        const buffer = this.pos_buffer;

        while (buffer.length >= 2 && buffer[1][0] <= render_timestamp) {
            buffer.shift();
        }

        if (buffer.length >= 2 && buffer[0][0] <= render_timestamp && render_timestamp <= buffer[1][0]) {
            const state0 = buffer[0][1];
            const state1 = buffer[1][1];
            const time0 = buffer[0][0];
            const time1 = buffer[1][0];

            const lerp_factor = (render_timestamp - time0) / (time1 - time0);

            //Position lerp
            const dx = state1.x - state0.x;
            const dy = state1.y - state0.y;
            this.data.x = state0.x + dx * lerp_factor;
            this.data.y = state0.y + dy * lerp_factor;
            this.data.angle = atan2(dy, dx);
            this.lastSpeed = sqrt(dx * dx + dy * dy);
        } else {
            const alpha = (Date.now() - render_timestamp) / 100;
            this.data.x += cos(this.data.angle) * this.lastSpeed * alpha;
            this.data.y += sin(this.data.angle) * this.lastSpeed * alpha;

            if (!this.willDelete && this.deleteNextFrame) {
                setTimeout(() => this.delete(), 50);
                this.willDelete = true;
            }
        }
    }

    delete() {
        const key = `${this.data.id}|${this.data.parent_id}`;
        snowballs.delete(key);
    }
}