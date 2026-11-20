"""
grounds: Chapter 4 of "The Dive" -- The Grounds (pressure washing, landscape, maintenance).

Low over the motor court in front of the estate: weathered, grimy pavers wash bright as a
pressure-wash front sweeps away from the camera (wet sheen just behind it, a mist of spray
on it), framed by clipped hedges and royal palms. Ends in spray mist (hand-off to Chapter 5,
the foam cannon in the Motor Court).

    blender -b -P renders/scenes/grounds.py -- --preview --only 5,40,70,95
"""
import math
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))
import bpy  # noqa: E402

from common import (  # noqa: E402
    ASSETS, camera, parse_args, pbr_textures, render_frames, reset_scene, setup_render,
    sun_light, world_hdri,
)
from procedural import _box, estate, leafy_hedge, mat_striped_lawn, royal_palm  # noqa: E402

PH = ASSETS / "polyhaven"
HDRI = PH / "hdri" / "kloppenheim_06_puresky_4k.exr"

args = parse_args("grounds", 100)
scene = reset_scene()
setup_render(scene, args)
n = args.frames
scene.frame_start, scene.frame_end = 1, n
coll = scene.collection

# golden hour, sun behind-left of camera so the facade and wet stone catch it
world_hdri(scene, args.hdri or (str(HDRI) if HDRI.exists() else None), strength=0.9, rotation_deg=-100.5)
sun_light("Sun", (74, 0, -35), strength=4.5, color=(1.0, 0.82, 0.6), angle_deg=0.6)

COURT_W, COURT_D = 16.0, 26.0          # x width, y depth (court runs away from camera)
f_start, f_end = round(0.08 * n), round(0.85 * n)
FRONT_Y0, FRONT_Y1 = -4.0, COURT_D - 6.0

# ---- the washing front (shared by shader + spray emitter)
front = bpy.data.objects.new("WashFront", None)
coll.objects.link(front)
for f, y in ((1, FRONT_Y0), (f_start, FRONT_Y0), (f_end, FRONT_Y1), (n, FRONT_Y1 + 2)):
    front.location.y = y
    front.keyframe_insert("location", index=1, frame=f)

# ---- pavers: clean stone under a grime/algae layer that the front strips away
pm = bpy.data.materials.new("Pavers")
pm.use_nodes = True
b = pbr_textures(pm, PH / "tex" / "floor_tiles_08", "floor_tiles_08", tile_m=2.0, tint=(1.04, 0.98, 0.88), bump=0.9) \
    if (PH / "tex" / "floor_tiles_08").exists() else pm.node_tree.nodes["Principled BSDF"]
N, L = pm.node_tree.nodes, pm.node_tree.links
clean_col = b.inputs["Base Color"].links[0].from_socket if b.inputs["Base Color"].is_linked else None
clean_rough = b.inputs["Roughness"].links[0].from_socket if b.inputs["Roughness"].is_linked else None

geo = N.new("ShaderNodeNewGeometry")
gsep = N.new("ShaderNodeSeparateXYZ")
L.new(geo.outputs["Position"], gsep.inputs[0])
fval = N.new("ShaderNodeValue")
for f, y in ((1, FRONT_Y0), (f_start, FRONT_Y0), (f_end, FRONT_Y1), (n, FRONT_Y1 + 2)):
    fval.outputs[0].default_value = y
    fval.outputs[0].keyframe_insert("default_value", frame=f)
