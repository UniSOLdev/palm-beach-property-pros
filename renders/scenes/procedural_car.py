"""
Procedural, unbranded long-hood grand saloon (Rolls-Royce / Maybach-class proportions).

    objs = luxury_saloon()          # list of objects, real scale (~5.6 m long), front = +X

No badges, hood ornament, wordmarks, or plates, by construction. The grille is a generic
horizontal-vane design, not any manufacturer's trade dress.

Body: a lofted shell built from ~140 cross-sections (rocker, side bulge, shoulder,
tumblehome greenhouse, roof crown), Catmull-Clark smoothed, with wheel arches cut by
booleans. Materials are assigned per face: paint, glass, black pillar trim.
"""
from __future__ import annotations

import math

import bmesh
import bpy
from mathutils import Vector

from common import car_paint, principled

# ---- proportions (metres)
L = 5.60
XF, XR = L / 2, -L / 2           # nose, tail
AXLE_F, AXLE_R = 1.80, -1.50     # long dash-to-axle, 3.3 m wheelbase
WHEEL_R = 0.405
TRACK = 0.835                    # wheel centre |y|
Z_BOTTOM = 0.19
BELT = 0.99
X_WS0, X_WS1 = 0.70, -0.30       # windshield base -> roof front
X_RW0, X_RW1 = -1.62, -2.22      # roof rear -> rear window base
X_BPILLAR = -0.80
ROOF = 1.61


def _smooth(t):
    t = min(max(t, 0.0), 1.0)
    return t * t * (3 - 2 * t)


def _lerp(a, b, t):
    return a + (b - a) * t


def half_width(x):
    """Plan-view half width: full 1.00 m mid-body, rounded at nose and tail."""
    w = 1.0
    if x > XF - 0.55:
        t = (x - (XF - 0.55)) / 0.55
        w = 1.0 - 0.10 * t ** 2.2
    if x < XR + 0.60:
        t = ((XR + 0.60) - x) / 0.60
        w = 1.0 - 0.09 * t ** 2.0
    return w


def top_z(x):
    """Centre-line height of the upper surface: hood, windshield, roof, rear window, deck."""
    if x >= X_WS0:                              # hood: long, nearly flat, slight fall to nose
        t = (x - X_WS0) / (XF - X_WS0)
        return 1.035 - 0.06 * t ** 1.6
    if x >= X_WS1:                              # windshield
        t = (X_WS0 - x) / (X_WS0 - X_WS1)
        return _lerp(1.035, ROOF - 0.02, _smooth(t) * 0.35 + t * 0.65)
    if x >= X_RW0:                              # roof, gentle crown
        t = (X_WS1 - x) / (X_WS1 - X_RW0)
        return ROOF + 0.015 * math.sin(math.pi * t)
    if x >= X_RW1:                              # rear window (upright, formal)
        t = (X_RW0 - x) / (X_RW0 - X_RW1)
        return _lerp(ROOF, 1.10, t ** 1.15)
    t = (X_RW1 - x) / (X_RW1 - XR)             # short, high deck
    return 1.10 - 0.05 * t ** 1.4


def cabin_factor(x):
    """0 on hood / deck (top spans the full width), 1 where the greenhouse is fully formed."""
    if x > X_WS0 or x < X_RW1:
        return 0.0
    a = _smooth((X_WS0 - x) / 0.55)
    b = _smooth((x - X_RW1) / 0.35)
    return min(a, b)


def _clamp01(v):
    return min(max(v, 0.0), 1.0)


NOSE_RAKE, TAIL_RAKE = 0.12, 0.10


def rake_dx(x, z):
    """Lean the fascia back toward the top (nose) and the tail panel forward-in at the top,
    so the ends read sculpted instead of slab-sided."""
    dx = 0.0
    if x > XF - 0.45:
        t = (x - (XF - 0.45)) / 0.45
        dx -= NOSE_RAKE * t * t * _clamp01((z - 0.80) / 0.28) ** 1.5   # round the hood leading edge; fascia stays upright
    if x < XR + 0.40:
        t = ((XR + 0.40) - x) / 0.40
        dx += TAIL_RAKE * t * t * _clamp01((z - 0.60) / 0.5)
    return dx


