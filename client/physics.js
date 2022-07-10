class Vec2 {
    static create(x, y) {
        return new Float32Array([x || 0, y || 0]);
    }

    static set(a, x, y) {
        a[0] = x;
        a[1] = y;
        return a;
    }

    static add(a, b, out) {
        out[0] = a[0] + b[0];
        out[1] = a[1] + b[1];
    }

    static sub(a, b, out) {
        out[0] = a[0] - b[0];
        out[1] = a[1] - b[1];
    }

    static mult(a, v, out) {
        out[0] = a[0] * v;
        out[1] = a[1] * v;
    }

    static div(a, v, out) {
        out[0] = a[0] / v;
        out[1] = a[1] / v;
    }

    static mag(a) {
        return Math.sqrt(Vec2.magSq(a));
    }

    static setMag(a, v) {
        Vec2.normalize(a, a);
        Vec2.mult(a, v, a);
    }

    static limit(a, v) {
        if (Vec2.mag(a) > v) Vec2.setMag(a, v);
    }

    static magSq(a) {
        const x = a[0];
        const y = a[1];
        return x * x + y * y;
    }

    static normalize(a, out) {
        const mag = Vec2.mag(a);
        const scale = (mag == 0) ? 0 : 1 / mag;
        out[0] = a[0] * scale;
        out[1] = a[1] * scale;
    }

    static dot(a, b) {
        return a[0] * b[0] + a[1] * b[1];
    }

    static dotNorm(a, b) {
        return Vec2.dot(a, b) / (Vec2.mag(a) * Vec2.mag(b));
    }

    static angle(a) {
        return Math.atan2(a[1], a[0]);
    }

    static dist(a, b) {
        const dx = a[0] - b[0];
        const dy = a[1] - b[1];
        return Math.sqrt(dx * dx + dy * dy);
    }
}

class Line {
    constructor(x1, y1, x2, y2) {
        this.start = Vec2.create(0, 0);
        this.end = Vec2.create(0, 0);
        this.unit = Vec2.create(0, 0);

        this.reinit(x1, y1, x2, y2);
    }

    reinit(x1, y1, x2, y2) {
        Vec2.set(this.start, x1, y1);
        Vec2.set(this.end, x2, y2);

        this.calc_unit();

        return this;
    }

    calc_unit() {
        Vec2.sub(this.end, this.start, this.unit);
        Vec2.normalize(this.unit, this.unit);
    }
}

class Body {
    constructor(x, y, r, elasticity) {
        this.pos = Vec2.create(x, y);
        this.vel = Vec2.create(0, 0);
        this.acc = Vec2.create(0, 0);

        this.r = r;
        this.friction = 0.84;
        this.elasticity = elasticity || 0.0;
        this.inv_mass = 1;
        this.max_speed = 2000;
    }

    set mass(m) {
        if (m === 0) {
            this.inv_mass = 0;
        } else {
            this.inv_mass = 1 / m;
        }
    }

    apply_force(x, y) {
        this.acc[0] += x;
        this.acc[1] += y;
    }

    update(dt) {
        Vec2.mult(this.acc, dt, this.acc);
        Vec2.add(this.vel, this.acc, this.vel);
        Vec2.limit(this.vel, this.max_speed);
        this.pos[0] += this.vel[0] * dt;
        this.pos[1] += this.vel[1] * dt;
        Vec2.mult(this.acc, 0, this.acc);
        if (this.friction < 1.0) Vec2.mult(this.vel, Math.pow(this.friction, dt * 60), this.vel);
    }
}

class Physics {
    static temp = Vec2.create(0, 0);
    static temp2 = Vec2.create(0, 0);

    static circle_line_closest(circle, line, out) {
        Vec2.sub(line.start, circle.pos, Physics.temp);
        if (Vec2.dot(line.unit, Physics.temp) > 0) {
            out[0] = line.start[0];
            out[1] = line.start[1];
            return false;
        }

        Vec2.sub(circle.pos, line.end, Physics.temp2);
        if (Vec2.dot(line.unit, Physics.temp2) > 0) {
            out[0] = line.end[0];
            out[1] = line.end[1];
            return false;
        }

        const closest = Vec2.dot(line.unit, Physics.temp);
        Vec2.mult(line.unit, closest, Physics.temp);
        Vec2.sub(line.start, Physics.temp, out);
        return true;
    }

    static circle_line_collision(circle, line) {
        Physics.circle_line_closest(circle, line, Physics.temp);
        Vec2.sub(Physics.temp, circle.pos, Physics.temp);

        return (Vec2.magSq(Physics.temp) <= circle.r * circle.r);
    }

    static circle_line_pen_res(circle, line) {
        Physics.circle_line_closest(circle, line, Physics.temp);
        Vec2.sub(circle.pos, Physics.temp, Physics.temp);
        Vec2.normalize(Physics.temp, Physics.temp2);
        Vec2.mult(Physics.temp2, circle.r - Vec2.mag(Physics.temp), Physics.temp);
        Vec2.add(circle.pos, Physics.temp, circle.pos);
    }

    static circle_line_col_res(circle, line) {
        Physics.circle_line_closest(circle, line, Physics.temp);
        Vec2.sub(circle.pos, Physics.temp, Physics.temp);
        Vec2.normalize(Physics.temp, Physics.temp);

        const sep_vel = Vec2.dot(circle.vel, Physics.temp);
        const new_sep = -sep_vel * circle.elasticity;
        const sep_diff = sep_vel - new_sep;

        Vec2.mult(Physics.temp, -sep_diff, Physics.temp);
        Vec2.add(circle.vel, Physics.temp, circle.vel);
    }

    static circle_circle_collision(a, b) {
        Vec2.sub(a.pos, b.pos, Physics.temp);
        const r_sum = a.r + b.r;
        return r_sum * r_sum >= Vec2.magSq(Physics.temp);
    }

    static circle_circle_pen_res(a, b) {
        Vec2.sub(a.pos, b.pos, Physics.temp);
        const pen_depth = a.r + b.r - Vec2.mag(Physics.temp);
        Vec2.normalize(Physics.temp, Physics.temp);
        Vec2.mult(Physics.temp, pen_depth / (a.inv_mass + b.inv_mass), Physics.temp);

        Vec2.mult(Physics.temp, a.inv_mass, Physics.temp2);
        Vec2.add(a.pos, Physics.temp2, a.pos);
        Vec2.mult(Physics.temp, -b.inv_mass, Physics.temp2);
        Vec2.add(b.pos, Physics.temp2, b.pos);
    }

    static circle_circle_coll_res(a, b) {
        Vec2.sub(a.pos, b.pos, Physics.temp);
        Vec2.normalize(Physics.temp, Physics.temp);
        Vec2.sub(a.vel, b.vel, Physics.temp2);
        const sep_vel = Vec2.dot(Physics.temp2, Physics.temp);
        const new_sep = -sep_vel * Math.min(a.elasticity, b.elasticity);

        const sep_diff = new_sep - sep_vel;
        const impulse = sep_diff / (a.inv_mass + b.inv_mass);
        Vec2.mult(Physics.temp, impulse, Physics.temp);

        Vec2.mult(Physics.temp, a.inv_mass, Physics.temp2);
        Vec2.add(a.vel, Physics.temp2, a.vel);

        Vec2.mult(Physics.temp, -b.inv_mass, Physics.temp2);
        Vec2.add(b.vel, Physics.temp2, b.vel);
    }
}