# wavy front line
wob = N.new("ShaderNodeTexNoise")
wob.inputs["Scale"].default_value = 0.6
L.new(geo.outputs["Position"], wob.inputs["Vector"])
wob_s = N.new("ShaderNodeMath")
wob_s.operation = "MULTIPLY_ADD"
wob_s.inputs[1].default_value = 1.2
L.new(wob.outputs["Fac"], wob_s.inputs[0])
L.new(fval.outputs[0], wob_s.inputs[2])
dy = N.new("ShaderNodeMath")
dy.operation = "SUBTRACT"
L.new(gsep.outputs["Y"], dy.inputs[0])
L.new(wob_s.outputs[0], dy.inputs[1])
# dirty = ahead of the front (dy > 0)
dirty = N.new("ShaderNodeMapRange")
dirty.inputs["From Min"].default_value = -0.15
dirty.inputs["From Max"].default_value = 0.15
L.new(dy.outputs[0], dirty.inputs["Value"])
# wet = just behind the front, drying over ~3 m
wet = N.new("ShaderNodeMapRange")
wet.inputs["From Min"].default_value = -3.0
wet.inputs["From Max"].default_value = 0.0
L.new(dy.outputs[0], wet.inputs["Value"])
wet_only = N.new("ShaderNodeMath")
wet_only.operation = "SUBTRACT"
L.new(wet.outputs["Result"], wet_only.inputs[0])
L.new(dirty.outputs["Result"], wet_only.inputs[1])
# grime colour: dark, mottled, with green algae in patches
gn = N.new("ShaderNodeTexNoise")
gn.inputs["Scale"].default_value = 1.8
gn.inputs["Detail"].default_value = 10
L.new(geo.outputs["Position"], gn.inputs["Vector"])
gramp = N.new("ShaderNodeValToRGB")
gramp.color_ramp.elements[0].color = (0.46, 0.43, 0.35, 1)
gramp.color_ramp.elements[1].color = (0.70, 0.65, 0.54, 1)
algae = gramp.color_ramp.elements.new(0.75)
algae.color = (0.36, 0.42, 0.20, 1)
L.new(gn.outputs["Fac"], gramp.inputs["Fac"])
grime_mul = N.new("ShaderNodeMix")
grime_mul.data_type = "RGBA"
grime_mul.blend_type = "MULTIPLY"
grime_mul.inputs["Factor"].default_value = 1.0
if clean_col:
    L.new(clean_col, grime_mul.inputs[6])
L.new(gramp.outputs["Color"], grime_mul.inputs[7])
grime_boost = N.new("ShaderNodeMix")   # multiply darkens too much; lift a little
grime_boost.data_type = "RGBA"
grime_boost.blend_type = "SCREEN"
grime_boost.inputs["Factor"].default_value = 0.0
L.new(grime_mul.outputs[2], grime_boost.inputs[6])
L.new(gramp.outputs["Color"], grime_boost.inputs[7])
col_mix = N.new("ShaderNodeMix")
col_mix.data_type = "RGBA"
L.new(dirty.outputs["Result"], col_mix.inputs["Factor"])
if clean_col:
    L.new(clean_col, col_mix.inputs[6])
L.new(grime_boost.outputs[2], col_mix.inputs[7])
# wet darkening
wet_dark = N.new("ShaderNodeMix")
wet_dark.data_type = "RGBA"
wet_dark.blend_type = "MULTIPLY"
L.new(wet_only.outputs[0], wet_dark.inputs["Factor"])
L.new(col_mix.outputs[2], wet_dark.inputs[6])
wet_dark.inputs[7].default_value = (0.62, 0.62, 0.62, 1)
L.new(wet_dark.outputs[2], b.inputs["Base Color"])
# roughness: grime matte, wet glossy
r_dirty = N.new("ShaderNodeMath")
r_dirty.operation = "MAXIMUM"
if clean_rough:
    L.new(clean_rough, r_dirty.inputs[0])
else:
    r_dirty.inputs[0].default_value = 0.5
rd = N.new("ShaderNodeMath")
rd.operation = "MULTIPLY"
rd.inputs[1].default_value = 0.9
L.new(dirty.outputs["Result"], rd.inputs[0])
L.new(rd.outputs[0], r_dirty.inputs[1])
r_wet = N.new("ShaderNodeMix")
r_wet.data_type = "FLOAT"
L.new(wet_only.outputs[0], r_wet.inputs["Factor"])
L.new(r_dirty.outputs[0], r_wet.inputs[2])
r_wet.inputs[3].default_value = 0.06
L.new(r_wet.outputs[0], b.inputs["Roughness"])

