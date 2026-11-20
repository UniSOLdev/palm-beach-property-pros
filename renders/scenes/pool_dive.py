"""
pool-dive: Chapter 1 of "The Dive" scroll story.

Golden hour over a Palm Beach estate pool: stone deck, glass mosaic, clipped hedges.
Fallen leaves drift toward the skimmer as the pool "cleans itself"; the camera dives
through the surface into crystal water with caustics, and the chapter ends in a curtain
of bubbles (the seamless cut to Chapter 2).

    blender -b -P renders/scenes/pool_dive.py -- --preview --only 1,60,100,140
    blender -b -P renders/scenes/pool_dive.py -- --estate estate.blend   # optional backdrop model

Uses CC0 Poly Haven assets from renders/_work/assets/polyhaven/ when present
(HDRI kloppenheim_06_puresky, textures floor_tiles_08 and marble_mosaic_tiles);
falls back to procedural materials and the Blender sky otherwise.
"""
import math
import random
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))
import bpy  # noqa: E402
from mathutils import Vector  # noqa: E402

from common import (  # noqa: E402
    ASSETS, camera, import_model, normalize, parse_args, pbr_textures, render_frames,
    reset_scene, setup_render, sun_light, world_hdri, world_sky,
)
from procedural import estate, royal_palm  # noqa: E402

PH = ASSETS / "polyhaven"
DEFAULT_HDRI = PH / "hdri" / "kloppenheim_06_puresky_4k.exr"


def extra(p):
    p.add_argument("--estate", default=None, help="optional estate model framing the pool")
    p.add_argument("--no-hedge", action="store_true")
    p.add_argument("--no-bubbles", action="store_true")


args = parse_args("pool-dive", 150, extra)
scene = reset_scene()
setup_render(scene, args)
scene.cycles.volume_bounces = 2
n = args.frames
scene.frame_start, scene.frame_end = 1, n

# ---- light: HDRI sky rotated so its sun sits south-west (camera-left, behind), lighting the
# estate facade; matching warm sun lamp at 14 deg elevation.
SUN_PSI, SUN_THETA = -30.0, 76.0
hdri = args.hdri or (str(DEFAULT_HDRI) if DEFAULT_HDRI.exists() else None)
if hdri:
    world_hdri(scene, hdri, strength=0.9, rotation_deg=-100.5)
else:
    world_sky(scene, sun_elevation_deg=14.0, sun_rotation_deg=240.0, strength=0.5)
sun = sun_light("Sun", (SUN_THETA, 0, SUN_PSI), strength=4.5, color=(1.0, 0.80, 0.58), angle_deg=0.6)
_ps, _ts = math.radians(SUN_PSI), math.radians(SUN_THETA)
SUN_DIR = Vector((math.sin(_ps) * math.sin(_ts), -math.cos(_ps) * math.sin(_ts), math.cos(_ts)))

POOL_L, POOL_W, DEPTH = 14.0, 6.0, 1.8
WATER_Z = -0.06
DECK = 7.0


def nodes_(m):
    return m.node_tree.nodes, m.node_tree.links


def new_mat(name):
    m = bpy.data.materials.new(name)
    m.use_nodes = True
    return m


# --------------------------------------------------------------------------- materials
def mat_deck():
    m = new_mat("DeckStone")
    tex = PH / "tex" / "floor_tiles_08"
    if tex.exists():
        pbr_textures(m, tex, "floor_tiles_08", tile_m=2.4, tint=(1.0, 0.95, 0.86), bump=0.8)
    else:
        b = m.node_tree.nodes["Principled BSDF"]
        b.inputs["Base Color"].default_value = (0.72, 0.66, 0.56, 1)
        b.inputs["Roughness"].default_value = 0.55
    return m


