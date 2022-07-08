class PlayerEntity {
    constructor(data) {
        this.data = data;
    }

    render() {
        stroke(0,0,255);
        fill(255, 0, 0);
        strokeWeight(2);
        circle(this.data.x, this.data.y, 40);
        line(this.data.x, this.data.y, this.data.x + cos(this.data.angle) * 20, this.data.y + sin(this.data.angle) * 20);
    }
}