def nose_tail_bottom(x):
    """Raise the lower edge toward the bumpers (approach / departure angles)."""
    z = Z_BOTTOM
    if x > XF - 0.40:
        z += 0.20 * ((x - (XF - 0.40)) / 0.40) ** 1.6
    if x < XR + 0.45:
        z += 0.22 * (((XR + 0.45) - x) / 0.45) ** 1.6
    return z


# Section template: (y, z) points for the +Y half, bottom centre -> roof centre.
# Index ranges used for material assignment.
SEC_SIDE_END = 7      # points [0..7] lower body + shoulder
SEC_GH0, SEC_GH1 = 7, 9   # greenhouse side (belt -> roof rail)


def section(x):
    W = half_width(x)
    zb = nose_tail_bottom(x)
    zt = top_z(x)
    c = cabin_factor(x)
    belt = BELT + 0.02 * (-(x) / XF) if x < 0 else BELT     # belt rises slightly to the rear
    belt = min(belt, zt - 0.005) if c == 0 else belt
    # front / rear faces lean in a little at the top (fascia shape)
    pts = [
        (0.0, zb),
        (W - 0.16, zb),
        (W - 0.05, zb + 0.05),
        (W - 0.005, zb + 0.20),                  # rocker
        (W, 0.62),                               # body side, max width
        (W - 0.01, belt - 0.12),
        (W - 0.035, belt - 0.03),                # shoulder
        (W - 0.075, belt),                       # shoulder top / belt line
    ]
    # greenhouse (collapses onto a wide hood / deck where c == 0)
    gb = W - 0.09 - 0.03 * c
    gr = _lerp(W - 0.28, 0.80, c)
    zg_top = _lerp(zt - 0.004, zt - 0.075, c)
    pts += [
        (gb, belt + (zg_top - belt) * 0.02),
        (_lerp(gb, gr, 0.55), belt + (zg_top - belt) * 0.60),
        (gr, zg_top),                            # roof rail
        (gr - _lerp(0.12, 0.10, c), zt - 0.012),
        (gr * 0.45, zt - 0.002),
        (0.0, zt),
    ]
    return pts


def _stations():
    xs = []
    n_mid = 110
    for i in range(n_mid + 1):
        xs.append(_lerp(XR + 0.06, XF - 0.06, i / n_mid))
    # dense taper at the very ends so the caps round over
    head = [XF - 0.06 + 0.06 * (1 - (1 - k / 6) ** 2) for k in range(1, 7)]
    tail = [XR + 0.06 - 0.06 * (1 - (1 - k / 6) ** 2) for k in range(1, 7)]
    return list(reversed(tail)) + xs + head


def build_body(paint, glass, trim):
    bm = bmesh.new()
    xs = _stations()
    rings = []
    for i, x in enumerate(xs):
        pts = section(x)
        # end shrink: last 6 stations at each end pull toward the section centroid
        shrink = 1.0
        if x > XF - 0.06:
            shrink = 1 - 0.55 * ((x - (XF - 0.06)) / 0.06) ** 1.5
        if x < XR + 0.06:
            shrink = 1 - 0.55 * (((XR + 0.06) - x) / 0.06) ** 1.5
        zc = sum(p[1] for p in pts) / len(pts)
        full = [(y * shrink, zc + (z - zc) * shrink) for y, z in pts]
        loop = full + [(-y, z) for y, z in reversed(full[1:-1])]
        rings.append([bm.verts.new((x + rake_dx(x, z), y, z)) for y, z in loop])
    m = len(rings[0])
    half = len(section(0.0))
    for i in range(len(rings) - 1):
        x_mid = (xs[i] + xs[i + 1]) / 2
        for k in range(m):
            a, b = rings[i][k], rings[i][(k + 1) % m]
            c, d = rings[i + 1][(k + 1) % m], rings[i + 1][k]
            f = bm.faces.new((a, b, c, d))
            kk = k if k < half else (m - k - 1)        # mirrored index on the -Y half
            f.material_index = _mat_index(x_mid, kk)
    bm.faces.new(list(reversed(rings[-1]))).material_index = 0
    bm.faces.new(rings[0]).material_index = 0
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    me = bpy.data.meshes.new("SaloonBody")
    bm.to_mesh(me)
    bm.free()
    for mt in (paint, glass, trim):
        me.materials.append(mt)
    for p in me.polygons:
        p.use_smooth = True
    body = bpy.data.objects.new("SaloonBody", me)
    bpy.context.scene.collection.objects.link(body)
    sub = body.modifiers.new("Smooth", "SUBSURF")
    sub.levels, sub.render_levels = 1, 2
    return body


