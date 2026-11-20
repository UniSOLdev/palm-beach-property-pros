"""
pool-dive: Chapter 1 of "The Dive" scroll story.

Golden hour over a Palm Beach estate pool: travertine coping, blue-and-white glass
mosaic, palm-frond shadows. Fallen fronds and leaves drift away and dissolve as the
pool "cleans itself"; the camera dives through the surface into crystal water with
caustics, and the chapter ends in a curtain of bubbles (the seamless cut to Chapter 2).

    blender -b -P renders/scenes/pool_dive.py -- --preview --only 1,60,100,140
    blender -b -P renders/scenes/pool_dive.py -- --estate estate.blend   # optional backdrop model
"""
import math
import random
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))
import bpy  # noqa: E402
from mathutils import Vector  # noqa: E402

from common import (  # noqa: E402
    camera, import_model, linear_keys, normalize, parse_args, render_frames, reset_scene,
    setup_render, sun_light, world_sky,
)


def extra(p):
    p.add_argument("--estate", default=None, help="optional estate model framing the pool")


args = parse_args("pool-dive", 150, extra)
scene = reset_scene()
setup_render(scene, args)
scene.cycles.volume_bounces = 2
world_sky(scene, sun_elevation_deg=14.0, sun_rotation_deg=240.0, strength=0.5)
sun = sun_light("Sun", (70, 0, 240), strength=3.2, color=(1.0, 0.84, 0.64), angle_deg=0.8)

POOL_L, POOL_W, DEPTH = 14.0, 6.0, 1.8
nodes_ = lambda m: (m.node_tree.nodes, m.node_tree.links)  # noqa: E731


def mat_travertine():
    m = bpy.data.materials.new("Travertine")
    m.use_nodes = True
    N, L = nodes_(m)
    b = N["Principled BSDF"]
    noise = N.new("ShaderNodeTexNoise")
    noise.inputs["Scale"].default_value = 18
    noise.inputs["Detail"].default_value = 12
    ramp = N.new("ShaderNodeValToRGB")
    ramp.color_ramp.elements[0].color = (0.58, 0.50, 0.40, 1)
    ramp.color_ramp.elements[1].color = (0.74, 0.68, 0.58, 1)
    L.new(noise.outputs["Fac"], ramp.inputs["Fac"])
    L.new(ramp.outputs["Color"], b.inputs["Base Color"])
    bump = N.new("ShaderNodeBump")
    bump.inputs["Strength"].default_value = 0.25
    L.new(noise.outputs["Fac"], bump.inputs["Height"])
    L.new(bump.outputs["Normal"], b.inputs["Normal"])
    b.inputs["Roughness"].default_value = 0.55
    return m


def mat_mosaic():
    """Small glass mosaic: mixed pale aqua / white / deep blue tesserae."""
    m = bpy.data.materials.new("Mosaic")
    m.use_nodes = True
    N, L = nodes_(m)
    b = N["Principled BSDF"]
    brick = N.new("ShaderNodeTexBrick")
    brick.offset = 0.0
    brick.inputs["Scale"].default_value = 60
    brick.inputs["Mortar Size"].default_value = 0.012
    brick.inputs["Brick Width"].default_value = 0.5
    brick.inputs["Row Height"].default_value = 0.5
    brick.inputs["Color1"].default_value = (0.55, 0.80, 0.85, 1)
    brick.inputs["Color2"].default_value = (0.86, 0.94, 0.95, 1)
    brick.inputs["Mortar"].default_value = (0.9, 0.9, 0.88, 1)
    L.new(brick.outputs["Color"], b.inputs["Base Color"])
    b.inputs["Roughness"].default_value = 0.12
    bump = N.new("ShaderNodeBump")
    bump.inputs["Strength"].default_value = 0.4
    bump.invert = True
    L.new(brick.outputs["Fac"], bump.inputs["Height"])
    L.new(bump.outputs["Normal"], b.inputs["Normal"])
    return m


