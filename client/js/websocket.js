class Network {
    constructor(server) {
        if (!("WebSocket" in window)) {
            alert("WebSocket NOT supported by your Browser!");
            return;
        }
        this.server = server;
    }

    connect(cb) {
        if (this.ws) return;
        this.ws = new WebSocket(this.server);
        this.ws.binaryType = 'arraybuffer';
        this.ws.onmessage = (e) => {
            const data = new Uint8Array(e.data);
            const obj = Parser.deSerialize(data);
            if (obj) {
                if (data[0] == 0) {
                    myID = obj.my_id;
                    lines = obj.lines.map(l => new Line(l.x1, l.y1, l.x2, l.y2));
                } else {
                    cb(data[0], obj);
                }
            }
        }

        let promise = new Promise((resolve, reject) => {
            this.ws.onopen = () => {
                this.connected();
                resolve("Connected!");
            };

            this.ws.onclose = () => {
                this.disconnected();
                this.ws = null;
                reject("Offline!");
            };
        });

        return promise;
    }

    send(obj) {
        this.ws.send(Parser.serialize(obj));
    }

    connected() {
        console.log("Connection successful :)");
    }

    disconnected() {
        console.log("Websocket disconnected !");
        myID = -1;
    }

    close() {
        this.ws.close();
        myID = -1;
    }
}