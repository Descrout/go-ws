class Player{
    constructor(data) {
        this.data = data;
    }

    render() {
        stroke(0,0,255);
        fill(255, 0, 0);
        circle(this.data.x, this.data.y, 20);
        line(this.data.x, this.data.y, cos(this.data.angle) * 20, sin(this.data.angle) * 20);
    }
}