def _mat_index(x, k):
    """0 paint, 1 glass, 2 gloss-black trim. k = index of the strip's first section point:
    0-6 lower body, 7 belt step, 8-9 greenhouse side, 10 roof rail, 11-12 top surface."""
    if X_WS1 < x < X_WS0 - 0.06:                 # windshield
        if k >= 11:
            return 1
        if k in (8, 9, 10):
            return 2                              # A-pillars
        return 0
    if X_RW0 <= x <= X_WS1:                       # roof section
        if k in (8, 9):
            if abs(x - X_BPILLAR) < 0.07 or x > X_WS1 - 0.05 or x < X_RW0 + 0.08:
                return 2                          # B pillar / door-frame ends
            return 1                              # side glass
        if k == 10:
            return 2                              # drip rail
        return 0
    if X_RW1 + 0.05 < x < X_RW0:                  # rear window between formal C-pillars
        return 1 if k >= 11 else 0
    return 0


def _shut_lines(paint):
    """Door / bonnet / boot shut lines baked into the paint shader (object space)."""
    nt = paint.node_tree
    N, Lk = nt.nodes, nt.links
    b = N["Principled BSDF"]
    tc = N.new("ShaderNodeTexCoord")
    sep = N.new("ShaderNodeSeparateXYZ")
    Lk.new(tc.outputs["Object"], sep.inputs[0])
    lines = None
    # vertical door gaps on the sides
    for xd in (X_WS0 + 0.02, X_BPILLAR + 0.02, X_RW1 + 0.25):
        d = N.new("ShaderNodeMath")
        d.operation = "SUBTRACT"
        d.inputs[1].default_value = xd
        Lk.new(sep.outputs["X"], d.inputs[0])
        a = N.new("ShaderNodeMath")
        a.operation = "ABSOLUTE"
        Lk.new(d.outputs[0], a.inputs[0])
        lt = N.new("ShaderNodeMath")
        lt.operation = "LESS_THAN"
        lt.inputs[1].default_value = 0.0035
        Lk.new(a.outputs[0], lt.inputs[0])
        lines = lt.outputs[0] if lines is None else _max(N, Lk, lines, lt.outputs[0])
    # restrict to the side (|y| > 0.7) between rocker and belt
    ay = N.new("ShaderNodeMath")
    ay.operation = "ABSOLUTE"
    Lk.new(sep.outputs["Y"], ay.inputs[0])
    side = N.new("ShaderNodeMath")
    side.operation = "GREATER_THAN"
    side.inputs[1].default_value = 0.72
    Lk.new(ay.outputs[0], side.inputs[0])
    zr = N.new("ShaderNodeMapRange")
    zr.clamp = True
    zr.inputs["From Min"].default_value = 0.40
    zr.inputs["From Max"].default_value = 0.41
    Lk.new(sep.outputs["Z"], zr.inputs["Value"])
    zt = N.new("ShaderNodeMath")
    zt.operation = "LESS_THAN"
    zt.inputs[1].default_value = BELT - 0.01
    Lk.new(sep.outputs["Z"], zt.inputs[0])
    m1 = _mul(N, Lk, lines, side.outputs[0])
    m2 = _mul(N, Lk, m1, zr.outputs["Result"])
    mask = _mul(N, Lk, m2, zt.outputs[0])
    # darken base colour and coat in the gap
    base = b.inputs["Base Color"].default_value[:]
    mix = N.new("ShaderNodeMix")
    mix.data_type = "RGBA"
    mix.inputs[6].default_value = base
    mix.inputs[7].default_value = (0.0, 0.0, 0.0, 1)
    Lk.new(mask, mix.inputs["Factor"])
    Lk.new(mix.outputs[2], b.inputs["Base Color"])
    rough = N.new("ShaderNodeMapRange")
    rough.inputs["To Min"].default_value = b.inputs["Roughness"].default_value
    rough.inputs["To Max"].default_value = 0.9
    Lk.new(mask, rough.inputs["Value"])
    Lk.new(rough.outputs["Result"], b.inputs["Roughness"])
    if "Coat Weight" in b.inputs:
        cw = N.new("ShaderNodeMapRange")
        cw.inputs["To Min"].default_value = 1.0
        cw.inputs["To Max"].default_value = 0.0
        Lk.new(mask, cw.inputs["Value"])
        Lk.new(cw.outputs["Result"], b.inputs["Coat Weight"])


