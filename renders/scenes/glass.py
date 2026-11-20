"""
glass: Chapter 3 of "The Dive" -- The Glass (window cleaning).

Floor-to-ceiling seaside glass, hazed with streaks and water spots, is wiped crystal clear
by a squeegee pass, opening onto the ocean at golden hour. The chapter ends as the sun
blooms to white (the hand-off to Chapter 4, The Grounds).

    blender -b -P renders/scenes/glass.py -- --preview --only 1,35,60,90
"""
import math
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))
import bpy  # noqa: E402

from common import (  # noqa: E402
    ASSETS, camera, dof, golden_hour, import_model, normalize, parse_args, pbr_textures,
    render_frames, reset_scene, setup_render,
)
from procedural import _box, mat_steel, royal_palm  # noqa: E402

PH = ASSETS / "polyhaven"
HDRI = PH / "hdri" / "kloppenheim_06_puresky_4k.exr"

args = parse_args("glass", 100)
scene = reset_scene()
setup_render(scene, args)
n = args.frames
scene.frame_start, scene.frame_end = 1, n
coll = scene.collection

# sunset over the sea, just right of centre: the sun is in shot and lays a glitter path on the water
golden_hour(scene, azimuth_deg=14, elevation_deg=4.0, sky_strength=0.3, sun_strength=3.0,
            color=(1.0, 0.70, 0.45), angle_deg=0.55)

GW, GH = 9.0, 3.4          # glass wall: three tall panes


def mat(name, color, rough=0.5):
    m = bpy.data.materials.new(name)
    m.use_nodes = True
    b = m.node_tree.nodes["Principled BSDF"]
    b.inputs["Base Color"].default_value = (*color, 1)
    b.inputs["Roughness"].default_value = rough
    return m


# ---- interior edge: marble floor, plaster reveal, ceiling (only the frame of the view)
floor = bpy.data.materials.new("Marble")
floor.use_nodes = True
if (PH / "tex" / "marble_01").exists():
    pbr_textures(floor, PH / "tex" / "marble_01", "marble_01", tile_m=1.6, bump=0.3)
plaster = mat("Plaster", (0.86, 0.84, 0.80), 0.9)
_box("RoomFloor", (10, 6, 0.1), (0, -3.0, -0.05), floor, coll)
_box("RoomCeil", (10, 6, 0.1), (0, -3.0, GH + 0.05), plaster, coll)
_box("RevealL", (1.8, 0.4, GH), (-GW / 2 - 0.9, 0.0, GH / 2), plaster, coll)
_box("RevealR", (1.8, 0.4, GH), (GW / 2 + 0.9, 0.0, GH / 2), plaster, coll)
steel = mat_steel()
_box("FrameTop", (GW, 0.08, 0.06), (0, 0, GH - 0.03), steel, coll)
_box("FrameBot", (GW, 0.08, 0.05), (0, 0, 0.025), steel, coll)
for mx_ in (-GW / 6, GW / 6):
    _box(f"Mullion{mx_:+.1f}", (0.045, 0.08, GH), (mx_, 0, GH / 2), steel, coll)

# ---- the room: furniture silhouetted against the sunset (Poly Haven CC0 models), rug, sheer curtain
rug = mat("Rug", (0.72, 0.66, 0.58), 1.0)
_box("Rug", (4.6, 3.0, 0.02), (0.4, -2.6, 0.01), rug, coll, bevel=0.005)


def place(model, length, loc, yaw=0.0):
    g = PH / "models" / model / f"{model}_1k.gltf"
    if not g.exists():
        print(f"[pbpp] missing {model}")
        return None
    root = normalize(import_model(str(g)), length, model)
    root.location = loc
    root.rotation_euler[2] = math.radians(yaw)
    return root


