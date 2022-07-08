class SnowballEntity {
    constructor(data) {
        this.data = data;
        this.deleteNextFrame = false;
        this.pos_buffer = [];
    }

    render() {
        noStroke();
        fill(0);
        circle(this.data.x, this.data.y, 8);
    }
}