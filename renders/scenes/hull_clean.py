"""
hull-clean: final chapter of "The Dive". Under the yacht, a diver cleans the hull.

Camera descends from the waterline beside the yacht into clear turquoise water, sun
shafts and caustics overhead; a diver works along the hull and marine growth gives
way to a clean, gleaming underside as the "clean front" passes. Ends looking up at
the bright surface (a natural fade-out for the page footer).

    blender -b -P renders/scenes/hull_clean.py -- --yacht yacht.glb --diver diver.glb
    blender -b -P renders/scenes/hull_clean.py -- --standin --preview --only 1,70,140
"""
import math
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))
import bpy  # noqa: E402

from common import (  # noqa: E402
    camera, import_model, linear_keys, normalize, parse_args, render_frames, reset_scene,
    setup_render, strip_branding, sun_light, world_sky,
)
from standins import standin_yacht  # noqa: E402


def extra(p):
    p.add_argument("--yacht", default=None)
    p.add_argument("--diver", default=None, help="rigged/posed scuba diver (face hidden by mask)")
    p.add_argument("--standin", action="store_true")
    p.add_argument("--length", type=float, default=24.0)


args = parse_args("hull-clean", 160, extra)
scene = reset_scene()
setup_render(scene, args)
scene.cycles.volume_bounces = 2
world_sky(scene, sun_elevation_deg=40.0, sun_rotation_deg=200.0, strength=0.6)
sun = sun_light("Sun", (40, 0, 200), strength=5.0, color=(1.0, 0.95, 0.85), angle_deg=0.5)
n = args.frames
scene.frame_start, scene.frame_end = 1, n

if args.yacht:
    objs = import_model(args.yacht)
    strip_branding(objs, words=("logo", "badge", "name", "registration", "text", "decal"))
elif args.standin:
    objs = standin_yacht()
else:
    raise SystemExit("Pass --yacht path/to/yacht.glb (or --standin for a pipeline test)")
root = normalize(objs, args.length, "Yacht")
root.location.z -= args.length * 0.06

# Clean front sweeps bow -> stern; fouling (algae/slime) is drawn only ahead of it.
front = bpy.data.objects.new("CleanFront", None)
scene.collection.objects.link(front)
half = args.length / 2
for f, x in ((1 + round(0.25 * (n - 1)), -half), (1 + round(0.85 * (n - 1)), half)):
    front.location = (x, 0, 0)
    front.keyframe_insert("location", index=0, frame=f)
linear_keys(front)


def add_fouling(mat):
    """Mix an algae layer over the hull material wherever position.x is ahead of the clean front."""
    if not mat or not mat.use_nodes:
        return
    N, L = mat.node_tree.nodes, mat.node_tree.links
    out = N.get("Material Output")
    if not out or not out.inputs["Surface"].links:
        return
    clean = out.inputs["Surface"].links[0].from_socket
    algae = N.new("ShaderNodeBsdfPrincipled")
    algae.inputs["Base Color"].default_value = (0.09, 0.14, 0.05, 1)
    algae.inputs["Roughness"].default_value = 0.85
    coord = N.new("ShaderNodeTexCoord")
    coord.object = front
    sep = N.new("ShaderNodeSeparateXYZ")
    L.new(coord.outputs["Object"], sep.inputs[0])
    noise = N.new("ShaderNodeTexNoise")
    noise.inputs["Scale"].default_value = 2.5
    edge = N.new("ShaderNodeMath")
    edge.operation = "ADD"
    L.new(sep.outputs["X"], edge.inputs[0])
    L.new(noise.outputs["Fac"], edge.inputs[1])
    mask = N.new("ShaderNodeMapRange")  # x(rel. front) > 0 -> fouled, soft noisy edge
    mask.inputs["From Min"].default_value = 0.2
    mask.inputs["From Max"].default_value = 0.9
    L.new(edge.outputs[0], mask.inputs["Value"])
    # only below the waterline (world z < ~0)
    geo = N.new("ShaderNodeNewGeometry")
    gz = N.new("ShaderNodeSeparateXYZ")
    L.new(geo.outputs["Position"], gz.inputs[0])
    below = N.new("ShaderNodeMapRange")
    below.inputs["From Min"].default_value = 0.1
    below.inputs["From Max"].default_value = -0.3
    L.new(gz.outputs["Z"], below.inputs["Value"])
    both = N.new("ShaderNodeMath")
    both.operation = "MULTIPLY"
    L.new(mask.outputs["Result"], both.inputs[0])
    L.new(below.outputs["Result"], both.inputs[1])
    mix = N.new("ShaderNodeMixShader")
    L.new(both.outputs[0], mix.inputs["Fac"])
    L.new(clean, mix.inputs[1])
    L.new(algae.outputs["BSDF"], mix.inputs[2])
    L.new(mix.outputs["Shader"], out.inputs["Surface"])


