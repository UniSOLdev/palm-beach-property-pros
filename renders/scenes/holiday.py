"""
holiday: still image for Holiday Lighting (design, install, takedown).

A fictional Mediterranean Revival estate at blue hour: warm-white bulbs along the rooflines,
spiral-wrapped royal palm trunks with uplights, net lights on the clipped hedges, wreaths
over the arched doors, interiors glowing behind the glass. No text, numbers, or people.

    blender -b -P renders/scenes/holiday.py -- --samples 128 --only 1
    blender -b -P renders/scenes/holiday.py -- --samples 128 --only 1 --res 1080x1350 --out renders/_work/holiday-portrait
    blender -b -P renders/scenes/holiday.py -- --install --samples 256 --only 1,3,5   (scroll sequence)

--install: 100-frame scroll sequence. The estate starts unlit at dusk, then the lights go up in the
order a crew installs them: roofline (sweeping along the eaves), palm wraps (spiralling up the
trunks), hedge nets (front to back), wreaths, then the windows warm up. The camera pushes in slowly.
"""
import math
import random
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))
import bmesh  # noqa: E402
import bpy  # noqa: E402
from mathutils import Vector  # noqa: E402

from common import ASSETS, camera, look_at, parse_args, pbr_textures, render_frames, reset_scene, setup_render, world_sky  # noqa: E402
from procedural import _box, _mat, estate, leafy_hedge, mat_striped_lawn, royal_palm, scatter_on  # noqa: E402

PH = ASSETS / "polyhaven"
def _extra(p):
    p.add_argument("--install", action="store_true", help="animated install sequence (100 frames)")


args = parse_args("holiday", 1, _extra)
INSTALL = args.install
scene = reset_scene()
setup_render(scene, args)
scene.frame_start, scene.frame_end = 1, (100 if INSTALL else 1)
coll = scene.collection
rng = random.Random(12)

# blue hour: sun just below the horizon, deep blue sky with a warm band low in the west
world_sky(scene, sun_elevation_deg=-2.5, sun_rotation_deg=250.0, strength=0.9)

WARM = (1.0, 0.70, 0.40)


def bulb_mat(strength=40.0, keys=None, by_y=None, name="Bulb"):
    """keys: [(frame, progress 0..1)] animating how far along the install has got.
    Each bulb has a 'reveal' order (0..1, mesh attribute) or, with by_y=(y0, y1), its world Y.
    A bulb appears (already lit) once progress passes its order; before that it is not there yet."""
    m = _mat(name)
    nt = m.node_tree
    b = nt.nodes["Principled BSDF"]
    b.inputs["Base Color"].default_value = (*WARM, 1)
    b.inputs["Emission Color"].default_value = (*WARM, 1)
    b.inputs["Emission Strength"].default_value = strength
    if not keys:
        return m
    N, L = nt.nodes, nt.links
    if by_y:
        geo = N.new("ShaderNodeNewGeometry")
        sep = N.new("ShaderNodeSeparateXYZ")
        L.new(geo.outputs["Position"], sep.inputs[0])
        order = N.new("ShaderNodeMapRange")
        order.inputs["From Min"].default_value, order.inputs["From Max"].default_value = by_y
        L.new(sep.outputs["Y"], order.inputs["Value"])
        order_out = order.outputs["Result"]
    else:
        at = N.new("ShaderNodeAttribute")
        at.attribute_name = "reveal"
        order_out = at.outputs["Fac"]
    prog = N.new("ShaderNodeValue")
    prog.label = "Install progress"
    for f, v in keys:
        prog.outputs[0].default_value = v
        prog.outputs[0].keyframe_insert("default_value", frame=f)
    sub = N.new("ShaderNodeMath")
    sub.operation = "SUBTRACT"
    L.new(prog.outputs[0], sub.inputs[0])
    L.new(order_out, sub.inputs[1])
    fac = N.new("ShaderNodeMath")
    fac.operation, fac.use_clamp = "MULTIPLY", True
    fac.inputs[1].default_value = 40.0
    L.new(sub.outputs[0], fac.inputs[0])
    mix = N.new("ShaderNodeMixShader")
    tr = N.new("ShaderNodeBsdfTransparent")
    out = N["Material Output"]
    L.new(fac.outputs[0], mix.inputs[0])
    L.new(tr.outputs[0], mix.inputs[1])
    L.new(b.outputs[0], mix.inputs[2])
    L.new(mix.outputs[0], out.inputs["Surface"])
    return m


def key_energy(light, value, f0, f1):
    """Ramp a light from 0 to value between frames f0 and f1 (install sequence only)."""
    if not INSTALL:
        light.energy = value
        return
    for f, v in ((1, 0.0), (f0, 0.0), (f1, value)):
        light.energy = v
        light.keyframe_insert("energy", frame=f)


# install timeline (frames of 100): roofline, palms, hedges, wreaths, windows
T_ROOF, T_PALM, T_NET, T_WREATH, T_WIN = (12, 40), (34, 64), (56, 76), (68, 80), (64, 92)


BULBS = []  # world positions
ORDER = []  # optional explicit install order (0..1) per bulb; default = order of placement


