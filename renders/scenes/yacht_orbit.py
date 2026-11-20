"""
yacht-orbit: golden-hour orbit around a motor yacht at anchor (scroll-scrubbed).

    blender -b -P renders/scenes/yacht_orbit.py -- --model yacht.glb
    blender -b -P renders/scenes/yacht_orbit.py -- --standin --preview --only 1,60,120

Water: Blender's Ocean modifier + a clear, slightly turquoise water shader.
Sky: physically based Nishita sky at a low sun angle (golden hour).
Unbranded only: no hull names, logos, or registration numbers.
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
    p.add_argument("--model", default=None)
    p.add_argument("--standin", action="store_true")
    p.add_argument("--length", type=float, default=24.0, help="yacht length in meters (~80 ft)")
    p.add_argument("--orbit", type=float, default=120.0, help="degrees of orbit over the sequence")


args = parse_args("yacht-orbit", 120, extra)
scene = reset_scene()
setup_render(scene, args)
world_sky(scene, sun_elevation_deg=7.0, sun_rotation_deg=215.0, strength=0.4)
sun_light("Sun", (83, 0, 215), strength=4.0, color=(1.0, 0.8, 0.6), angle_deg=0.6)

if args.model:
    objs = import_model(args.model)
    strip_branding(objs, words=("logo", "badge", "emblem", "name", "registration", "text", "decal"))
elif args.standin:
    objs = standin_yacht()
else:
    raise SystemExit("Pass --model path/to/yacht.glb (or --standin for a pipeline test)")
root = normalize(objs, args.length, "Yacht")
root.location.z -= args.length * 0.045  # sit into the water at a realistic draft

# Ocean
bpy.ops.mesh.primitive_plane_add(size=2)
ocean = bpy.context.active_object
ocean.name = "Ocean"
mod = ocean.modifiers.new("Ocean", "OCEAN")
mod.geometry_mode = "GENERATE"
mod.size = 4.0
mod.spatial_size = 120
mod.resolution = 10 if args.preview else 18
mod.wave_scale = 0.55
mod.choppiness = 0.9
mod.wind_velocity = 6.0
mod.repeat_x = mod.repeat_y = 3
water = bpy.data.materials.new("Water")
water.use_nodes = True
b = water.node_tree.nodes["Principled BSDF"]
b.inputs["Base Color"].default_value = (0.02, 0.22, 0.26, 1)
b.inputs["Roughness"].default_value = 0.03
b.inputs["IOR"].default_value = 1.333
for key in ("Transmission Weight", "Transmission"):
    if key in b.inputs:
        b.inputs[key].default_value = 0.85
        break
ocean.data.materials.append(water)
bpy.ops.object.shade_smooth()
# Detailed ocean near the yacht + a huge calm plane out to the horizon (no visible edge).
bpy.ops.mesh.primitive_plane_add(size=6000, location=(0, 0, -0.08))
far = bpy.context.active_object
far.name = "OceanFar"
far.data.materials.append(water)

# animate gentle swell
n = args.frames
scene.frame_start, scene.frame_end = 1, n
mod.time = 0
mod.keyframe_insert("time", frame=1)
mod.time = n / 24 * 0.6
mod.keyframe_insert("time", frame=n)
linear_keys(ocean)

# Camera orbit: pivot empty rotates; camera rises slightly; always looks at the yacht.
pivot = bpy.data.objects.new("Pivot", None)
scene.collection.objects.link(pivot)
target = bpy.data.objects.new("Target", None)
scene.collection.objects.link(target)
target.location = (0, 0, args.length * 0.12)
cam = camera(lens=40, location=(0, -args.length * 1.6, args.length * 0.18), target=tuple(target.location))
cam.parent = pivot
cam.constraints.new("TRACK_TO").target = target
pivot.rotation_euler = (0, 0, math.radians(-args.orbit / 2))
pivot.keyframe_insert("rotation_euler", index=2, frame=1)
cam.location.z = args.length * 0.14
cam.keyframe_insert("location", index=2, frame=1)
pivot.rotation_euler = (0, 0, math.radians(args.orbit / 2))
pivot.keyframe_insert("rotation_euler", index=2, frame=n)
cam.location.z = args.length * 0.26
cam.keyframe_insert("location", index=2, frame=n)
linear_keys(pivot)
linear_keys(cam)

render_frames(scene, args)