def mat_water_surface():
    m = bpy.data.materials.new("PoolSurface")
    m.use_nodes = True
    N, L = nodes_(m)
    b = N["Principled BSDF"]
    b.inputs["Base Color"].default_value = (0.8, 0.97, 1.0, 1)
    b.inputs["Roughness"].default_value = 0.0
    b.inputs["IOR"].default_value = 1.333
    for key in ("Transmission Weight", "Transmission"):
        if key in b.inputs:
            b.inputs[key].default_value = 1.0
            break
    wave = N.new("ShaderNodeTexWave")
    wave.wave_type = "RINGS"
    wave.inputs["Scale"].default_value = 1.6
    wave.inputs["Distortion"].default_value = 6
    wave.inputs["Detail"].default_value = 4
    noise = N.new("ShaderNodeTexNoise")
    noise.inputs["Scale"].default_value = 3.0
    mix = N.new("ShaderNodeMath")
    mix.operation = "ADD"
    L.new(wave.outputs["Fac"], mix.inputs[0])
    L.new(noise.outputs["Fac"], mix.inputs[1])
    bump = N.new("ShaderNodeBump")
    bump.inputs["Strength"].default_value = 0.08
    L.new(mix.outputs[0], bump.inputs["Height"])
    L.new(bump.outputs["Normal"], b.inputs["Normal"])
    # animate ripple phase
    coord = N.new("ShaderNodeTexCoord")
    mapping = N.new("ShaderNodeMapping")
    L.new(coord.outputs["Object"], mapping.inputs["Vector"])
    L.new(mapping.outputs["Vector"], wave.inputs["Vector"])
    L.new(mapping.outputs["Vector"], noise.inputs["Vector"])
    mapping.inputs["Location"].default_value[0] = 0
    mapping.inputs["Location"].keyframe_insert("default_value", index=0, frame=1)
    mapping.inputs["Location"].default_value[0] = 1.2
    mapping.inputs["Location"].keyframe_insert("default_value", index=0, frame=args.frames)
    return m


def mat_water_volume():
    m = bpy.data.materials.new("PoolVolume")
    m.use_nodes = True
    N, L = nodes_(m)
    N.remove(N["Principled BSDF"])
    vol = N.new("ShaderNodeVolumePrincipled")
    vol.inputs["Color"].default_value = (0.55, 0.88, 0.92, 1)
    vol.inputs["Density"].default_value = 0.035
    vol.inputs["Absorption Color"].default_value = (0.35, 0.82, 0.88, 1)
    L.new(vol.outputs["Volume"], N["Material Output"].inputs["Volume"])
    return m


def caustics_on(light):
    """Animated caustic gobo: Voronoi edge pattern modulates the sun on the pool floor."""
    light.data.use_nodes = True
    N, L = light.data.node_tree.nodes, light.data.node_tree.links
    em = N["Emission"]
    coord = N.new("ShaderNodeTexCoord")
    vor = N.new("ShaderNodeTexVoronoi")
    vor.voronoi_dimensions = "4D"
    vor.feature = "DISTANCE_TO_EDGE"
    vor.inputs["Scale"].default_value = 6.0
    ramp = N.new("ShaderNodeValToRGB")
    ramp.color_ramp.elements[0].position = 0.0
    ramp.color_ramp.elements[0].color = (4.0, 4.0, 4.0, 1)
    ramp.color_ramp.elements[1].position = 0.08
    ramp.color_ramp.elements[1].color = (0.55, 0.55, 0.55, 1)
    L.new(coord.outputs["Normal"], vor.inputs["Vector"])
    L.new(vor.outputs["Distance"], ramp.inputs["Fac"])
    L.new(ramp.outputs["Color"], em.inputs["Color"])
    vor.inputs["W"].default_value = 0
    vor.inputs["W"].keyframe_insert("default_value", frame=1)
    vor.inputs["W"].default_value = 3
    vor.inputs["W"].keyframe_insert("default_value", frame=args.frames)


# ---- pool shell
def box(name, size, loc, mat):
    bpy.ops.mesh.primitive_cube_add(location=loc)
    o = bpy.context.active_object
    o.name, o.scale = name, (size[0] / 2, size[1] / 2, size[2] / 2)
    o.data.materials.append(mat)
    return o


mosaic, trav = mat_mosaic(), mat_travertine()
box("PoolFloor", (POOL_L, POOL_W, 0.2), (0, 0, -DEPTH - 0.1), mosaic)
for name, size, loc in (
    ("WallN", (POOL_L, 0.2, DEPTH), (0, POOL_W / 2 + 0.1, -DEPTH / 2)),
    ("WallS", (POOL_L, 0.2, DEPTH), (0, -POOL_W / 2 - 0.1, -DEPTH / 2)),
    ("WallE", (0.2, POOL_W, DEPTH), (POOL_L / 2 + 0.1, 0, -DEPTH / 2)),
    ("WallW", (0.2, POOL_W, DEPTH), (-POOL_L / 2 - 0.1, 0, -DEPTH / 2)),
):
    box(name, size, loc, mosaic)
