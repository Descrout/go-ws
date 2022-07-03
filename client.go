package main

import (
	"log"
	"math"
	"net/http"
	"time"

	"github.com/gorilla/websocket"
	"google.golang.org/protobuf/proto"
)

type Client struct {
	game *Game
	conn *websocket.Conn
	send chan []byte

	player *Player
	dx     float32
	dy     float32
}

func (c *Client) applyInput(input *GameInput) {
	if input.Moving {
		c.dx = float32(math.Cos(float64(input.Move))) * 5
		c.dy = float32(math.Sin(float64(input.Move))) * 5
	} else {
		c.dx = 0
		c.dy = 0
	}
}

func (c *Client) listenRead() {
	defer func() {
		c.game.unregister <- c
		c.conn.Close()
	}()
	c.conn.SetReadLimit(maxMessageSize)
	c.conn.SetReadDeadline(time.Now().Add(pongWait))
	c.conn.SetPongHandler(func(string) error { c.conn.SetReadDeadline(time.Now().Add(pongWait)); return nil })
	for {
		_, message, err := c.conn.ReadMessage()
		if err != nil {
			if websocket.IsUnexpectedCloseError(err, websocket.CloseGoingAway, websocket.CloseAbnormalClosure) {
				log.Printf("error: %v", err)
			}
			break
		}

		input := GameInput{}
		if err := proto.Unmarshal(message[1:], &input); err == nil {
			c.applyInput(&input)
		}
	}
}

func (c *Client) listenWrite() {
	ticker := time.NewTicker(pingPeriod)
	defer func() {
		ticker.Stop()
		c.conn.Close()
	}()
	for {
		select {
		case message, ok := <-c.send:
			c.conn.SetWriteDeadline(time.Now().Add(writeWait))
			if !ok {
				c.conn.WriteMessage(websocket.CloseMessage, []byte{})
				return
			}

			w, err := c.conn.NextWriter(websocket.BinaryMessage)
			if err != nil {
				return
			}
			w.Write(message)

			if err := w.Close(); err != nil {
				return
			}
		case <-ticker.C:
			c.conn.SetWriteDeadline(time.Now().Add(writeWait))
			if err := c.conn.WriteMessage(websocket.PingMessage, nil); err != nil {
				return
			}
		}
	}
}

func serveWs(game *Game, w http.ResponseWriter, r *http.Request) {
	conn, err := upgrader.Upgrade(w, r, nil)
	if err != nil {
		log.Println(err)
		return
	}
	client := &Client{game: game, conn: conn, send: make(chan []byte, 256), player: &Player{}}
	client.game.register <- client

	go client.listenWrite()
	go client.listenRead()
}
