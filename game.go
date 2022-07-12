package main

import (
	"time"
	"ws-server/physics"

	"google.golang.org/protobuf/proto"
)

const (
	hz     = 45.0
	tickMS = 1000 / int(hz)
	delta  = 1.0 / hz
)

type Game struct {
	clients    map[*Client]bool
	register   chan *Client
	unregister chan *Client
	lastID     uint32
	lines      []*physics.Line
}

func newGame() *Game {
	return &Game{
		register:   make(chan *Client),
		unregister: make(chan *Client),
		clients:    make(map[*Client]bool),
		lines: []*physics.Line{
			physics.NewLine(0, 0, 960, 0),
			physics.NewLine(960, 0, 960, 540),
			physics.NewLine(960, 540, 0, 540),
			physics.NewLine(0, 540, 0, 0),

			physics.NewLine(200, 200, 700, 400),
		},
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
			initialState := InitialState{
				MyId: client.ID,
				Lines: Map(g.lines, func(line *physics.Line) *LineP {
					return &LineP{
						X1: line.Start.X,
						Y1: line.Start.Y,
						X2: line.End.X,
						Y2: line.End.Y,
					}
				}),
			}
			data, _ := proto.Marshal(&initialState)
			client.send <- append([]byte{0}, data...)
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
		}
	}

	for client := range g.clients {
		for i := len(client.snowballs) - 1; i >= 0; i-- {
			snowball := client.snowballs[i]
			snowball.body.Update(delta)
			snowball.X = snowball.body.Pos.X
			snowball.Y = snowball.body.Pos.Y
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
				player.player.X = player.body.Pos.X
				player.player.Y = player.body.Pos.Y
			}
			for i := len(player.snowballs) - 1; i >= 0; i-- {
				snowball := player.snowballs[i]
				if physics.CircleCircleCollision(other.body, snowball.body) {
					physics.CircleCirclePenRes(other.body, snowball.body)
					physics.CircleCircleCollRes(other.body, snowball.body)
					physics.CircleCirclePenRes(snowball.body, other.body)
					physics.CircleCircleCollRes(snowball.body, other.body)
					other.player.X = other.body.Pos.X
					other.player.Y = other.body.Pos.Y
					snowball.X = snowball.body.Pos.X
					snowball.Y = snowball.body.Pos.Y
					//player.snowballs = RemoveIndex(player.snowballs, i)
				}
			}
		}
		for _, line := range g.lines {
			if physics.CircleLineCollision(player.body, line) {
				physics.CircleLinePenRes(player.body, line)
				physics.CircleLineColRes(player.body, line)
				player.player.X = player.body.Pos.X
				player.player.Y = player.body.Pos.Y
			}
		}
	}

	for _, line := range g.lines {
		for player := range g.clients {
			for _, snowball := range player.snowballs {
				if physics.CircleLineCollision(snowball.body, line) {
					physics.CircleLinePenRes(snowball.body, line)
					physics.CircleLineColRes(snowball.body, line)
					snowball.X = snowball.body.Pos.X
					snowball.Y = snowball.body.Pos.Y
				}
			}
		}
	}

	g.sendToAll()
}