def _mul(N, Lk, a, b):
    m = N.new("ShaderNodeMath")
    m.operation = "MULTIPLY"
    Lk.new(a, m.inputs[0])
    Lk.new(b, m.inputs[1])
    return m.outputs[0]


def _max(N, Lk, a, b):
    m = N.new("ShaderNodeMath")
    m.operation = "MAXIMUM"
    Lk.new(a, m.inputs[0])
    Lk.new(b, m.inputs[1])
    return m.outputs[0]


# --------------------------------------------------------------------------- wheels
def _revolve(name, profile, segs, mat, loc):
    """Revolve (r, y) profile around the Y axis."""
    bm = bmesh.new()
    rings = []
    for s in range(segs):
        a = 2 * math.pi * s / segs
        rings.append([bm.verts.new((r * math.cos(a), y, r * math.sin(a))) for r, y in profile])
    for s in range(segs):
        r0, r1 = rings[s], rings[(s + 1) % segs]
        for k in range(len(profile) - 1):
            bm.faces.new((r0[k], r0[k + 1], r1[k + 1], r1[k]))
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    me = bpy.data.meshes.new(name)
    bm.to_mesh(me)
    bm.free()
    me.materials.append(mat)
    for p in me.polygons:
        p.use_smooth = True
    o = bpy.data.objects.new(name, me)
    o.location = loc
    bpy.context.scene.collection.objects.link(o)
    return o


def _tire_material():
    m = principled("Tire", (0.022, 0.022, 0.023), roughness=0.86, Specular_IOR_Level=0.25)
    N, Lk = m.node_tree.nodes, m.node_tree.links
    b = N["Principled BSDF"]
    tc = N.new("ShaderNodeTexCoord")
    # tread: circumferential grooves + angled sipes on the contact face
    wave = N.new("ShaderNodeTexWave")
    wave.wave_type = "RINGS"
    wave.inputs["Scale"].default_value = 30
    wave.inputs["Distortion"].default_value = 0.0
    Lk.new(tc.outputs["Object"], wave.inputs["Vector"])
    bump = N.new("ShaderNodeBump")
    bump.inputs["Strength"].default_value = 0.25
    Lk.new(wave.outputs["Fac"], bump.inputs["Height"])
    Lk.new(bump.outputs["Normal"], b.inputs["Normal"])
    return m


