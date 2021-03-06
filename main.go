package main

import (
	"log"
	"net/http"
	"time"

	"github.com/gorilla/websocket"
)

const (
	// Time allowed to write a message to the peer.
	writeWait = 10 * time.Second

	// Time allowed to read the next pong message from the peer.
	pongWait = 60 * time.Second

	// Send pings to peer with this period. Must be less than pongWait.
	pingPeriod = (pongWait * 9) / 10

	// Maximum message size allowed from peer.
	maxMessageSize = 512
)

var upgrader = websocket.Upgrader{
	ReadBufferSize:  1024,
	WriteBufferSize: 1024,
}

func main() {
	game := newGame()
	go game.run()

	fs := http.FileServer(http.Dir("./client"))
	http.Handle("/", http.StripPrefix("/", fs))
	http.HandleFunc("/ws", func(w http.ResponseWriter, r *http.Request) {
		serveWs(game, w, r)
	})
	err := http.ListenAndServe(":6464", nil)
	if err != nil {
		log.Fatal("ListenAndServe: ", err)
	}
}