place("modern_arm_chair_01", 0.85, (-1.0, -1.9, 0.0), 200)
place("modern_arm_chair_01", 0.85, (1.6, -1.7, 0.0), 160)
place("coffee_table_round_01", 1.0, (0.3, -2.4, 0.0))
place("ceramic_vase_04", 0.34, (0.3, -2.4, 0.42))
place("potted_plant_02", 1.4, (-4.0, -0.8, 0.0), 30)
place("brass_vase_03", 0.5, (3.9, -0.6, 0.0))
sheer = bpy.data.materials.new("Sheer")
sheer.use_nodes = True
sh = sheer.node_tree.nodes["Principled BSDF"]
sh.inputs["Base Color"].default_value = (0.95, 0.93, 0.88, 1)
sh.inputs["Roughness"].default_value = 0.6
for k_, v_ in (("Transmission Weight", 0.85), ("Alpha", 0.75)):
    if k_ in sh.inputs:
        sh.inputs[k_].default_value = v_
bpy.ops.mesh.primitive_plane_add(size=1, location=(-GW / 2 + 0.55, -0.35, GH / 2), rotation=(math.radians(90), 0, 0))
cur = bpy.context.active_object
cur.name = "Sheer"
cur.scale = (1.1, GH - 0.05, 1)
bpy.ops.object.transform_apply(scale=True)
wv = cur.modifiers.new("Folds", "WAVE")
wv.use_normal = True
wv.height, wv.width, wv.narrowness, wv.speed = 0.06, 0.18, 1.0, 0.0
sub_ = cur.modifiers.new("Sub", "SUBSURF")
sub_.levels = sub_.render_levels = 3
cur.data.materials.append(sheer)

# ---- outside: travertine terrace, low parapet, palms, ocean
trav = bpy.data.materials.new("Terrace")
trav.use_nodes = True
if (PH / "tex" / "floor_tiles_08").exists():
    pbr_textures(trav, PH / "tex" / "floor_tiles_08", "floor_tiles_08", tile_m=2.4, tint=(1.0, 0.95, 0.86), bump=0.8)
_box("Terrace", (30, 12, 0.1), (0, 6.2, -0.1), trav, coll)
_box("Parapet", (30, 0.35, 0.55), (0, 12.0, 0.2), plaster, coll, bevel=0.03)
for k, (x, y) in enumerate(((-6.8, 9.0), (7.6, 10.5), (-11.5, 8.0))):
    p = royal_palm(f"SeaPalm{k}", height=12.0 + k, seed=50 + k)
    p.location = (x, y, -0.1)

sea_m = bpy.data.materials.new("Sea")
sea_m.use_nodes = True
sb = sea_m.node_tree.nodes["Principled BSDF"]
sb.inputs["Base Color"].default_value = (0.01, 0.06, 0.09, 1)
sb.inputs["Roughness"].default_value = 0.1  # broad glitter path under the low sun
if "Specular IOR Level" in sb.inputs:
    sb.inputs["Specular IOR Level"].default_value = 0.6
bpy.ops.mesh.primitive_grid_add(x_subdivisions=220, y_subdivisions=220, size=1, location=(0, 200, -4.0))
sea = bpy.context.active_object
sea.name = "Ocean"
sea.scale = (900, 380, 1)
bpy.ops.object.transform_apply(scale=True)
sea.data.materials.append(sea_m)
oc = sea.modifiers.new("Waves", "OCEAN")
oc.geometry_mode = "DISPLACE"
oc.spatial_size = 60
oc.resolution = 12
oc.wave_scale = 1.1
oc.choppiness = 1.2
oc.wind_velocity = 7
oc.time = 0.0
oc.keyframe_insert("time", frame=1)
oc.time = n / 24
oc.keyframe_insert("time", frame=n)
bpy.ops.object.shade_smooth()

# ---- the glass: clean glass under an animated dirt film (haze + vertical streaks + spots)
sweep = bpy.data.objects.new("SqueegeeFront", None)   # x of the cleaning edge
coll.objects.link(sweep)
f0, f1 = round(0.15 * n), round(0.75 * n)
for f, x in ((1, -GW / 2 - 0.3), (f0, -GW / 2 - 0.3), (f1, GW / 2 + 0.3), (n, GW / 2 + 0.3)):
    sweep.location.x = x
    sweep.keyframe_insert("location", index=0, frame=f)

