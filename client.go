package main

import (
	"log"
	"math"
	"net/http"
	"time"
	"ws-server/physics"

	"github.com/gorilla/websocket"
	"google.golang.org/protobuf/proto"
)

type SnowballB struct {
	Snowball
	body *physics.Body
	Life uint16
}

type Client struct {
	game *Game
	conn *websocket.Conn
	send chan []byte

	player        *Player
	body          *physics.Body
	snowballs     []*SnowballB
	pendingInputs []*UserInput
	lastSeq       uint32
	ID            uint32

	shootTimer float32
}

func (c *Client) applyInputs() bool {
	updated := false
	for len(c.pendingInputs) > 0 {
		var input *UserInput
		input, c.pendingInputs = c.pendingInputs[0], c.pendingInputs[1:]
		if math.Abs(float64(input.InputTime)) > 0.033 {
			continue
		}

		var speed float32 = 1000
		if input.Shooting {
			speed = 400
		}

		if input.Moving {
			c.body.Acc.X = float32(math.Cos(float64(input.MoveAngle))) * speed
			c.body.Acc.Y = float32(math.Sin(float64(input.MoveAngle))) * speed
		}

		c.body.Update(input.InputTime)
		for other := range c.game.clients {
			if c.ID == other.ID {
				continue
			}
			if physics.CircleCircleCollision(c.body, other.body) {
				physics.CircleCirclePenRes(c.body, other.body)
				physics.CircleCircleCollRes(c.body, other.body)
			}
		}
		for _, line := range c.game.lines {
			if physics.CircleLineCollision(c.body, line) {
				physics.CircleLinePenRes(c.body, line)
				physics.CircleLineColRes(c.body, line)
			}
		}
		c.player.X = c.body.Pos.X
		c.player.Y = c.body.Pos.Y
		updated = true

		c.player.Angle = input.LookAngle
		c.lastSeq = input.Sequence
		c.player.Shooting = input.Shooting

		if input.Shooting {
			if c.shootTimer < 0 {
				c.shootTimer = 0.2
				body := physics.NewBody(c.player.X, c.player.Y, 8, 0.9)
				body.Friction = 1
				body.ApplyForce(float32(math.Cos(float64(input.LookAngle)))*12000.0, float32(math.Sin(float64(input.LookAngle)))*12000.0)
				c.snowballs = append(c.snowballs, &SnowballB{Life: 150, Snowball: Snowball{Id: input.Sequence, ParentId: c.player.Id, X: c.player.X, Y: c.player.Y, Angle: c.player.Angle}, body: body})
			}
		}
		c.shootTimer -= input.InputTime
	}
	return updated
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

		input := UserInput{}
		if len(c.pendingInputs) > 3 {
			continue
		}

		if err := proto.Unmarshal(message[1:], &input); err == nil {
			c.pendingInputs = append(c.pendingInputs, &input)
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
	body := physics.NewBody(100, 100, 22, 0)
	client := &Client{game: game, conn: conn, send: make(chan []byte, 256), body: body, player: &Player{X: 100, Y: 100}, pendingInputs: []*UserInput{}, snowballs: []*SnowballB{}}
	client.game.register <- client

	go client.listenWrite()
	go client.listenRead()
}