def mat_mosaic():
    """Glass mosaic, 2.5 cm tesserae in pale aqua / white with the odd deeper aqua, laid with
    triplanar coordinates so floor and walls both tile correctly."""
    m = new_mat("Mosaic")
    N, L = nodes_(m)
    b = N["Principled BSDF"]
    geo = N.new("ShaderNodeNewGeometry")
    sp = N.new("ShaderNodeSeparateXYZ")
    sn = N.new("ShaderNodeSeparateXYZ")
    L.new(geo.outputs["Position"], sp.inputs[0])
    L.new(geo.outputs["Normal"], sn.inputs[0])

    def comb(a, c):
        v = N.new("ShaderNodeCombineXYZ")
        L.new(sp.outputs[a], v.inputs["X"])
        L.new(sp.outputs[c], v.inputs["Y"])
        return v.outputs[0]

    def facing(axis):
        ab = N.new("ShaderNodeMath")
        ab.operation = "ABSOLUTE"
        L.new(sn.outputs[axis], ab.inputs[0])
        gt = N.new("ShaderNodeMath")
        gt.operation = "GREATER_THAN"
        gt.inputs[1].default_value = 0.5
        L.new(ab.outputs[0], gt.inputs[0])
        return gt.outputs[0]

    def vmix(fac, a, c):
        mx = N.new("ShaderNodeMix")
        mx.data_type = "VECTOR"
        L.new(fac, mx.inputs["Factor"])
        L.new(a, mx.inputs[4])
        L.new(c, mx.inputs[5])
        return mx.outputs[1]

    vec = vmix(facing("Z"), vmix(facing("X"), comb("X", "Z"), comb("Y", "Z")), comb("X", "Y"))
    brick = N.new("ShaderNodeTexBrick")
    brick.offset = 0.0
    brick.squash = 1.0
    L.new(vec, brick.inputs["Vector"])
    brick.inputs["Scale"].default_value = 20.0
    brick.inputs["Brick Width"].default_value = 0.5
    brick.inputs["Row Height"].default_value = 0.5
    brick.inputs["Mortar Size"].default_value = 0.035
    brick.inputs["Mortar Smooth"].default_value = 0.3
    brick.inputs["Bias"].default_value = 0.35
    brick.inputs["Color1"].default_value = (0.12, 0.52, 0.68, 1)
    brick.inputs["Color2"].default_value = (0.66, 0.90, 0.96, 1)
    brick.inputs["Mortar"].default_value = (0.82, 0.84, 0.82, 1)
    L.new(brick.outputs["Color"], b.inputs["Base Color"])
    b.inputs["Roughness"].default_value = 0.07
    bump = N.new("ShaderNodeBump")
    bump.inputs["Strength"].default_value = 0.5
    bump.inputs["Distance"].default_value = 0.004
    bump.invert = True
    L.new(brick.outputs["Fac"], bump.inputs["Height"])
    L.new(bump.outputs["Normal"], b.inputs["Normal"])
    return m


def caustic_light(receivers):
    """Animated caustic gobo: a distant narrow spot along the sun direction that lights only
    the pool shell (light linking), so the pattern respects the deck and hedge shadows."""
    dist = 80.0
    data = bpy.data.lights.new("Caustics", "SPOT")
    data.energy = 1.4e5
    data.color = (1.0, 0.88, 0.70)
    data.spot_size = math.radians(16)
    data.spot_blend = 0.3
    data.shadow_soft_size = 0.0
    data.use_nodes = True
    N, L = data.node_tree.nodes, data.node_tree.links
    em = N["Emission"]
    tc = N.new("ShaderNodeTexCoord")
    layers = []
    for sc, w_end in ((150.0, 3.0), (205.0, -2.4)):
        vor = N.new("ShaderNodeTexVoronoi")
        vor.voronoi_dimensions = "4D"
        vor.feature = "DISTANCE_TO_EDGE"
        vor.inputs["Scale"].default_value = sc
        L.new(tc.outputs["Normal"], vor.inputs["Vector"])
        vor.inputs["W"].default_value = 0.0
        vor.inputs["W"].keyframe_insert("default_value", frame=1)
        vor.inputs["W"].default_value = w_end
        vor.inputs["W"].keyframe_insert("default_value", frame=n)
        mr = N.new("ShaderNodeMapRange")
        mr.inputs["From Max"].default_value = 0.08
        mr.inputs["To Min"].default_value = 1.0
        mr.inputs["To Max"].default_value = 0.0
        L.new(vor.outputs["Distance"], mr.inputs["Value"])
        layers.append(mr.outputs["Result"])
    add = N.new("ShaderNodeMath")
    add.operation = "ADD"
    L.new(layers[0], add.inputs[0])
    L.new(layers[1], add.inputs[1])
    pw = N.new("ShaderNodeMath")
    pw.operation = "POWER"
    pw.inputs[1].default_value = 1.6
    L.new(add.outputs[0], pw.inputs[0])
    L.new(pw.outputs[0], em.inputs["Strength"])
    obj = bpy.data.objects.new("Caustics", data)
    scene.collection.objects.link(obj)
    center = Vector((0, 0, -DEPTH / 2))
    obj.location = center + SUN_DIR * dist
    obj.rotation_euler = (-SUN_DIR).to_track_quat("-Z", "Y").to_euler()
    obj.light_linking.receiver_collection = receivers
    return obj


