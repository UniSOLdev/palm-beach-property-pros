"""
foam-cannon: scroll-scrubbed detailing sequence.

Foam sweeps on front-to-back, holds, then a rinse pass sweeps it off to reveal
mirror-finish paint, while the camera dollies slowly along the car.

    blender -b -P renders/scenes/foam_cannon.py -- --model car.glb
    blender -b -P renders/scenes/foam_cannon.py -- --standin --preview --only 1,40,70,110
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
    p.add_argument("--model", default=None)
    p.add_argument("--paint", default="navy", choices=["navy", "white", "rosso", "keep"],
                   help="body colour for a purchased model (keep = as shipped)")
    p.add_argument("--yaw", type=float, default=None, help="base heading in degrees (auto: long axis -> X)")
    p.add_argument("--collection", default=None, help="collection to load from a .blend holding several cars")
    p.add_argument("--standin", action="store_true")
    p.add_argument("--repaint", action="store_true")
    p.add_argument("--length", type=float, default=None)


args = parse_args("foam-cannon", 120, extra)
scene = reset_scene()
setup_render(scene, args)
world_hdri(scene, args.hdri, strength=0.25, camera_bg=(0.012, 0.014, 0.018))

if args.model:
    objs = import_model(args.model, args.collection)
    objs = drop_ground_planes(objs)
    tag_interior(objs)
    if args.paint != "keep":
        recolor_paint(objs, PAINTS[args.paint])
    strip_branding(objs)
elif args.standin:
    objs = standin_car()
else:
    objs = luxury_saloon()   # license-free procedural grand saloon
args.length = args.length or (5.6 if not (args.model or args.standin) else 4.9)
root = normalize(objs, args.length, "Car")
lo, hi = world_bbox([o for o in objs if o.type == "MESH"])
root.rotation_euler[2] = math.radians(args.yaw if args.yaw is not None else (90.0 if (hi.y - lo.y) > (hi.x - lo.x) else 0.0))
if args.repaint:
    meshes = [o for o in objs if o.type == "MESH"]
    max(meshes, key=lambda o: len(o.data.polygons)).data.materials[:] = [car_paint()]

floor_studio()
area_light("Key", (0, 0, 6.0), (0, 0, 0), (7.0, 3.0), 2000)
area_light("Rim", (0.5, 4.0, 2.4), (-68, 0, 0), (7.0, 0.5), 900)
area_light("Side", (0, -5.5, 2.0), (75, 0, 0), (8.0, 0.4), 500, (1.0, 0.95, 0.9))

n = args.frames
scene.frame_start, scene.frame_end = 1, n
half = args.length / 2 + 0.6

# Foam front: sweep on (0 -> 50%), hold (50 -> 62%), rinse off (62 -> 100%).
front = bpy.data.objects.new("FoamFront", None)
scene.collection.objects.link(front)
for frame, x in ((1, -half), (int(n * 0.5), half), (int(n * 0.62), half), (n, -half)):
    front.location = (x, 0, 0)
    front.keyframe_insert("location", index=0, frame=frame)
linear_keys(front)
add_foam(objs, front, radius=0.05, coverage=1.0)

# Camera: close three-quarter view, slow lateral dolly front -> rear.
cam = camera(lens=45, location=(-2.2, -6.4, 1.25), target=(-0.6, 0, 0.7))
target = bpy.data.objects.new("CamTarget", None)
scene.collection.objects.link(target)
cam.constraints.new("TRACK_TO").target = target
for frame, cx, tx in ((1, -2.6, -1.2), (n, 2.4, 0.9)):
    cam.location.x = cx
    cam.keyframe_insert("location", index=0, frame=frame)
    target.location = (tx, 0, 0.7)
    target.keyframe_insert("location", frame=frame)
linear_keys(cam)
linear_keys(target)

render_frames(scene, args)