for o in objs:
    if o.type == "MESH":
        for slot in o.material_slots:
            add_fouling(slot.material)

# Water: surface + volume box the camera travels into
water = bpy.data.materials.new("Sea")
water.use_nodes = True
wb = water.node_tree.nodes["Principled BSDF"]
wb.inputs["Base Color"].default_value = (0.75, 0.95, 1.0, 1)
wb.inputs["Roughness"].default_value = 0.02
wb.inputs["IOR"].default_value = 1.333
for key in ("Transmission Weight", "Transmission"):
    if key in wb.inputs:
        wb.inputs[key].default_value = 1.0
        break
bpy.ops.mesh.primitive_plane_add(size=400, location=(0, 0, 0))
surface = bpy.context.active_object
surface.name = "SeaSurface"
surface.data.materials.append(water)
disp = surface.modifiers.new("Swell", "OCEAN")
disp.geometry_mode = "DISPLACE"
disp.wave_scale = 0.25
disp.resolution = 10 if args.preview else 16

sea = bpy.data.materials.new("SeaVolume")
sea.use_nodes = True
N, L = sea.node_tree.nodes, sea.node_tree.links
N.remove(N["Principled BSDF"])
v = N.new("ShaderNodeVolumePrincipled")
v.inputs["Color"].default_value = (0.35, 0.8, 0.85, 1)
v.inputs["Density"].default_value = 0.05
v.inputs["Absorption Color"].default_value = (0.2, 0.7, 0.78, 1)
v.inputs["Anisotropy"].default_value = 0.6  # forward scatter -> visible sun shafts
L.new(v.outputs["Volume"], N["Material Output"].inputs["Volume"])
bpy.ops.mesh.primitive_cube_add(location=(0, 0, -15.02))
box = bpy.context.active_object
box.name, box.scale = "SeaVolume", (200, 200, 15)
box.data.materials.append(sea)

bpy.ops.mesh.primitive_plane_add(size=400, location=(0, 0, -14))
sand = bpy.context.active_object
sand.name = "Seabed"
sm = bpy.data.materials.new("Sand")
sm.use_nodes = True
sm.node_tree.nodes["Principled BSDF"].inputs["Base Color"].default_value = (0.78, 0.7, 0.55, 1)
sand.data.materials.append(sm)

if args.diver:
    dobjs = import_model(args.diver)
    droot = normalize(dobjs, 1.9, "Diver")
    droot.location = (-half, -2.6, -2.4)
    droot.rotation_euler = (math.radians(-80), 0, math.radians(90))  # horizontal, facing the hull
    droot.keyframe_insert("location", frame=1 + round(0.25 * (n - 1)))
    droot.location.x = half * 0.9
    droot.keyframe_insert("location", frame=1 + round(0.85 * (n - 1)))
    linear_keys(droot)

# Camera: waterline beside the yacht -> descend -> track the diver under the hull -> look up
cam = camera(lens=24, location=(-half - 6, -12, 1.2), target=(-half, 0, -0.5))
target = bpy.data.objects.new("CamTarget", None)
scene.collection.objects.link(target)
cam.constraints.new("TRACK_TO").target = target
path = [
    (0.00, (-half - 6, -12, 1.2), (-half, 0, -0.5)),
    (0.20, (-half - 2, -9, -2.5), (-half, 0, -1.8)),
    (0.55, (0, -8, -4.0), (0, -1, -2.2)),
    (0.85, (half * 0.7, -6.5, -4.2), (half * 0.9, -1, -2.0)),
    (1.00, (half * 0.8, -5, -5.0), (half * 0.8, -3, 2.0)),  # tilt up to the bright surface
]
for frac, loc, look in path:
    f = 1 + round(frac * (n - 1))
    cam.location = loc
    cam.keyframe_insert("location", frame=f)
    target.location = look
    target.keyframe_insert("location", frame=f)

render_frames(scene, args)