_box("Court", (COURT_W, COURT_D + 8, 0.1), (0, COURT_D / 2 - 6, -0.05), pm, coll)

# ---- frame: striped lawn verges, clipped hedges, royal palms, the estate at the end
lawn = mat_striped_lawn()
for sx in (-1, 1):
    _box(f"Verge{sx}", (8.0, COURT_D + 8, 0.1), (sx * (COURT_W / 2 + 4.0), COURT_D / 2 - 6, -0.07), lawn, coll)
    h = _box(f"Hedge{sx}", (1.2, COURT_D + 4, 2.4), (sx * (COURT_W / 2 + 6.5), COURT_D / 2 - 4, 1.15),
             bpy.data.materials.get("HedgeInner") or bpy.data.materials.new("HedgeInner"), coll)
    leafy_hedge(h, density=650.0, seed=3 + sx)
    for k in range(4):
        p = royal_palm(f"Palm{sx}{k}", height=12.5 + (k % 2) * 1.5, seed=60 + k * 2 + (sx > 0))
        p.location = (sx * (COURT_W / 2 + 1.6), -1.0 + k * 6.5, 0.0)
estate("Estate", origin=(0.0, COURT_D - 2.0, 0.0), width=24.0, depth=12.0)

# ---- spray mist riding the front
mist_m = bpy.data.materials.new("Spray")
mist_m.use_nodes = True
mb = mist_m.node_tree.nodes["Principled BSDF"]
mb.inputs["Base Color"].default_value = (1, 1, 1, 1)
mb.inputs["Roughness"].default_value = 0.05
for key in ("Transmission Weight", "Transmission"):
    if key in mb.inputs:
        mb.inputs[key].default_value = 0.9
        break
bpy.ops.mesh.primitive_ico_sphere_add(subdivisions=1, radius=1, location=(0, 0, -50))
drop = bpy.context.active_object
drop.name = "Droplet"
drop.data.materials.append(mist_m)
bpy.ops.mesh.primitive_plane_add(size=1, location=(0, 0, 0.15))
em = bpy.context.active_object
em.name = "SprayEmitter"
em.scale = (COURT_W * 0.8, 0.4, 1)
em.parent = front
em.show_instancer_for_render = False
ps = em.modifiers.new("Spray", "PARTICLE_SYSTEM").particle_system.settings
ps.count = 16000
ps.frame_start = f_start
ps.frame_end = n
ps.lifetime = 10
ps.normal_factor = 2.2
ps.factor_random = 1.6
ps.effector_weights.gravity = 0.6
ps.render_type = "OBJECT"
ps.instance_object = drop
ps.particle_size = 0.012
ps.size_random = 0.9

# ---- camera: low glide behind the front, rising into the spray at the end
cam = camera(lens=24, location=(0.0, -7.0, 0.55), target=(0.0, 8.0, 0.9))
cam.data.clip_start = 0.02
tgt = bpy.data.objects.new("CamTarget", None)
coll.objects.link(tgt)
tcn = cam.constraints.new("TRACK_TO")
tcn.target, tcn.track_axis, tcn.up_axis = tgt, "TRACK_NEGATIVE_Z", "UP_Y"
for frac, loc, look in ((0.0, (0.0, -7.0, 0.55), (0.0, 8.0, 0.9)),
                        (0.6, (0.3, 2.0, 0.9), (0.0, 16.0, 1.6)),
                        (1.0, (0.4, FRONT_Y1 - 1.5, 1.4), (0.0, FRONT_Y1 + 6, 1.2))):
    f = 1 + round(frac * (n - 1))
    cam.location = loc
    cam.keyframe_insert("location", frame=f)
    tgt.location = look
    tgt.keyframe_insert("location", frame=f)
vs = scene.view_settings
vs.exposure = 0.0
vs.keyframe_insert("exposure", frame=round(0.9 * n))
vs.exposure = 3.5
vs.keyframe_insert("exposure", frame=n)

render_frames(scene, args)
