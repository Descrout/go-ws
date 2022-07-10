package physics

type Line struct {
	Start *Vec2
	End   *Vec2
	Unit  *Vec2
}

func NewLine(x1, y1, x2, y2 float32) *Line {
	unit := NewVec2(x2-x1, y2-y1)
	unit.Normalize()
	return &Line{
		Start: NewVec2(x1, y1),
		End:   NewVec2(x2, y2),
		Unit:  unit,
	}
}

func (l *Line) Reinit(x1, y1, x2, y2 float32) {
	l.Unit.Set(x2-x1, y2-y1)
	l.Unit.Normalize()
	l.Start.Set(x1, y1)
	l.End.Set(x2, y2)
}
