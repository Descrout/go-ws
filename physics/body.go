package physics

import "math"

type Body struct {
	Pos *Vec2
	Vel *Vec2
	Acc *Vec2

	R          float32
	Friction   float32
	Elasticity float32
	InvMass    float32
	MaxSpeed   float32
}

func NewBody(x, y, r, elasticity float32) *Body {
	return &Body{
		Pos:        NewVec2(x, y),
		Vel:        NewVec2(0, 0),
		Acc:        NewVec2(0, 0),
		R:          r,
		Elasticity: elasticity,
		Friction:   0.84,
		MaxSpeed:   2000,
		InvMass:    1,
	}
}

func (b *Body) SetMass(m float32) {
	if m == 0 {
		b.InvMass = 0
	} else {
		b.InvMass = 1 / m
	}
}

func (b *Body) ApplyForce(x, y float32) {
	b.Acc.X += x
	b.Acc.Y += y
}

func (b *Body) Update(dt float32) {
	b.Acc.Mult(dt)
	b.Vel.Add(b.Acc)
	b.Vel.Limit(b.MaxSpeed)
	b.Pos.X += b.Vel.X * dt
	b.Pos.Y += b.Vel.Y * dt
	b.Acc.Mult(0)
	if b.Friction < 1.0 {
		b.Vel.Mult(float32(math.Pow(float64(b.Friction), float64(dt*30))))
	}
}
