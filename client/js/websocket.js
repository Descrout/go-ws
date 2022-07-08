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
            let data = new Uint8Array(e.data);
            if(data[0] == 0) {
                myID = data[1];
            }else {
                let obj = Parser.deSerialize(data);
                if (obj) cb(data[0], obj);
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