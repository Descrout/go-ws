package physics

import "math"

var temp *Vec2 = NewVec2(0, 0)
var temp2 *Vec2 = NewVec2(0, 0)

func CircleLineClosest(circle *Body, line *Line, out *Vec2) bool {
	out.Set(line.Start.X, line.Start.Y)
	out.Sub(circle.Pos)

	if line.Unit.Dot(out) > 0 {
		out.Set(line.Start.X, line.Start.Y)
		return false
	}

	out.Set(circle.Pos.X, circle.Pos.Y)
	out.Sub(line.End)

	if line.Unit.Dot(out) > 0 {
		out.Set(line.End.X, line.End.Y)
		return false
	}

	out.Set(line.Start.X, line.Start.Y)
	out.Sub(circle.Pos)
	closest := line.Unit.Dot(out)
	out.Set(line.Unit.X, line.Unit.Y)
	out.Mult(closest)
	out.X = line.Start.X - out.X
	out.Y = line.Start.Y - out.Y
	return true
}

func CircleLineCollision(circle *Body, line *Line) bool {
	CircleLineClosest(circle, line, temp)
	temp.Sub(circle.Pos)
	return temp.MagSq() <= circle.R*circle.R
}

func CircleLinePenRes(circle *Body, line *Line) {
	CircleLineClosest(circle, line, temp)
	temp.X = circle.Pos.X - temp.X
	temp.Y = circle.Pos.Y - temp.Y
	temp2.Set(temp.X, temp.Y)
	temp2.Normalize()
	temp2.Mult(circle.R - temp.Mag())
	circle.Pos.Add(temp2)
}

func CircleLineColRes(circle *Body, line *Line) {
	CircleLineClosest(circle, line, temp)
	temp.X = circle.Pos.X - temp.X
	temp.Y = circle.Pos.Y - temp.Y
	temp.Normalize()

	sepVel := circle.Vel.Dot(temp)
	newSep := sepVel * circle.Elasticity
	sepDiff := sepVel - newSep
	temp.Mult(-sepDiff)
	circle.Vel.Add(temp)
}

func CircleCircleCollision(a, b *Body) bool {
	temp.Set(a.Pos.X, a.Pos.Y)
	temp.Sub(b.Pos)
	rSum := a.R + b.R
	return rSum*rSum >= temp.MagSq()
}

func CircleCirclePenRes(a, b *Body) {
	temp.Set(a.Pos.X, a.Pos.Y)
	temp.Sub(b.Pos)
	penDepth := a.R + b.R - temp.Mag()
	temp.Normalize()
	temp.Mult(penDepth / (a.InvMass + b.InvMass))

	temp2.Set(temp.X, temp.Y)
	temp2.Mult(a.InvMass)
	a.Pos.Add(temp2)
	temp2.Set(temp.X, temp.Y)
	temp2.Mult(-b.InvMass)
	b.Pos.Add(temp2)
}

func CircleCircleCollRes(a, b *Body) {
	temp.Set(a.Pos.X, a.Pos.Y)
	temp.Sub(b.Pos)
	temp.Normalize()

	temp2.Set(a.Vel.X, a.Vel.Y)
	temp2.Sub(b.Vel)

	sepVel := temp2.Dot(temp)
	newSep := -sepVel * float32(math.Min(float64(a.Elasticity), float64(b.Elasticity)))
	sepDiff := newSep - sepVel
	impulse := sepDiff / (a.InvMass + b.InvMass)
	temp.Mult(impulse)

	temp2.Set(temp.X, temp.Y)
	temp2.Mult(a.InvMass)
	a.Vel.Add(temp2)

	temp2.Set(temp.X, temp.Y)
	temp2.Mult(-b.InvMass)
	b.Vel.Add(temp2)
}
