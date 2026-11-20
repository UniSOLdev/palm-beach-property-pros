"""
car-spin: 360° drag-to-spin turntable for the Auto Detailing experience.

    blender -b -P renders/scenes/car_spin.py -- --model car.glb --variant clean
    blender -b -P renders/scenes/car_spin.py -- --model car.glb --variant foam
    blender -b -P renders/scenes/car_spin.py -- --standin --preview --only 1,19,37,55

Renders N frames (default 72 = 5° steps) of one seamless revolution: frame N+1 == frame 1.
Unbranded vehicles only: --strip-branding hides objects named like logo/badge/plate.
"""
import math
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))
import bpy  # noqa: E402

from common import PAINTS, drop_ground_planes, recolor_paint, tag_interior, world_bbox  # noqa: E402
from common import (  # noqa: E402
    area_light, camera, car_paint, floor_studio, import_model, linear_keys, normalize,
    parse_args, render_frames, reset_scene, setup_render, strip_branding, world_hdri,
)
from foam import add_foam  # noqa: E402
from procedural_car import luxury_saloon  # noqa: E402
from standins import standin_car  # noqa: E402


def extra(p):
    p.add_argument("--model", default=None, help="licensed car model (.glb/.fbx/.obj/.blend)")
    p.add_argument("--paint", default="navy", choices=["navy", "white", "rosso", "keep"],
                   help="body colour for a purchased model (keep = as shipped)")
    p.add_argument("--yaw", type=float, default=None, help="base heading in degrees (auto: long axis -> X)")
    p.add_argument("--collection", default=None, help="collection to load from a .blend holding several cars")
    p.add_argument("--standin", action="store_true", help="test geometry (never ship)")
    p.add_argument("--variant", choices=["clean", "foam"], default="clean")
    p.add_argument("--repaint", action="store_true", help="apply PBPP deep-navy paint to the largest mesh")
    p.add_argument("--strip-branding", action="store_true", default=True)
    p.add_argument("--length", type=float, default=None, help="vehicle length in meters")


args = parse_args("car-spin", 72, extra)
scene = reset_scene()
setup_render(scene, args)
world_hdri(scene, args.hdri, strength=0.25)

if args.model:
    objs = import_model(args.model, args.collection)
    objs = drop_ground_planes(objs)
    tag_interior(objs)
    if args.paint != "keep":
        recolor_paint(objs, PAINTS[args.paint])
    if args.strip_branding:
        strip_branding(objs)
elif args.standin:
    objs = standin_car()
else:
    # default: license-free procedural grand saloon (no badges, plates, or brand marks)
    objs = luxury_saloon()

root = normalize(objs, args.length or (5.6 if not (args.model or args.standin) else 4.9), "Car")
if args.repaint:
    meshes = [o for o in objs if o.type == "MESH"]
    biggest = max(meshes, key=lambda o: len(o.data.polygons))
    biggest.data.materials.clear()
    biggest.data.materials.append(car_paint())

floor_studio(roughness=0.32)
# Studio: large overhead softbox, two long rim strips, soft front fill.
area_light("Key", (0, 0, 6.5), (0, 0, 0), (7.0, 3.2), 1300)
area_light("RimL", (-1.0, -4.2, 2.2), (70, 0, 0), (7.0, 0.5), 900, (0.95, 0.97, 1.0))
area_light("RimR", (1.0, 4.2, 2.2), (-70, 0, 0), (7.0, 0.5), 900, (0.95, 0.97, 1.0))
area_light("Fill", (-9, -8, 2.0), (80, 0, -48), 4.0, 350, (1.0, 0.93, 0.85))

cam = camera(lens=70, location=(0, -16.5, 1.45), target=(0, 0, 0.62))

if args.variant == "foam":
    front = bpy.data.objects.new("FoamFront", None)
    scene.collection.objects.link(front)
    front.location = (100, 0, 0)  # everything "behind" the front -> fully foamed
    add_foam(objs, front, radius=0.05, coverage=1.0)

# Turntable: rotate the car (camera and lights stay fixed so reflections sweep naturally).
n = args.frames
scene.frame_start, scene.frame_end = 1, n
lo, hi = world_bbox([o for o in objs if o.type == "MESH"])
yaw0 = args.yaw if args.yaw is not None else (90.0 if (hi.y - lo.y) > (hi.x - lo.x) else 0.0)
root.rotation_euler = (0, 0, math.radians(yaw0))
root.keyframe_insert("rotation_euler", index=2, frame=1)
root.rotation_euler = (0, 0, math.radians(yaw0 + 360))
root.keyframe_insert("rotation_euler", index=2, frame=n + 1)
linear_keys(root)

render_frames(scene, args)