def mat_coping():
    m = new_mat("Coping")
    tex = PH / "tex" / "floor_tiles_08"
    if tex.exists():
        pbr_textures(m, tex, "floor_tiles_08", tile_m=1.2, coords="BOX", tint=(1.04, 0.99, 0.90), bump=0.4)
    return m


def mat_water_surface():
    m = new_mat("PoolSurface")
    b = m.node_tree.nodes["Principled BSDF"]
    b.inputs["Base Color"].default_value = (0.92, 1.0, 1.0, 1)
    b.inputs["Roughness"].default_value = 0.015
    b.inputs["IOR"].default_value = 1.333
    for key in ("Transmission Weight", "Transmission"):
        if key in b.inputs:
            b.inputs[key].default_value = 1.0
            break
    return m


def mat_water_volume():
    m = new_mat("PoolVolume")
    N, L = nodes_(m)
    N.remove(N["Principled BSDF"])
    vol = N.new("ShaderNodeVolumePrincipled")
    vol.inputs["Color"].default_value = (0.70, 0.95, 0.97, 1)
    vol.inputs["Density"].default_value = 0.012
    vol.inputs["Absorption Color"].default_value = (0.62, 0.92, 0.94, 1)
    L.new(vol.outputs["Volume"], N["Material Output"].inputs["Volume"])
    return m


def mat_hedge():
    """Clipped ficus hedge: dense small-leaf micro-structure via Voronoi, SSS translucency."""
    m = new_mat("Hedge")
    N, L = nodes_(m)
    b = N["Principled BSDF"]
    tc = N.new("ShaderNodeTexCoord")
    vor = N.new("ShaderNodeTexVoronoi")
    vor.inputs["Scale"].default_value = 38
    L.new(tc.outputs["Object"], vor.inputs["Vector"])
    noise = N.new("ShaderNodeTexNoise")
    noise.inputs["Scale"].default_value = 3
    L.new(tc.outputs["Object"], noise.inputs["Vector"])
    ramp = N.new("ShaderNodeValToRGB")
    ramp.color_ramp.elements[0].color = (0.020, 0.045, 0.012, 1)
    ramp.color_ramp.elements[1].color = (0.085, 0.16, 0.035, 1)
    mixf = N.new("ShaderNodeMath")
    mixf.operation = "MULTIPLY"
    L.new(vor.outputs["Color"], mixf.inputs[0])
    L.new(noise.outputs["Fac"], mixf.inputs[1])
    L.new(mixf.outputs[0], ramp.inputs["Fac"])
    L.new(ramp.outputs["Color"], b.inputs["Base Color"])
    bump = N.new("ShaderNodeBump")
    bump.inputs["Strength"].default_value = 0.9
    bump.inputs["Distance"].default_value = 0.03
    L.new(vor.outputs["Distance"], bump.inputs["Height"])
    L.new(bump.outputs["Normal"], b.inputs["Normal"])
    b.inputs["Roughness"].default_value = 0.45
    if "Subsurface Weight" in b.inputs:
        b.inputs["Subsurface Weight"].default_value = 0.25
    return m


def mat_leaf():
    """Fallen sea-grape / ficus leaves: olive to straw to brown per object, backlit translucency."""
    m = new_mat("Leaf")
    N, L = nodes_(m)
    b = N["Principled BSDF"]
    oi = N.new("ShaderNodeObjectInfo")
    ramp = N.new("ShaderNodeValToRGB")
    els = ramp.color_ramp.elements
    els[0].position, els[0].color = 0.0, (0.16, 0.20, 0.05, 1)
    els[1].position, els[1].color = 1.0, (0.22, 0.12, 0.045, 1)
    mid = els.new(0.55)
    mid.color = (0.42, 0.32, 0.10, 1)
    L.new(oi.outputs["Random"], ramp.inputs["Fac"])
    L.new(ramp.outputs["Color"], b.inputs["Base Color"])
    b.inputs["Roughness"].default_value = 0.38
    if "Subsurface Weight" in b.inputs:
        b.inputs["Subsurface Weight"].default_value = 0.3
    return m


