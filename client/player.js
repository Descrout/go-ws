class PlayerEntity {
    constructor(data) {
        this.data = data;
        this.deleteNextFrame = false;
        this.pos_buffer = [];
    }

    applyInput(input) {
        if (input.moving) {
			this.data.x += cos(input.move_angle) * 100 * input.input_time
			this.data.y += sin(input.move_angle) * 100 * input.input_time
		}
        this.data.angle = input.look_angle;
    }

    render() {
        stroke(0,0,255);
        fill(255, 0, 0);
        strokeWeight(2);
        circle(this.data.x, this.data.y, 40);
        line(this.data.x, this.data.y, this.data.x + cos(this.data.angle) * 20, this.data.y + sin(this.data.angle) * 20);
    }
}