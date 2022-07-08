class PlayerEntity {
    constructor(data) {
        this.data = data;
        this.deleteNextFrame = false;
        this.pos_buffer = [];
    }

    applyInput(input) {
        let speed = 150;
        if(input.shooting) {
            speed = 50;
        }
        if (input.moving) {
			this.data.x += cos(input.move_angle) * speed * input.input_time
			this.data.y += sin(input.move_angle) * speed * input.input_time
		}
        this.data.angle = input.look_angle;
        this.data.shooting = input.shooting;
    }

    render() {
        stroke(0,0,255);
        if(this.data.shooting) fill(0,255,0);
        else fill(255, 0, 0);
        strokeWeight(2);
        circle(this.data.x, this.data.y, 40);
        line(this.data.x, this.data.y, this.data.x + cos(this.data.angle) * 20, this.data.y + sin(this.data.angle) * 20);
    }
}