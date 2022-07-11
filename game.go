package main

import (
	"time"
	"ws-server/physics"

	"google.golang.org/protobuf/proto"
)

const (
	hz     = 30.0
	tickMS = 1000 / int(hz)
	delta  = 1.0 / hz
)

type Game struct {
	clients    map[*Client]bool
	register   chan *Client
	unregister chan *Client
	lastID     byte
}

func newGame() *Game {
	return &Game{
		register:   make(chan *Client),
		unregister: make(chan *Client),
		clients:    make(map[*Client]bool),
	}
}

func (g *Game) run() {
	ticker := time.NewTicker(time.Millisecond * time.Duration(tickMS))
	defer func() {
		ticker.Stop()
	}()

	for {
		select {
		case client := <-g.register:
			g.lastID += 1
			client.ID = g.lastID
			client.player.Id = uint32(g.lastID)
			g.clients[client] = true
			client.send <- []byte{0, client.ID}
		case client := <-g.unregister:
			if _, ok := g.clients[client]; ok {
				delete(g.clients, client)
				close(client.send)
			}
		case <-ticker.C:
			g.update()
		}
	}
}

func (g *Game) sendToAll() {
	state := State{
		Players:   []*Player{},
		Snowballs: []*Snowball{},
	}

	for client := range g.clients {
		state.Players = append(state.Players, client.player)
		state.Snowballs = append(state.Snowballs, Map(client.snowballs, func(sb *SnowballB) *Snowball {
			return &sb.Snowball
		})...)
	}

	for client := range g.clients {
		state.MyLastSeq = client.lastSeq
		data, _ := proto.Marshal(&state)
		data = append([]byte{1}, data...)

		select {
		case client.send <- data:
		default:
			close(client.send)
			delete(g.clients, client)
		}
	}
}

func (g *Game) update() {
	for client := range g.clients {
		if !client.applyInputs() {
			client.body.Update(delta)
			client.player.X = client.body.Pos.X
			client.player.Y = client.body.Pos.Y
		}
	}

	for client := range g.clients {
		for i := len(client.snowballs) - 1; i >= 0; i-- {
			snowball := client.snowballs[i]
			snowball.body.Update(delta)
			snowball.X = snowball.body.Pos.X
			snowball.Y = snowball.body.Pos.Y
			if snowball.X > 980 || snowball.X < -10 || snowball.Y < -10 || snowball.Y > 560 {
				client.snowballs = RemoveIndex(client.snowballs, i)
			}
		}
	}

	for player := range g.clients {
		for other := range g.clients {
			if player.ID == other.ID {
				continue
			}
			if physics.CircleCircleCollision(player.body, other.body) {
				physics.CircleCirclePenRes(player.body, other.body)
				physics.CircleCircleCollRes(player.body, other.body)
			}
			for i := len(player.snowballs) - 1; i >= 0; i-- {
				snowball := player.snowballs[i]
				if physics.CircleCircleCollision(other.body, snowball.body) {
					physics.CircleCirclePenRes(other.body, snowball.body)
					physics.CircleCircleCollRes(other.body, snowball.body)
					//player.snowballs = RemoveIndex(player.snowballs, i)
				}
			}
		}
	}

	g.sendToAll()
}
