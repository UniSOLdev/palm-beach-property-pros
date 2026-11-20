"""
home-flythrough: aerial → palm-lined drive → front door → doors open → interior.
Rendered as one continuous camera move for the homepage hero (sequence mode).

    blender -b -P renders/scenes/home_flythrough.py -- --model estate.blend \
        --door 0,-14.5,1.4 --door-objects DoorL,DoorR --interior 0,-6,1.6

Then encode and publish:
    ffmpeg -framerate 24 -i renders/_work/home-flythrough/%03d.png -c:v libx264 -crf 14 -pix_fmt yuv420p home.mp4
    npm run hero:build -- home.mp4

Knobs:
    --door X,Y,Z        world position of the front-door center (after --length scaling). Default: front-face center.
    --door-objects A,B  door leaf objects to swing open (100°) as the camera arrives
    --interior X,Y,Z    where the camera settles inside the house
    --length M          longest side of the house model in meters (default 32)
Fictional homes only: never a recognizable real property; no house numbers or gates.
"""
import math
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))
import bpy  # noqa: E402
from mathutils import Vector  # noqa: E402

from common import (  # noqa: E402
    camera, import_model, normalize, parse_args, principled, render_frames, reset_scene,
    setup_render, sun_light, world_bbox, world_sky,
)


def extra(p):
    p.add_argument("--model", default=None)
    p.add_argument("--standin", action="store_true")
    p.add_argument("--length", type=float, default=32.0)
    p.add_argument("--door", default=None)
    p.add_argument("--door-objects", default="")
    p.add_argument("--interior", default=None)


def vec(s):
    return Vector(float(x) for x in s.split(","))


def standin_house():
    """Pipeline-test geometry only (never ship)."""
    stucco = principled("Stucco", (0.93, 0.87, 0.76), roughness=0.85)
    wood = principled("Door", (0.16, 0.09, 0.05), roughness=0.45)
    floor = principled("InteriorFloor", (0.85, 0.82, 0.76), roughness=0.3)
    objs = []
    bpy.ops.mesh.primitive_cube_add(location=(0, 0, 4))
    house = bpy.context.active_object
    house.name, house.scale = "House", (16, 9, 4)
    house.data.materials.append(stucco)
    bpy.ops.mesh.primitive_cube_add(location=(0, -9, 1.6))
    hole = bpy.context.active_object
    hole.scale = (1.3, 2.0, 1.6)
    hole.hide_render = hole.hide_viewport = True
    b = house.modifiers.new("Door", "BOOLEAN")
    b.object = hole
    sol = house.modifiers.new("Hollow", "SOLIDIFY")
    sol.thickness = 0.4
    house.data.materials.append(floor)
    objs.append(house)
    for name, x, pivot in (("DoorL", -0.65, -1.3), ("DoorR", 0.65, 1.3)):
        bpy.ops.mesh.primitive_cube_add(location=(x, -9.0, 1.6))
        d = bpy.context.active_object
        d.name, d.scale = name, (0.64, 0.06, 1.58)
        d.data.materials.append(wood)
        # move origin to hinge edge so the leaf swings like a real door
        bpy.context.scene.cursor.location = (pivot, -9.0, 1.6)
        bpy.ops.object.origin_set(type="ORIGIN_CURSOR")
        objs.append(d)
    bpy.ops.mesh.primitive_plane_add(size=400, location=(0, 0, 0))
    lawn = bpy.context.active_object
    lawn.data.materials.append(principled("Lawn", (0.08, 0.17, 0.05), roughness=0.9))
    return objs


args = parse_args("home-flythrough", 150, extra)
scene = reset_scene()
setup_render(scene, args)
world_sky(scene, sun_elevation_deg=9.0, sun_rotation_deg=230.0, strength=0.45)
sun_light("Sun", (81, 0, 230), strength=3.5)

if args.model:
    objs = import_model(args.model)
    normalize(objs, args.length, "Estate")
elif args.standin:
    objs = standin_house()
else:
    raise SystemExit("Pass --model path/to/estate.blend (or --standin for a pipeline test)")

lo, hi = world_bbox([o for o in objs if not o.name.startswith("Lawn")])
door = vec(args.door) if args.door else Vector(((lo.x + hi.x) / 2, lo.y, 1.5))
inside = vec(args.interior) if args.interior else door + Vector((0, 6.0, 0.1))
size = max(hi.x - lo.x, hi.y - lo.y)

# Warm interior fill so the reveal reads bright and welcoming (real models may add their own lights).
from common import area_light  # noqa: E402
area_light("InteriorFill", tuple(inside + Vector((0, 2.0, 1.4))), (0, 0, 0), (4.0, 4.0), 600, (1.0, 0.9, 0.78))

# Waypoints (frame fraction, camera position, look target)
waypoints = [
    (0.00, door + Vector((0, -size * 2.2, size * 1.4)), door + Vector((0, size * 0.3, 0))),   # aerial
    (0.30, door + Vector((0, -size * 1.2, 2.2)), door + Vector((0, 0, 1.0))),                 # drive start
    (0.62, door + Vector((0, -6.0, 0.2)), door),                                              # approach
    (0.80, door + Vector((0, -1.2, 0.1)), door + Vector((0, 4, 0))),                          # at the door
    (1.00, inside, inside + Vector((0, 6, -0.2))),                                            # inside
]

n = args.frames
scene.frame_start, scene.frame_end = 1, n
cam = camera(lens=32, location=tuple(waypoints[0][1]), target=tuple(waypoints[0][2]))
target = bpy.data.objects.new("CamTarget", None)
scene.collection.objects.link(target)
cam.constraints.new("TRACK_TO").target = target
for frac, pos, look in waypoints:
    f = 1 + round(frac * (n - 1))
    cam.location = pos
    cam.keyframe_insert("location", frame=f)
    target.location = look
    target.keyframe_insert("location", frame=f)
# smooth, continuous move (Bezier auto-clamped = no stops between waypoints)
for o in (cam, target):
    for fc in o.animation_data.action.fcurves:
        for kp in fc.keyframe_points:
            kp.interpolation = "BEZIER"
            kp.handle_left_type = kp.handle_right_type = "AUTO_CLAMPED"

# Doors swing open as the camera arrives (frames 70% -> 82%).
for name in filter(None, args.door_objects.split(",")):
    d = bpy.data.objects.get(name)
    if not d:
        print(f"[pbpp] door object not found: {name}")
        continue
    sign = -1 if "l" in name.lower()[-1:] else 1
    d.keyframe_insert("rotation_euler", index=2, frame=1 + round(0.70 * (n - 1)))
    d.rotation_euler[2] += math.radians(100) * sign
    d.keyframe_insert("rotation_euler", index=2, frame=1 + round(0.82 * (n - 1)))

render_frames(scene, args)