def string_line(a, b, spacing=0.16, sag=0.0):
    a, b = Vector(a), Vector(b)
    n = max(2, int((b - a).length / spacing))
    for i in range(n + 1):
        t = i / n
        p = a.lerp(b, t)
        p.z -= sag * math.sin(math.pi * t)
        BULBS.append(p)


def flush_bulbs(name="Bulbs", radius=0.022, window=None):
    bm = bmesh.new()
    lay = bm.verts.layers.float.new("reveal")
    n = len(BULBS)
    for i, p in enumerate(BULBS):
        r = bmesh.ops.create_icosphere(bm, subdivisions=1, radius=radius)
        bmesh.ops.translate(bm, verts=r["verts"], vec=p)
        o = ORDER[i] if len(ORDER) == n else i / max(1, n - 1)
        for v in r["verts"]:
            v[lay] = o
    me = bpy.data.meshes.new(name)
    bm.to_mesh(me)
    bm.free()
    keys = [(1, -0.1), (window[0], -0.05), (window[1], 1.05)] if (INSTALL and window) else None
    me.materials.append(bulb_mat(keys=keys, name=name + "Mat"))
    o = bpy.data.objects.new(name, me)
    coll.objects.link(o)
    BULBS.clear()
    ORDER.clear()
    return o


def warm_area(name, loc, rot, size, energy, window=None):
    d = bpy.data.lights.new(name, "AREA")
    d.shape = "RECTANGLE"
    d.size, d.size_y = size
    d.color = WARM
    if window:
        key_energy(d, energy, *window)
    else:
        d.energy = energy
    o = bpy.data.objects.new(name, d)
    o.location = loc
    o.rotation_euler = [math.radians(v) for v in rot]
    o.visible_camera = False
    coll.objects.link(o)


# ---- motor court, verges, hedges, palms, estate (same layout as Chapter 4)
COURT_W, COURT_D = 16.0, 26.0
pm = bpy.data.materials.new("Pavers")
pm.use_nodes = True
if (PH / "tex" / "floor_tiles_08").exists():
    pbr_textures(pm, PH / "tex" / "floor_tiles_08", "floor_tiles_08", tile_m=2.0, tint=(1.04, 0.98, 0.88), bump=0.9)
_box("Court", (COURT_W, COURT_D + 8, 0.1), (0, COURT_D / 2 - 6, -0.05), pm, coll)
if INSTALL:  # the camera starts further back: carry the paving (and lawn) toward the street
    _box("Apron", (COURT_W, 14.0, 0.1), (0, -17.0, -0.05), pm, coll)
lawn = mat_striped_lawn()
hedge_inner = bpy.data.materials.get("HedgeInner") or bpy.data.materials.new("HedgeInner")
hedges = []
for sx in (-1, 1):
    _box(f"Verge{sx}", (8.0, COURT_D + 8, 0.1), (sx * (COURT_W / 2 + 4.0), COURT_D / 2 - 6, -0.07), lawn, coll)
    h = _box(f"Hedge{sx}", (1.2, COURT_D + 4, 2.4), (sx * (COURT_W / 2 + 6.5), COURT_D / 2 - 4, 1.15), hedge_inner, coll)
    leafy_hedge(h, density=650.0, seed=3 + sx)
    hedges.append(h)

EST_Y, EST_W, EST_D, FH = COURT_D - 2.0, 24.0, 12.0, 3.7
estate("Estate", origin=(0.0, EST_Y, 0.0), width=EST_W, depth=EST_D)
# warmer, brighter interiors at dusk
g = bpy.data.materials.get("WindowGlass")
if g:
    gb = g.node_tree.nodes["Principled BSDF"]
    gb.inputs["Emission Color"].default_value = (1.0, 0.66, 0.34, 1)
    es = gb.inputs["Emission Strength"]
    es.default_value = 0.8
    if INSTALL:
        for f, v in ((1, 0.1), (T_WIN[0], 0.1), (T_WIN[1], 0.8)):
            es.default_value = v
            es.keyframe_insert("default_value", frame=f)

# ---- roofline: front eave, side eaves, ridge-less hip corners; wing eave
H = FH * 2
OV = 0.75
fy = EST_Y - OV
string_line((-EST_W / 2 - OV, fy, H - 0.04), (EST_W / 2 + OV, fy, H - 0.04), sag=0.0)
for sx in (-1, 1):
    string_line((sx * (EST_W / 2 + OV), fy, H - 0.04), (sx * (EST_W / 2 + OV), EST_Y + EST_D + OV, H - 0.04))
# string course between floors (front)
string_line((-EST_W / 2, EST_Y - 0.06, FH + 0.02), (EST_W / 2, EST_Y - 0.06, FH + 0.02))
# wing (east)
WX0, WW, WD = EST_W / 2, 9.0, 8.0
string_line((WX0, EST_Y + 2.0 - 0.6, FH - 0.04), (WX0 + WW + 0.6, EST_Y + 2.0 - 0.6, FH - 0.04))
flush_bulbs("RooflineBulbs", window=T_ROOF)
# warm wash the roof lights throw onto the facade
warm_area("EaveGlow", (0, fy - 0.4, H - 0.3), (100, 0, 0), (EST_W, 0.4), 900, window=T_ROOF)
warm_area("CourseGlow", (0, EST_Y - 0.5, FH), (100, 0, 0), (EST_W, 0.3), 380, window=(28, 36))