gm = bpy.data.materials.new("DirtyGlass")
gm.use_nodes = True
N, L = gm.node_tree.nodes, gm.node_tree.links
N.remove(N["Principled BSDF"])
out = N["Material Output"]
tr = N.new("ShaderNodeBsdfTransparent")
tr.inputs["Color"].default_value = (0.96, 0.98, 0.98, 1)
gl = N.new("ShaderNodeBsdfGlossy")
gl.inputs["Roughness"].default_value = 0.0
fr = N.new("ShaderNodeFresnel")
fr.inputs["IOR"].default_value = 1.52
lift = N.new("ShaderNodeMath")
lift.operation = "MULTIPLY_ADD"
lift.inputs[1].default_value = 0.5
lift.inputs[2].default_value = 0.015
L.new(fr.outputs["Fac"], lift.inputs[0])
clean = N.new("ShaderNodeMixShader")
L.new(lift.outputs[0], clean.inputs["Fac"])
L.new(tr.outputs["BSDF"], clean.inputs[1])
L.new(gl.outputs["BSDF"], clean.inputs[2])

tc = N.new("ShaderNodeTexCoord")
sep = N.new("ShaderNodeSeparateXYZ")
L.new(tc.outputs["Object"], sep.inputs[0])
# streaks: noise stretched vertically
stretch = N.new("ShaderNodeCombineXYZ")
mx = N.new("ShaderNodeMath")
mx.operation = "MULTIPLY"
mx.inputs[1].default_value = 30.0
L.new(sep.outputs["X"], mx.inputs[0])
mz = N.new("ShaderNodeMath")
mz.operation = "MULTIPLY"
mz.inputs[1].default_value = 1.2
L.new(sep.outputs["Z"], mz.inputs[0])
L.new(mx.outputs[0], stretch.inputs["X"])
L.new(mz.outputs[0], stretch.inputs["Y"])
streak_n = N.new("ShaderNodeTexNoise")
streak_n.inputs["Detail"].default_value = 6
L.new(stretch.outputs[0], streak_n.inputs["Vector"])
streak = N.new("ShaderNodeMapRange")
streak.inputs["From Min"].default_value = 0.5
streak.inputs["From Max"].default_value = 0.75
L.new(streak_n.outputs["Fac"], streak.inputs["Value"])
# water spots
spot_v = N.new("ShaderNodeTexVoronoi")
spot_v.inputs["Scale"].default_value = 55
spot_v.inputs["Randomness"].default_value = 1.0
L.new(tc.outputs["Object"], spot_v.inputs["Vector"])
spot = N.new("ShaderNodeMapRange")
spot.inputs["From Min"].default_value = 0.12
spot.inputs["From Max"].default_value = 0.06
L.new(spot_v.outputs["Distance"], spot.inputs["Value"])
# overall haze
haze_n = N.new("ShaderNodeTexNoise")
haze_n.inputs["Scale"].default_value = 1.5
L.new(tc.outputs["Object"], haze_n.inputs["Vector"])


def add(a, b, wa=1.0, wb=1.0):
    ma = N.new("ShaderNodeMath")
    ma.operation = "MULTIPLY"
    ma.inputs[1].default_value = wa
    L.new(a, ma.inputs[0])
    mb = N.new("ShaderNodeMath")
    mb.operation = "MULTIPLY"
    mb.inputs[1].default_value = wb
    L.new(b, mb.inputs[0])
    s_ = N.new("ShaderNodeMath")
    s_.operation = "ADD"
    s_.use_clamp = True
    L.new(ma.outputs[0], s_.inputs[0])
    L.new(mb.outputs[0], s_.inputs[1])
    return s_.outputs[0]