def wheel(name, loc, side, tire_m, rim_m, dark_m, disc_m):
    objs = []
    w = 0.275
    s = 1 if side > 0 else -1
    # tyre: rounded section, 285/35R22-ish
    prof = [(0.285, -w / 2 + 0.02), (0.33, -w / 2), (0.385, -w / 2 + 0.008), (WHEEL_R, -w / 2 + 0.04),
            (WHEEL_R, w / 2 - 0.04), (0.385, w / 2 - 0.008), (0.33, w / 2), (0.285, w / 2 - 0.02)]
    prof = [(r, y * s) for r, y in prof]
    objs.append(_revolve(f"{name}_Tire", prof, 72, tire_m, loc))
    # rim barrel + lip
    barrel = [(0.284, -w / 2 + 0.03), (0.288, -w / 2 + 0.015), (0.28, -w / 2 + 0.005),
              (0.275, w / 2 - 0.02), (0.282, w / 2 - 0.005), (0.288, w / 2 - 0.012)]
    objs.append(_revolve(f"{name}_Barrel", [(r, y * s) for r, y in barrel], 72, rim_m, loc))
    # dark inner dish behind the spokes
    dish = [(0.0, -0.02), (0.27, 0.0), (0.275, 0.06)]
    objs.append(_revolve(f"{name}_Dish", [(r, -y * s) for r, y in dish], 48, dark_m, loc))
    # brake disc + caliper
    disc = [(0.08, -0.01), (0.205, -0.01), (0.205, 0.01), (0.08, 0.01)]
    d = _revolve(f"{name}_Disc", [(r, y) for r, y in disc], 48, disc_m, (loc[0], loc[1] - s * 0.03, loc[2]))
    objs.append(d)
    # 10 slender, slightly concave spokes (polished)
    bm = bmesh.new()
    face_y = w / 2 - 0.035
    for i in range(10):
        a = 2 * math.pi * i / 10
        ca, sa = math.cos(a), math.sin(a)
        prev = None
        for j, (r, dy, hw) in enumerate(((0.07, 0.005, 0.022), (0.17, 0.02, 0.016), (0.272, 0.0, 0.013))):
            tang = Vector((-sa, 0, ca))
            radial = Vector((ca, 0, sa))
            c = radial * r + Vector((0, (face_y - dy) * s, 0))
            v = [bm.verts.new(c + tang * hw), bm.verts.new(c - tang * hw),
                 bm.verts.new(c - tang * hw * 0.8 - Vector((0, 0.025 * s, 0))),
                 bm.verts.new(c + tang * hw * 0.8 - Vector((0, 0.025 * s, 0)))]
            if prev:
                for k in range(4):
                    bm.faces.new((prev[k], prev[(k + 1) % 4], v[(k + 1) % 4], v[k]))
            prev = v
    # hub cap (plain, no logo)
    hub = bmesh.ops.create_circle(bm, cap_ends=True, segments=32, radius=0.075)
    bmesh.ops.rotate(bm, verts=hub["verts"], cent=(0, 0, 0), matrix=__import__("mathutils").Matrix.Rotation(math.pi / 2, 3, "X"))
    bmesh.ops.translate(bm, verts=hub["verts"], vec=(0, (face_y + 0.004) * s, 0))
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    me = bpy.data.meshes.new(f"{name}_Spokes")
    bm.to_mesh(me)
    bm.free()
    me.materials.append(rim_m)
    sp = bpy.data.objects.new(f"{name}_Spokes", me)
    sp.location = loc
    bpy.context.scene.collection.objects.link(sp)
    bv = sp.modifiers.new("Bevel", "BEVEL")
    bv.width, bv.segments = 0.003, 2
    objs.append(sp)
    return objs


# --------------------------------------------------------------------------- glass / interior
def see_through_glass():
    """Thin automotive glass: no refraction offset, Fresnel reflections, slight grey tint, so
    the interior reads through the side windows and windshield."""
    m = bpy.data.materials.new("SaloonGlass")
    m.use_nodes = True
    N, Lk = m.node_tree.nodes, m.node_tree.links
    out = N["Material Output"]
    N.remove(N["Principled BSDF"])
    tr = N.new("ShaderNodeBsdfTransparent")
    tr.inputs["Color"].default_value = (0.42, 0.45, 0.47, 1)
    gl = N.new("ShaderNodeBsdfGlossy")
    gl.inputs["Roughness"].default_value = 0.0
    fr = N.new("ShaderNodeFresnel")
    fr.inputs["IOR"].default_value = 1.52
    lift = N.new("ShaderNodeMath")
    lift.operation = "MULTIPLY_ADD"
    lift.inputs[1].default_value = 0.85
    lift.inputs[2].default_value = 0.10
    Lk.new(fr.outputs["Fac"], lift.inputs[0])
    mix = N.new("ShaderNodeMixShader")
    Lk.new(lift.outputs[0], mix.inputs["Fac"])
    Lk.new(tr.outputs["BSDF"], mix.inputs[1])
    Lk.new(gl.outputs["BSDF"], mix.inputs[2])
    Lk.new(mix.outputs["Shader"], out.inputs["Surface"])
    return m