# ---- palms: spiral-wrapped trunks + uplights
palm_spots = []
for sx in (-1, 1):
    for k in range(4):
        p = royal_palm(f"Palm{sx}{k}", height=12.5 + (k % 2) * 1.5, seed=60 + k * 2 + (sx > 0))
        p.location = (sx * (COURT_W / 2 + 1.6), -1.0 + k * 6.5, 0.0)
        palm_spots.append(p.location.copy())
palm_order = sorted(range(len(palm_spots)), key=lambda j: (palm_spots[j].y, palm_spots[j].x))
for rank, j in enumerate(palm_order):
    base = palm_spots[j]
    start = 0.5 * rank / len(palm_spots)  # stagger: front trunks first
    turns, top = 9, 4.6
    n = int(turns * 26)
    for i in range(n):
        t = i / n
        a = t * turns * 2 * math.pi
        z = 0.35 + t * top
        r = 0.36 - 0.04 * t
        BULBS.append(base + Vector((r * math.cos(a), r * math.sin(a), z)))
        ORDER.append(start + 0.5 * t)
    up = bpy.data.lights.new("Uplight", "SPOT")
    up.spot_size, up.spot_blend, up.color = math.radians(22), 0.6, (1.0, 0.82, 0.62)
    span = T_PALM[1] - T_PALM[0]
    key_energy(up, 180, int(T_PALM[0] + span * (start + 0.4)), int(T_PALM[0] + span * (start + 0.5)))
    uo = bpy.data.objects.new("Uplight", up)
    uo.location = base + Vector((0.0, -0.9, 0.05))
    uo.rotation_euler = (math.radians(-12), 0, 0)
    coll.objects.link(uo)
flush_bulbs("PalmWrapBulbs", radius=0.018, window=T_PALM)

# ---- net lights on the hedges (instanced warm points over the leaves)
pt = bpy.data.objects.get("NetBulb")
if pt is None:
    bm = bmesh.new()
    bmesh.ops.create_icosphere(bm, subdivisions=1, radius=0.016)
    me = bpy.data.meshes.new("NetBulb")
    bm.to_mesh(me)
    bm.free()
    nkeys = [(1, -0.1), (T_NET[0], -0.05), (T_NET[1], 1.05)] if INSTALL else None
    me.materials.append(bulb_mat(28.0, keys=nkeys, by_y=(-8.0, 26.0), name="NetBulbMat"))
    pt = bpy.data.objects.new("NetBulb", me)
    coll.objects.link(pt)
    pt.hide_render = True
    pt.location.z = -500
for i, h in enumerate(hedges):
    scatter_on(h, pt, density=26.0, seed=40 + i, name="NetLights")

# ---- wreaths over the ground-floor arches (leaf-scattered torus + a few warm bulbs)
leaf_proto = bpy.data.objects.get("HedgeLeafProto")
bays = max(3, int(EST_W // 4.2))
pitch = EST_W / bays
for i in range(bays):
    x = -EST_W / 2 + pitch * (i + 0.5)
    bpy.ops.mesh.primitive_torus_add(major_radius=0.36, minor_radius=0.09, location=(x, EST_Y - 0.12, 2.15),
                                     rotation=(math.radians(90), 0, 0))
    w = bpy.context.active_object
    w.name = f"Wreath{i}"
    w.data.materials.append(hedge_inner)
    if leaf_proto:
        scatter_on(w, leaf_proto, density=2600.0, seed=70 + i, name="Leaves")
    for k in range(10):
        a = 2 * math.pi * k / 10
        BULBS.append(Vector((x + 0.36 * math.cos(a), EST_Y - 0.22, 2.15 + 0.36 * math.sin(a))))
flush_bulbs("WreathBulbs", radius=0.016, window=T_WREATH)

# ---- camera: low across the motor court toward the lit facade
cam = camera(lens=26, location=(0.0, -8.5, 1.5), target=(0.0, EST_Y, 4.6))
if INSTALL:
    # slow push in across the motor court while the lights go up.
    # Portrait renders (phones) use a wider lens and aim higher so palms and hedges stay in shot.
    portrait = scene.render.resolution_y > scene.render.resolution_x
    path = ((1, (0.0, -11.0, 1.4)), (100, (0.0, -6.0, 1.6))) if portrait else ((1, (0.0, -13.0, 1.3)), (100, (0.0, -8.0, 1.6)))
    aim = (0.0, EST_Y, 10.5) if portrait else (0.0, EST_Y, 4.6)
    if portrait:
        cam.data.lens = 19
    for f, loc in path:
        cam.location = loc
        look_at(cam, aim)
        cam.keyframe_insert("location", frame=f)
        cam.keyframe_insert("rotation_euler", frame=f)
render_frames(scene, args)