# --------------------------------------------------------------------------- geometry
def box(name, size, loc, mat, bevel=0.0):
    bpy.ops.mesh.primitive_cube_add(location=loc)
    o = bpy.context.active_object
    o.name, o.scale = name, (size[0] / 2, size[1] / 2, size[2] / 2)
    bpy.ops.object.transform_apply(scale=True)
    o.data.materials.append(mat)
    if bevel:
        bv = o.modifiers.new("Bevel", "BEVEL")
        bv.width, bv.segments = bevel, 4
        bpy.ops.object.shade_smooth()
        bv.harden_normals = True
    return o


mosaic, deck_m, coping = mat_mosaic(), mat_deck(), mat_coping()
shell = [box("PoolFloor", (POOL_L, POOL_W, 0.2), (0, 0, -DEPTH - 0.1), mosaic)]
for name, size, loc in (
    ("WallN", (POOL_L, 0.2, DEPTH), (0, POOL_W / 2 + 0.1, -DEPTH / 2)),
    ("WallS", (POOL_L, 0.2, DEPTH), (0, -POOL_W / 2 - 0.1, -DEPTH / 2)),
    ("WallE", (0.2, POOL_W, DEPTH), (POOL_L / 2 + 0.1, 0, -DEPTH / 2)),
    ("WallW", (0.2, POOL_W, DEPTH), (-POOL_L / 2 - 0.1, 0, -DEPTH / 2)),
):
    shell.append(box(name, size, loc, mosaic))
shell_coll = bpy.data.collections.new("PoolShell")
for o in shell:
    shell_coll.objects.link(o)
caustic_light(shell_coll)

# deck with the pool cut out, plus a 40 cm coping band around the edge
C = 0.4
box("DeckN", (POOL_L + 2 * DECK, DECK - C, 0.3), (0, POOL_W / 2 + C + (DECK - C) / 2, -0.15), deck_m)
# south terrace runs 12 m further so the opening camera stands on stone, not lawn
SOUTH = DECK - C + 12.0
box("DeckS", (POOL_L + 2 * DECK, SOUTH, 0.3), (0, -POOL_W / 2 - C - SOUTH / 2, -0.15), deck_m)
box("DeckE", (DECK - C, POOL_W + 2 * C, 0.3), (POOL_L / 2 + C + (DECK - C) / 2, 0, -0.15), deck_m)
box("DeckW", (DECK - C, POOL_W + 2 * C, 0.3), (-POOL_L / 2 - C - (DECK - C) / 2, 0, -0.15), deck_m)
for name, size, loc in (
    ("CopN", (POOL_L + 2 * C, C, 0.06), (0, POOL_W / 2 + C / 2, 0.03)),
    ("CopS", (POOL_L + 2 * C, C, 0.06), (0, -POOL_W / 2 - C / 2, 0.03)),
    ("CopE", (C, POOL_W, 0.06), (POOL_L / 2 + C / 2, 0, 0.03)),
    ("CopW", (C, POOL_W, 0.06), (-POOL_L / 2 - C / 2, 0, 0.03)),
):
    box(name, size, loc, coping, bevel=0.025)

# clipped hedges framing the deck (low enough to keep the sky in frame) + lawn beyond
if not args.no_hedge:
    hedge = mat_hedge()
    HX, HY, HH, HT = POOL_L / 2 + DECK + 0.5, POOL_W / 2 + DECK + 0.5, 3.0, 1.2
    for name, size, loc in (
        ("HedgeE", (HT, 2 * HY, HH), (HX, 0, HH / 2 - 0.3)),
        ("HedgeW", (HT, 2 * HY, HH), (-HX, 0, HH / 2 - 0.3)),
    ):
        box(name, size, loc, hedge, bevel=0.12)
    # lawn ring OUTSIDE the deck only (a full plane would slice through the pool)
    lm = new_mat("Lawn")
    lb = lm.node_tree.nodes["Principled BSDF"]
    lb.inputs["Base Color"].default_value = (0.05, 0.09, 0.025, 1)
    lb.inputs["Roughness"].default_value = 0.85
    OX, OY, R = POOL_L / 2 + DECK, POOL_W / 2 + DECK, 200.0
    for name, size, loc in (
        ("LawnN", (2 * R, R - OY, 0.02), (0, (R + OY) / 2, -0.31)),
        ("LawnS", (2 * R, R - OY - 12.0, 0.02), (0, -(R + OY + 12.0) / 2, -0.31)),
        ("LawnE", (R - OX, 2 * OY, 0.02), ((R + OX) / 2, 0, -0.31)),
        ("LawnW", (R - OX, 2 * OY, 0.02), (-(R + OX) / 2, 0, -0.31)),
    ):
        box(name, size, loc, lm)

