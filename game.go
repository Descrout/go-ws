package main

import (
	"time"

	"google.golang.org/protobuf/proto"
)

type Game struct {
	clients    map[*Client]bool
	register   chan *Client
	unregister chan *Client
}

func newGame() *Game {
	return &Game{
		register:   make(chan *Client),
		unregister: make(chan *Client),
		clients:    make(map[*Client]bool),
	}
}

func (g *Game) run() {
	ticker := time.NewTicker(time.Millisecond * 100)
	defer func() {
		ticker.Stop()
	}()

	for {
		select {
		case client := <-g.register:
			g.clients[client] = true
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
	}

	for client := range g.clients {
		state.MyLastSeq = client.lastSeq
		data, _ := proto.Marshal(&state)
		data = append([]byte{0}, data...)

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
		client.applyInputs()
	}

	g.sendToAll()
}