dirt = add(add(streak.outputs["Result"], spot.outputs["Result"], 0.6, 0.8), haze_n.outputs["Fac"], 1.0, 0.6)
# cleaned region: world x left of the squeegee edge (wavy edge)
geo = N.new("ShaderNodeNewGeometry")
gsep = N.new("ShaderNodeSeparateXYZ")
L.new(geo.outputs["Position"], gsep.inputs[0])
info = N.new("ShaderNodeAttribute")   # driver-free: read the empty's x via a value node keyed below
val = N.new("ShaderNodeValue")
val.label = "SweepX"
wob = N.new("ShaderNodeMath")
wob.operation = "SINE"
wz = N.new("ShaderNodeMath")
wz.operation = "MULTIPLY"
wz.inputs[1].default_value = 2.4
L.new(gsep.outputs["Z"], wz.inputs[0])
L.new(wz.outputs[0], wob.inputs[0])
wobs = N.new("ShaderNodeMath")
wobs.operation = "MULTIPLY_ADD"
wobs.inputs[1].default_value = 0.06
L.new(wob.outputs[0], wobs.inputs[0])
L.new(val.outputs[0], wobs.inputs[2])
edge = N.new("ShaderNodeMapRange")       # 1 = dirty (right of the edge), 0 = clean
edge.inputs["From Min"].default_value = -0.04
edge.inputs["From Max"].default_value = 0.04
dx = N.new("ShaderNodeMath")
dx.operation = "SUBTRACT"
L.new(gsep.outputs["X"], dx.inputs[0])
L.new(wobs.outputs[0], dx.inputs[1])
L.new(dx.outputs[0], edge.inputs["Value"])
dirty_now = N.new("ShaderNodeMath")
dirty_now.operation = "MULTIPLY"
L.new(dirt, dirty_now.inputs[0])
L.new(edge.outputs["Result"], dirty_now.inputs[1])
film_fac = N.new("ShaderNodeMath")
film_fac.operation = "MULTIPLY"
film_fac.inputs[1].default_value = 0.9
L.new(dirty_now.outputs[0], film_fac.inputs[0])
film = N.new("ShaderNodeBsdfPrincipled")
film.inputs["Base Color"].default_value = (0.78, 0.78, 0.74, 1)
film.inputs["Roughness"].default_value = 0.75
final = N.new("ShaderNodeMixShader")
L.new(film_fac.outputs[0], final.inputs["Fac"])
L.new(clean.outputs["Shader"], final.inputs[1])
L.new(film.outputs["BSDF"], final.inputs[2])
L.new(final.outputs["Shader"], out.inputs["Surface"])
for f, x in ((1, -GW / 2 - 0.3), (f0, -GW / 2 - 0.3), (f1, GW / 2 + 0.3), (n, GW / 2 + 0.3)):
    val.outputs[0].default_value = x
    val.outputs[0].keyframe_insert("default_value", frame=f)

bpy.ops.mesh.primitive_plane_add(size=1, location=(0, 0, GH / 2), rotation=(math.radians(90), 0, 0))
pane = bpy.context.active_object
pane.name = "GlassWall"
pane.scale = (GW, GH, 1)
bpy.ops.object.transform_apply(scale=True)
pane.data.materials.append(gm)

# ---- camera: starts close on the hazy glass (shallow focus on the film), then pulls back into the
# room as the squeegee clears it, focus racking out to the sunset
from mathutils import Vector  # noqa: E402

cam = camera(lens=32, location=(-0.6, -1.0, 1.45), target=(1.2, 8.0, 1.35))
cam.data.clip_start = 0.02
aim = bpy.data.objects.new("Aim", None)
coll.objects.link(aim)
track = cam.constraints.new("TRACK_TO")
track.target = aim
track.track_axis, track.up_axis = "TRACK_NEGATIVE_Z", "UP_Y"
for f, loc, at in ((1, (-0.6, -1.0, 1.45), (1.2, 8.0, 1.35)),
                   (round(0.45 * n), (0.2, -3.0, 1.38), (0.9, 9.0, 1.3)),
                   (n, (1.0, -5.6, 1.3), (0.3, 10.0, 1.25))):
    cam.location = loc
    cam.keyframe_insert("location", frame=f)
    aim.location = at
    aim.keyframe_insert("location", frame=f)
dof(cam, 1.1, fstop=2.2)
scene.view_settings.exposure = -1.7  # hold the sunset's colour; the room falls to silhouette
for f, d in ((1, 1.1), (round(0.2 * n), 1.4), (round(0.7 * n), 30.0), (n, 60.0)):
    cam.data.dof.focus_distance = d
    cam.data.dof.keyframe_insert("focus_distance", frame=f)

render_frames(scene, args)