def _soft(o, levels=2):
    s_ = o.modifiers.new("Smooth", "SUBSURF")
    s_.levels = s_.render_levels = levels
    return o


def interior():
    """Cream leather, open-pore walnut, black carpet: seen through the glass, never close up."""
    leather = principled("Leather", (0.66, 0.57, 0.45), roughness=0.5)
    piping = principled("Piping", (0.05, 0.08, 0.16), roughness=0.45)
    wood = principled("Walnut", (0.13, 0.06, 0.025), roughness=0.15, Coat_Weight=1.0)
    carpet = principled("Carpet", (0.03, 0.03, 0.035), roughness=0.95)
    head = principled("Headliner", (0.62, 0.58, 0.52), roughness=0.9)
    o = []
    o.append(_rbox("Carpet", (3.0, 1.84, 0.03), (-0.75, 0, 0.42), carpet, 0.0))
    o.append(_rbox("Headliner", (1.2, 1.15, 0.02), (-0.95, 0, ROOF - 0.13), head, 0.0))
    for sy in (-1, 1):
        o.append(_rbox(f"DoorCard{sy}", (2.75, 0.05, 0.55), (-0.78, sy * 0.88, 0.74), leather, 0.01))
        o.append(_rbox(f"DoorWood{sy}", (2.6, 0.06, 0.05), (-0.78, sy * 0.87, 0.98), wood, 0.008))
    seats = [(-0.20, 0.42, 0.52), (-0.20, -0.42, 0.52), (-1.45, 0.0, 1.38)]
    for k, (x, y, w) in enumerate(seats):
        o.append(_soft(_rbox(f"SeatCushion{k}", (0.55, w, 0.15), (x, y, 0.56), leather, 0.05, 4)))
        back = _soft(_rbox(f"SeatBack{k}", (0.15, w, 0.62), (x - 0.30, y, 0.92), leather, 0.05, 4))
        back.rotation_euler[1] = math.radians(-14)
        o.append(back)
        hr_w = 0.28
        for hy in ((y,) if k < 2 else (-0.42, 0.42)):
            hr = _soft(_rbox(f"Headrest{k}_{hy}", (0.10, hr_w, 0.17), (x - 0.40, hy, 1.33), leather, 0.04, 4))
            hr.rotation_euler[1] = math.radians(-14)
            o.append(hr)
        o.append(_rbox(f"SeatPiping{k}", (0.012, w * 0.95, 0.012), (x + 0.27, y, 0.635), piping, 0.004, 2))
    o.append(_soft(_rbox("Dash", (0.45, 1.75, 0.22), (0.55, 0, 0.90), leather, 0.05, 4)))
    o.append(_rbox("DashWood", (0.06, 1.70, 0.07), (0.33, 0, 0.92), wood, 0.012))
    o.append(_rbox("Console", (0.9, 0.26, 0.22), (0.05, 0, 0.55), wood, 0.03))
    bpy.ops.mesh.primitive_torus_add(major_radius=0.185, minor_radius=0.017, location=(0.16, 0.42, 1.02))
    wheel_ = bpy.context.active_object
    wheel_.name = "SteeringWheel"
    wheel_.rotation_euler[1] = math.radians(-68)
    wheel_.data.materials.append(leather)
    o.append(wheel_)
    for ob in o:
        ob["pbpp_interior"] = True     # foam and other exterior effects skip these
    return o


# --------------------------------------------------------------------------- trim
def _rbox(name, size, loc, mat, bevel=0.01, segs=3):
    bm = bmesh.new()
    bmesh.ops.create_cube(bm, size=1.0)
    bmesh.ops.scale(bm, vec=Vector(size), verts=bm.verts)
    me = bpy.data.meshes.new(name)
    bm.to_mesh(me)
    bm.free()
    me.materials.append(mat)
    o = bpy.data.objects.new(name, me)
    o.location = loc
    bpy.context.scene.collection.objects.link(o)
    if bevel:
        b = o.modifiers.new("Bevel", "BEVEL")
        b.width, b.segments = bevel, segs
        b.limit_method = "NONE"
    for p in me.polygons:
        p.use_smooth = True
    return o