# ---- water: displaced refractive surface (real wave geometry) + clear volume
bpy.ops.mesh.primitive_grid_add(x_subdivisions=280, y_subdivisions=120, size=1, location=(0, 0, WATER_Z))
surf = bpy.context.active_object
surf.name = "WaterSurface"
surf.scale = (POOL_L, POOL_W, 1)
bpy.ops.object.transform_apply(scale=True)
surf.data.materials.append(mat_water_surface())
ocean = surf.modifiers.new("Ripples", "OCEAN")
ocean.geometry_mode = "DISPLACE"
ocean.spatial_size = 6
ocean.resolution = 10
ocean.wind_velocity = 2.2
ocean.wave_scale = 0.012
ocean.choppiness = 0.2
ocean.time = 1.0
ocean.keyframe_insert("time", frame=1)
ocean.time = 1.0 + n / 24 * 0.8
ocean.keyframe_insert("time", frame=n)
bpy.ops.object.shade_smooth()
# Sunlight passes the surface for shadow rays; the shader caustics stand in for the
# refracted light pattern (true refractive caustics are far too noisy at 256 spp).
surf.visible_shadow = False

vol = box("WaterVolume", (POOL_L - 0.02, POOL_W - 0.02, DEPTH - 0.06),
          (0, 0, -DEPTH / 2 + WATER_Z / 2 - 0.03), mat_water_volume())
vol.visible_shadow = False

if args.estate:
    est = import_model(args.estate)
    root = normalize(est, 34.0, "Estate")
    root.location.y += POOL_W / 2 + DECK + 8
else:
    # fictional Mediterranean Revival house closing the north side of the terrace
    estate("Estate", origin=(-1.5, POOL_W / 2 + DECK, -0.3), width=26.0, depth=13.0)

# royal palms lining both long sides of the deck (three instanced variants)
palm_variants = [royal_palm(f"PalmV{i}", height=h, seed=s_)
                 for i, (h, s_) in enumerate(((13.5, 3), (15.0, 8), (12.5, 11)))]
for v in palm_variants:
    v.hide_render = True
    v.location.z = -200
prng = random.Random(21)
spots = [(sx * (POOL_L / 2 + 3.6), y) for sx in (-1, 1) for y in (-4.0, 1.5, 7.0)] + [(-12.5, 8.5), (11.5, 8.5)]
for k, (x, y) in enumerate(spots):
    src = palm_variants[k % len(palm_variants)]
    p = bpy.data.objects.new(f"Palm{k}", src.data)
    scene.collection.objects.link(p)
    p.location = (x + prng.uniform(-0.3, 0.3), y + prng.uniform(-0.3, 0.3), -0.3)
    p.rotation_euler[2] = prng.uniform(0, math.tau)


# ---- fallen leaves drift toward the skimmer and are drawn under (the pool "cleans itself")
def leaf_mesh(name, length, width, curl):
    bpy.ops.mesh.primitive_grid_add(x_subdivisions=12, y_subdivisions=4, size=1)
    o = bpy.context.active_object
    o.name = name
    for v in o.data.vertices:
        u = v.co.x + 0.5  # 0..1 along the leaf
        prof = math.sin(math.pi * min(max(u, 0), 1)) ** 0.75
        y = v.co.y * 2 * width * prof
        v.co.x = (u - 0.5) * length
        v.co.y = y
        v.co.z = curl * (abs(y) / max(width, 1e-6)) ** 2 + 0.25 * curl * math.sin(math.pi * u)
    o.data.update()
    bpy.ops.object.shade_smooth()
    return o


leaf_m = mat_leaf()
protos = [leaf_mesh(f"LeafProto{i}", L_, W_, c_) for i, (L_, W_, c_) in enumerate(
    ((0.11, 0.035, 0.008), (0.09, 0.045, 0.01), (0.14, 0.03, 0.006), (0.075, 0.04, 0.012)))]
for p in protos:
    p.data.materials.append(leaf_m)
    p.hide_render = True
    p.location.z = -50