# travertine deck with the pool cut out (four slabs)
deck = 9.0
box("DeckN", (POOL_L + 2 * deck, deck, 0.3), (0, POOL_W / 2 + deck / 2, -0.12), trav)
box("DeckS", (POOL_L + 2 * deck, deck, 0.3), (0, -POOL_W / 2 - deck / 2, -0.12), trav)
box("DeckE", (deck, POOL_W, 0.3), (POOL_L / 2 + deck / 2, 0, -0.12), trav)
box("DeckW", (deck, POOL_W, 0.3), (-POOL_L / 2 - deck / 2, 0, -0.12), trav)

# water: refractive surface + clear volume
surf = box("WaterSurface", (POOL_L, POOL_W, 0.002), (0, 0, -0.06), mat_water_surface())
vol = box("WaterVolume", (POOL_L - 0.02, POOL_W - 0.02, DEPTH - 0.08), (0, 0, -DEPTH / 2 - 0.08), mat_water_volume())
vol.data.materials.clear()
vol.data.materials.append(bpy.data.materials["PoolVolume"])
caustics_on(sun)

if args.estate:
    est = import_model(args.estate)
    root = normalize(est, 34.0, "Estate")
    root.location.y += POOL_W / 2 + deck + 8

# ---- floating debris that drifts off and dissolves (the pool "cleans itself")
leaf_mat = bpy.data.materials.new("Leaf")
leaf_mat.use_nodes = True
lb = leaf_mat.node_tree.nodes["Principled BSDF"]
lb.inputs["Base Color"].default_value = (0.22, 0.28, 0.08, 1)
lb.inputs["Roughness"].default_value = 0.5
rng = random.Random(7)
n = args.frames
scene.frame_start, scene.frame_end = 1, n
for i in range(26):
    bpy.ops.mesh.primitive_plane_add(size=0.32, location=(rng.uniform(-6, 6), rng.uniform(-2.6, 2.6), -0.045))
    leaf = bpy.context.active_object
    leaf.scale = (1.0, rng.uniform(0.25, 0.4), 1)
    leaf.rotation_euler[2] = rng.uniform(0, math.pi)
    leaf.data.materials.append(leaf_mat)
    start = 1 + int(n * rng.uniform(0.05, 0.35))
    leaf.keyframe_insert("location", frame=1)
    leaf.keyframe_insert("scale", frame=start)
    leaf.location.x += rng.choice((-1, 1)) * rng.uniform(1.5, 3.0)
    leaf.scale = (0.001, 0.001, 0.001)
    leaf.keyframe_insert("location", frame=start + int(n * 0.18))
    leaf.keyframe_insert("scale", frame=start + int(n * 0.18))

# ---- camera: high golden-hour view -> glide down -> break the surface -> underwater -> bubbles
cam = camera(lens=28, location=(-11, -9, 6.5), target=(0, 0, -0.5))
target = bpy.data.objects.new("CamTarget", None)
scene.collection.objects.link(target)
cam.constraints.new("TRACK_TO").target = target
path = [
    (0.00, (-11.0, -9.0, 6.5), (0.0, 0.0, -0.5)),
    (0.45, (-5.5, -2.8, 1.6), (1.5, 0.5, -0.8)),
    (0.62, (-2.4, -0.6, 0.15), (2.0, 0.6, -1.0)),   # skimming the surface
    (0.70, (-1.4, -0.3, -0.45), (3.0, 0.4, -1.0)),  # through the surface
    (1.00, (4.0, 0.2, -1.05), (8.0, 0.4, -1.1)),    # gliding along the mosaic floor
]
for frac, loc, look in path:
    f = 1 + round(frac * (n - 1))
    cam.location = loc
    cam.keyframe_insert("location", frame=f)
    target.location = look
    target.keyframe_insert("location", frame=f)

# bubble curtain for the final 15% (seamless transition to the next chapter)
bubble_mat = bpy.data.materials.new("Bubble")
bubble_mat.use_nodes = True
bb = bubble_mat.node_tree.nodes["Principled BSDF"]
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
bpy.ops.mesh.primitive_plane_add(size=1.6, location=(5.5, 0.2, -1.7))
emit = bpy.context.active_object
emit.name = "BubbleEmitter"
emit.hide_render = True
ps = emit.modifiers.new("Bubbles", "PARTICLE_SYSTEM").particle_system.settings
ps.count = 900
ps.frame_start = 1 + round(0.84 * (n - 1))
ps.frame_end = n
ps.lifetime = 40
ps.effector_weights.gravity = -0.35
ps.normal_factor = 0.6
ps.factor_random = 0.6
ps.render_type = "OBJECT"
ps.instance_object = proto
ps.particle_size = 0.03
ps.size_random = 0.8

render_frames(scene, args)