def luxury_saloon(paint_color=(0.010, 0.018, 0.045)):
    paint = car_paint("SaloonPaint", paint_color)
    _shut_lines(paint)
    glass = see_through_glass()
    trim = principled("GlossBlack", (0.008, 0.008, 0.009), roughness=0.12, Coat_Weight=1.0)
    chrome = principled("Chrome", (0.92, 0.92, 0.93), roughness=0.04, metallic=1.0)
    rim_m = principled("RimPolished", (0.85, 0.85, 0.86), roughness=0.10, metallic=1.0)
    dark = principled("WheelWell", (0.012, 0.012, 0.012), roughness=0.85)
    disc_m = principled("BrakeDisc", (0.30, 0.30, 0.31), roughness=0.35, metallic=1.0)
    tire_m = _tire_material()
    lamp = principled("LampLens", (0.02, 0.02, 0.022), roughness=0.02, Specular_IOR_Level=0.9)
    led = principled("LED", (1, 1, 1), roughness=0.3)
    led.node_tree.nodes["Principled BSDF"].inputs["Emission Color"].default_value = (1.0, 0.98, 0.95, 1)
    led.node_tree.nodes["Principled BSDF"].inputs["Emission Strength"].default_value = 6.0
    tail = principled("TailLamp", (0.35, 0.0, 0.0), roughness=0.05)
    tail.node_tree.nodes["Principled BSDF"].inputs["Emission Color"].default_value = (1.0, 0.02, 0.01, 1)
    tail.node_tree.nodes["Principled BSDF"].inputs["Emission Strength"].default_value = 1.2

    objs = []
    body = build_body(paint, glass, trim)
    # wheel arches: cut after smoothing so the arch lip is crisp
    cutters = bpy.data.collections.new("SaloonArchCutters")
    bpy.context.scene.collection.children.link(cutters)
    for i, ax in enumerate((AXLE_F, AXLE_R)):
        bm = bmesh.new()
        bmesh.ops.create_cone(bm, cap_ends=True, segments=64, radius1=WHEEL_R + 0.045,
                              radius2=WHEEL_R + 0.045, depth=2.6)
        bmesh.ops.rotate(bm, verts=bm.verts, cent=(0, 0, 0),
                         matrix=__import__("mathutils").Matrix.Rotation(math.pi / 2, 3, "X"))
        me = bpy.data.meshes.new(f"ArchCut{i}")
        bm.to_mesh(me)
        bm.free()
        c = bpy.data.objects.new(f"ArchCut{i}", me)
        c.location = (ax, 0, WHEEL_R + 0.012)
        cutters.objects.link(c)
        c.parent = body                           # follows the car when it is scaled / spun
        for attr in ("visible_camera", "visible_diffuse", "visible_glossy", "visible_transmission",
                     "visible_volume_scatter", "visible_shadow"):
            setattr(c, attr, False)
        # wheel-well liner
        well = bmesh.new()
        bmesh.ops.create_cone(well, cap_ends=False, segments=64, radius1=WHEEL_R + 0.06,
                              radius2=WHEEL_R + 0.06, depth=1.9)
        bmesh.ops.rotate(well, verts=well.verts, cent=(0, 0, 0),
                         matrix=__import__("mathutils").Matrix.Rotation(math.pi / 2, 3, "X"))
        wm = bpy.data.meshes.new(f"Well{i}")
        well.to_mesh(wm)
        well.free()
        wm.materials.append(dark)
        wo = bpy.data.objects.new(f"Well{i}", wm)
        wo.location = (ax, 0, WHEEL_R + 0.02)
        wo["pbpp_interior"] = True
        bpy.context.scene.collection.objects.link(wo)
        objs.append(wo)
    bo = body.modifiers.new("Arches", "BOOLEAN")
    bo.operation, bo.solver = "DIFFERENCE", "EXACT"
    bo.operand_type, bo.collection = "COLLECTION", cutters
    objs.append(body)

    for ax in (AXLE_F, AXLE_R):
        for side in (-1, 1):
            objs += wheel(f"Wheel{'F' if ax > 0 else 'R'}{'L' if side > 0 else 'R'}",
                          (ax, side * TRACK, WHEEL_R), side, tire_m, rim_m, dark, disc_m)

    # grille: chrome surround + horizontal vanes on a dark backing (generic, no emblem),
    # leaned back to follow the raked nose
    tilt = 0.0
    gz, gw, gh = 0.60, 0.92, 0.30

    def nose_x(z, inset):
        return XF - inset + rake_dx(XF, z)

    def lean(o):
        o.rotation_euler[1] = tilt
        return o

    objs.append(lean(_rbox("GrilleBack", (0.05, gw, gh), (nose_x(gz, 0.0), 0, gz), trim, 0.01)))
    objs.append(lean(_rbox("GrilleTop", (0.06, gw + 0.06, 0.03), (nose_x(gz + gh / 2, -0.035), 0, gz + gh / 2 + 0.015), chrome, 0.012)))
    objs.append(lean(_rbox("GrilleBot", (0.06, gw + 0.06, 0.03), (nose_x(gz - gh / 2, -0.035), 0, gz - gh / 2 - 0.015), chrome, 0.012)))
    for sy in (-1, 1):
        objs.append(lean(_rbox(f"GrilleSide{sy}", (0.06, 0.03, gh + 0.06), (nose_x(gz, -0.035), sy * (gw / 2 + 0.015), gz), chrome, 0.012)))
    for k in range(7):
        z = gz - gh / 2 + gh * (k + 0.5) / 7
        objs.append(lean(_rbox(f"Vane{k}", (0.03, gw, 0.012), (nose_x(z, -0.03), 0, z), chrome, 0.004, 2)))
    # lower intake (gloss black) and chrome bumper blade
    objs.append(_rbox("Intake", (0.05, 1.30, 0.10), (XF - 0.06, 0, 0.30), trim, 0.02))
    objs.append(_rbox("BumperBlade", (0.04, 1.40, 0.018), (XF - 0.03, 0, 0.37), chrome, 0.006))
    for sy in (-1, 1):
        # slim headlamps + LED signature, following the nose curve
        objs.append(lean(_rbox(f"Head{sy}", (0.10, 0.34, 0.085), (nose_x(0.80, 0.11), sy * 0.66, 0.80), lamp, 0.02)))
        objs.append(lean(_rbox(f"HeadLED{sy}", (0.02, 0.28, 0.012), (nose_x(0.83, 0.06), sy * 0.66, 0.83), led, 0.004)))
        objs.append(_rbox(f"Tail{sy}", (0.08, 0.30, 0.06), (XR + 0.05 + rake_dx(XR + 0.02, 0.92), sy * 0.74, 0.92), tail, 0.015))
        # side mirror: pebble-shaped head on a tapered arm from the door sail
        mh = _rbox(f"Mirror{sy}", (0.23, 0.13, 0.135), (X_WS0 - 0.16, sy * 1.055, BELT + 0.13), paint, 0.06, 6)
        ss = mh.modifiers.new("Smooth", "SUBSURF")
        ss.levels = ss.render_levels = 2
        mh.rotation_euler[2] = sy * math.radians(-6)
        objs.append(mh)
        arm = _rbox(f"MirrorArm{sy}", (0.10, 0.12, 0.035), (X_WS0 - 0.13, sy * 0.98, BELT + 0.08), trim, 0.015)
        arm.rotation_euler[0] = sy * math.radians(14)
        objs.append(arm)
        # chrome beltline
        objs.append(_rbox(f"BeltChrome{sy}", (X_WS0 - X_RW1 - 0.25, 0.012, 0.012),
                          ((X_WS0 + X_RW1) / 2 - 0.05, sy * 0.912, BELT + 0.012), chrome, 0.004, 2))
    objs.append(_rbox("RearBlade", (0.03, 1.30, 0.016), (XR + 0.03, 0, 0.55), chrome, 0.006))
    objs += interior()
    for o in objs:
        o["pbpp_car"] = True
    return objs