rng = random.Random(7)
SKIM_X = -POOL_L / 2 + 0.3
for i in range(70):
    leaf = bpy.data.objects.new(f"Leaf{i}", rng.choice(protos).data)
    scene.collection.objects.link(leaf)
    leaf.location = (rng.uniform(-5.5, 6.0), rng.uniform(-2.5, 2.5), WATER_Z + 0.004)
    leaf.rotation_euler = (rng.uniform(-0.08, 0.08), rng.uniform(-0.08, 0.08), rng.uniform(0, math.tau))
    s = rng.uniform(0.8, 1.25)
    leaf.scale = (s, s, s)
    start = 1 + int(n * rng.uniform(0.02, 0.25))
    end = start + int(n * rng.uniform(0.18, 0.32))
    leaf.keyframe_insert("location", frame=start)
    leaf.keyframe_insert("rotation_euler", frame=start)
    leaf.keyframe_insert("scale", frame=end - 6)
    leaf.location = (SKIM_X + rng.uniform(-0.1, 0.4), leaf.location.y * 0.35, WATER_Z + 0.004)
    leaf.rotation_euler[2] += rng.uniform(-1.2, 1.2)
    leaf.keyframe_insert("location", frame=end)
    leaf.keyframe_insert("rotation_euler", frame=end)
    leaf.scale = (0.0, 0.0, 0.0)
    leaf.keyframe_insert("scale", frame=end)

# ---- camera: low golden-hour view -> glide down -> break the surface -> underwater -> bubbles
cam = camera(lens=26, location=(-14.0, -17.0, 3.4), target=(0.0, 4.0, 4.2))
cam.data.clip_start = 0.02
target = bpy.data.objects.new("CamTarget", None)
scene.collection.objects.link(target)
tc = cam.constraints.new("TRACK_TO")
tc.target = target
tc.track_axis, tc.up_axis = "TRACK_NEGATIVE_Z", "UP_Y"
path = [
    (0.00, (-14.0, -17.0, 3.4), (0.0, 4.0, 4.2)),
    (0.45, (-7.0, -2.6, 1.1), (2.0, 0.6, -0.6)),
    (0.62, (-3.6, -0.9, 0.12), (2.5, 0.5, -0.9)),    # skimming the surface
    (0.70, (-2.4, -0.5, -0.40), (3.5, 0.4, -1.0)),   # through the surface
    (1.00, (3.5, 0.1, -1.0), (8.0, 0.3, -1.1)),      # gliding along the mosaic floor
]
for frac, loc, look in path:
    f = 1 + round(frac * (n - 1))
    cam.location = loc
    cam.keyframe_insert("location", frame=f)
    target.location = look
    target.keyframe_insert("location", frame=f)

# ---- bubble curtain for the final 20% (seamless transition to the next chapter)
bubble_mat = new_mat("Bubble")
bb = bubble_mat.node_tree.nodes["Principled BSDF"]
bb.inputs["Base Color"].default_value = (1, 1, 1, 1)
bb.inputs["Roughness"].default_value = 0.0
bb.inputs["IOR"].default_value = 1.0 / 1.333
for key in ("Transmission Weight", "Transmission"):
    if key in bb.inputs:
        bb.inputs[key].default_value = 1.0
        break
bpy.ops.mesh.primitive_uv_sphere_add(radius=1, segments=16, ring_count=8, location=(0, 0, -50))
proto = bpy.context.active_object
proto.name = "BubbleProto"
proto.data.materials.append(bubble_mat)
bpy.ops.object.shade_smooth()
bpy.ops.mesh.primitive_plane_add(size=3.0, location=(4.6, 0.1, -1.75))
emit = bpy.context.active_object
emit.name = "BubbleEmitter"
ps = emit.modifiers.new("Bubbles", "PARTICLE_SYSTEM").particle_system.settings
emit.show_instancer_for_render = False  # hide the emitter plane, keep its particles
ps.count = 0 if args.no_bubbles else 1600
ps.frame_start = 1 + round(0.80 * (n - 1))
ps.frame_end = n
ps.lifetime = 60
ps.effector_weights.gravity = -0.5
ps.normal_factor = 0.9
ps.factor_random = 0.5
ps.render_type = "OBJECT"
ps.instance_object = proto
ps.particle_size = 0.03
ps.size_random = 0.85

render_frames(scene, args)
