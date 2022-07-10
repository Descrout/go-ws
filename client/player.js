class PlayerEntity {
    constructor(data) {
        this.data = data;
        this.deleteNextFrame = false;
        this.pos_buffer = [];

        this.last_moving = false;
        this.last_move_angle = 0;

        this.body = new Body(0, 0, 20);
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
    }

    render() {
        stroke(0, 0, 255);
        if (this.data.shooting) fill(0, 255, 0);
        else fill(255, 0, 0);
        strokeWeight(2);
        circle(this.data.x, this.data.y, 40);
        line(this.data.x, this.data.y, this.data.x + cos(this.data.angle) * 20, this.data.y + sin(this.data.angle) * 20);
    }
}