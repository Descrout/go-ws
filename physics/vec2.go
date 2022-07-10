package physics

import "math"

type Vec2 struct {
	X float32
	Y float32
}

func NewVec2(x, y float32) *Vec2 {
	return &Vec2{
		X: x,
		Y: y,
	}
}

func (a *Vec2) Set(x, y float32) {
	a.X = x
	a.Y = y
}

func (a *Vec2) Add(b *Vec2) {
	a.X += b.X
	a.Y += b.Y
}

func (a *Vec2) Sub(b *Vec2) {
	a.X -= b.X
	a.Y -= b.Y
}

func (a *Vec2) Mult(b float32) {
	a.X *= b
	a.Y *= b
}

func (a *Vec2) Div(b float32) {
	if b == 0 {
		return
	}
	a.X /= b
	a.Y /= b
}

func (a *Vec2) MagSq() float32 {
	return a.X*a.X + a.Y*a.Y
}

func (a *Vec2) Mag() float32 {
	return float32(math.Sqrt(float64(a.MagSq())))
}

func (a *Vec2) Normalize() {
	mag := a.Mag()
	var scale float32 = 0.0
	if mag != 0 {
		scale = 1 / mag
	}
	a.Mult(scale)
}

func (a *Vec2) SetMag(mag float32) {
	a.Normalize()
	a.Mult(mag)
}

func (a *Vec2) Limit(mag float32) {
	if a.Mag() > mag {
		a.SetMag(mag)
	}
}

func (a *Vec2) Dot(b *Vec2) float32 {
	return a.X*b.X + a.Y*b.Y
}

func (a *Vec2) DotNorm(b *Vec2) float32 {
	return a.Dot(b) / (a.Mag() * b.Mag())
}

func (a *Vec2) Angle() float32 {
	return float32(math.Atan2(float64(a.Y), float64(a.X)))
}

func (a *Vec2) Dist(b *Vec2) float32 {
	dx := a.X - b.Y
	dy := a.Y - b.Y
	return float32(math.Sqrt(float64(dx*dx + dy*dy)))
}
