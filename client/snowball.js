class SnowballEntity {
    constructor(data) {
        this.data = data;
        this.deleteNextFrame = false;
        this.pos_buffer = [];
    }

    render(isMy) {
        noStroke();
        if(isMy) fill(255,0,0);
        else fill(0);
        circle(this.data.x, this.data.y, 8);
    }

    move(dt) {
        this.data.x += cos(this.data.angle) * 600.0 * dt;
        this.data.y += sin(this.data.angle) * 600.0 * dt;

        // if(snowballs.has(key)) {
        //     strokeWeight(2);
        //     stroke(255,255,0);
        //     line(this.data.x, this.data.y, snowballs.get(key).data.x, snowballs.get(key).data.y);
        // }

        if (this.data.x > 980 || this.data.x < -10 || this.data.y < -10 || this.data.y > 560) {
            mySnowballs.delete(key);
        }
    }
}