"""
residence: Chapter 2 of "The Dive" -- The Residence (estate & residential cleaning).

We surface from the pool into light: the frame opens on a bright white flash that settles
into a spotless salon -- white plaster, polished marble, linen, brass and white hydrangeas --
and the camera glides toward the tall arched windows (the hand-off to Chapter 3, The Glass).

    blender -b -P renders/scenes/residence.py -- --preview --only 1,30,60,95

CC0 assets (Poly Haven) from renders/_work/assets/polyhaven: marble_01 texture, sky HDRI,
modern_coffee_table_02, coffee_table_round_01, modern_arm_chair_01, ceramic_vase_01/04,
brass_vase_03, potted_plant_02. Sofa, curtains, hydrangeas, architecture: generated here.
"""
import math
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))
import bmesh  # noqa: E402
import bpy  # noqa: E402
from mathutils import Vector  # noqa: E402

from common import (  # noqa: E402
    ASSETS, camera, import_model, normalize, parse_args, pbr_textures, render_frames,
    reset_scene, setup_render, sun_light, world_hdri,
)
from procedural import (  # noqa: E402
    _arch_cutter, _arch_panel, _box, hydrangea, leafy_hedge, mat_canvas, mat_steel, royal_palm,
)
from procedural_car import see_through_glass  # noqa: E402

PH = ASSETS / "polyhaven"
HDRI = PH / "hdri" / "kloppenheim_06_puresky_4k.exr"

args = parse_args("residence", 100)
scene = reset_scene()
setup_render(scene, args)
n = args.frames
scene.frame_start, scene.frame_end = 1, n

# late-morning light pouring in through the windows on the +Y wall
world_hdri(scene, args.hdri or (str(HDRI) if HDRI.exists() else None), strength=1.1, rotation_deg=60)
sun = sun_light("Sun", (58, 0, 168), strength=5.5, color=(1.0, 0.93, 0.82), angle_deg=1.0)

W, D, H = 12.0, 8.0, 4.4          # room: x width, y depth, height
coll = bpy.context.scene.collection


def mat(name, color, rough=0.5, **kw):
    m = bpy.data.materials.new(name)
    m.use_nodes = True
    b = m.node_tree.nodes["Principled BSDF"]
    b.inputs["Base Color"].default_value = (*color, 1)
    b.inputs["Roughness"].default_value = rough
    for k, v in kw.items():
        if k.replace("_", " ") in b.inputs:
            b.inputs[k.replace("_", " ")].default_value = v
    return m


def plaster():
    m = mat("WhitePlaster", (0.86, 0.84, 0.80), 0.9)
    N, L = m.node_tree.nodes, m.node_tree.links
    noise = N.new("ShaderNodeTexNoise")
    noise.inputs["Scale"].default_value = 40
    noise.inputs["Detail"].default_value = 8
    bump = N.new("ShaderNodeBump")
    bump.inputs["Strength"].default_value = 0.05
    L.new(noise.outputs["Fac"], bump.inputs["Height"])
    L.new(bump.outputs["Normal"], N["Principled BSDF"].inputs["Normal"])
    return m


def marble():
    m = bpy.data.materials.new("MarbleFloor")
    m.use_nodes = True
    t = PH / "tex" / "marble_01"
    b = m.node_tree.nodes["Principled BSDF"]
    if t.exists():
        pbr_textures(m, t, "marble_01", tile_m=1.6, tint=(1.05, 1.03, 1.0), bump=0.3)
        # polished: pull roughness well down so the windows reflect in the floor
        N, L = m.node_tree.nodes, m.node_tree.links
        rl = b.inputs["Roughness"].links
        if rl:
            src = rl[0].from_socket
            mul = N.new("ShaderNodeMath")
            mul.operation = "MULTIPLY"
            mul.inputs[1].default_value = 0.25
            L.new(src, mul.inputs[0])
            L.new(mul.outputs[0], b.inputs["Roughness"])
    else:
        b.inputs["Base Color"].default_value = (0.85, 0.84, 0.82, 1)
        b.inputs["Roughness"].default_value = 0.08
    return m


wall_m, floor_m = plaster(), marble()
ceil_m = mat("Ceiling", (0.90, 0.89, 0.86), 0.95)

# ---- shell
_box("Floor", (W, D, 0.1), (0, 0, -0.05), floor_m, coll)
_box("Ceiling", (W, D, 0.1), (0, 0, H + 0.05), ceil_m, coll)
_box("WallW", (0.3, D, H), (-W / 2 - 0.15, 0, H / 2), wall_m, coll)
_box("WallE", (0.3, D, H), (W / 2 + 0.15, 0, H / 2), wall_m, coll)
_box("WallS", (W + 0.6, 0.3, H), (0, -D / 2 - 0.15, H / 2), wall_m, coll)
back = _box("WallN", (W + 0.6, 0.4, H), (0, D / 2 + 0.2, H / 2), wall_m, coll)
# crown moulding + baseboard
for nm, size, loc in (("CrownN", (W, 0.12, 0.16), (0, D / 2 - 0.06, H - 0.08)),
                      ("CrownS", (W, 0.12, 0.16), (0, -D / 2 + 0.06, H - 0.08)),
                      ("BaseN", (W, 0.03, 0.14), (0, D / 2 - 0.015, 0.07)),
                      ("BaseW", (0.03, D, 0.14), (-W / 2 + 0.015, 0, 0.07)),
                      ("BaseE", (0.03, D, 0.14), (W / 2 - 0.015, 0, 0.07))):
    _box(nm, size, loc, wall_m, coll, bevel=0.01)

# three tall arched windows in the north wall (steel muntins, clear glass)
cut_coll = bpy.data.collections.new("WindowCutters")
coll.children.link(cut_coll)
bo = back.modifiers.new("Windows", "BOOLEAN")
bo.operation, bo.solver, bo.operand_type, bo.collection = "DIFFERENCE", "EXACT", "COLLECTION", cut_coll
glass, steel = see_through_glass(), mat_steel()
# window glass: clearer and less mirror-like than car glass, so the garden reads through it
_gn = glass.node_tree.nodes
for node in _gn:
    if node.bl_idname == "ShaderNodeBsdfTransparent":
        node.inputs["Color"].default_value = (0.95, 0.95, 0.94, 1)
    if node.bl_idname == "ShaderNodeMath" and node.operation == "MULTIPLY_ADD":
        node.inputs[1].default_value = 0.45
        node.inputs[2].default_value = 0.01
WIN_X = (-3.6, 0.0, 3.6)
for i, x in enumerate(WIN_X):
    w, h = 2.0, 3.4
    _, pts = _arch_cutter(f"WinCut{i}", w, h, 1.0, (x, D / 2 + 0.2, 0.35), cut_coll)
    g = _arch_panel(f"WinGlass{i}", [(px, pz + 0.35) for px, pz in pts], D / 2 + 0.2, glass, coll)
    g.location.x = x
    for k, mx in enumerate((-0.5, 0.0, 0.5)):
        _box(f"Mull{i}{k}", (0.035, 0.05, h - 0.1), (x + mx * w * 0.5, D / 2 + 0.18, 0.35 + (h - 0.1) / 2), steel, coll)
    for k, z in enumerate((1.25, 2.35)):
        _box(f"Tran{i}{k}", (w, 0.05, 0.03), (x, D / 2 + 0.18, z), steel, coll)
    # sheer linen curtains either side of each window
    for side in (-1, 1):
        bm = bmesh.new()
        cols, rows = 14, 2
        vs = [[bm.verts.new((side * (w / 2 + 0.05 + c * 0.03) + 0.05 * math.sin(c * 1.7) * side, 0.06 * math.sin(c * 1.9), r * H))
               for r in range(rows)] for c in range(cols)]
        for c in range(cols - 1):
            bm.faces.new((vs[c][0], vs[c + 1][0], vs[c + 1][1], vs[c][1]))
        me = bpy.data.meshes.new(f"Curtain{i}{side}")
        bm.to_mesh(me)
        bm.free()
        cm = bpy.data.materials.get("Sheer") or mat("Sheer", (0.95, 0.93, 0.88), 0.9)
        if not cm.get("_t"):
            N, L = cm.node_tree.nodes, cm.node_tree.links
            tr = N.new("ShaderNodeBsdfTranslucent")
            tr.inputs["Color"].default_value = (0.97, 0.94, 0.88, 1)
            mix = N.new("ShaderNodeMixShader")
            mix.inputs["Fac"].default_value = 0.55
            L.new(N["Principled BSDF"].outputs["BSDF"], mix.inputs[1])
            L.new(tr.outputs["BSDF"], mix.inputs[2])
            L.new(mix.outputs["Shader"], N["Material Output"].inputs["Surface"])
            cm["_t"] = True
        me.materials.append(cm)
        cur = bpy.data.objects.new(f"Curtain{i}{side}", me)
        coll.objects.link(cur)
        cur.location = (x, D / 2 - 0.12, 0.0)
        cur.visible_shadow = False  # sheer: let the light through
        for p in me.polygons:
            p.use_smooth = True

# light portals in the windows (cleaner interior light from the sky)
for i, x in enumerate(WIN_X):
    pd = bpy.data.lights.new(f"Portal{i}", "AREA")
    pd.shape, pd.size, pd.size_y = "RECTANGLE", 2.0, 3.4
    pd.cycles.is_portal = True
    po = bpy.data.objects.new(f"Portal{i}", pd)
    coll.objects.link(po)
    po.location = (x, D / 2 + 0.45, 0.35 + 1.7)
    po.rotation_euler = (math.radians(-90), 0, 0)

# soft interior bounce fill (keeps the shadow side airy, "as if light came through linen")
fd = bpy.data.lights.new("Fill", "AREA")
fd.shape, fd.size, fd.size_y, fd.energy, fd.color = "RECTANGLE", 8.0, 5.0, 260, (1.0, 0.95, 0.88)
fo = bpy.data.objects.new("Fill", fd)
coll.objects.link(fo)
fo.location = (0, -1.0, H - 0.05)
fo.visible_camera = False

# ---- garden outside the windows
from procedural import mat_striped_lawn  # noqa: E402
lawn = mat_striped_lawn()
_box("Terrace", (40, 30, 0.1), (0, D / 2 + 15.4, -0.3), lawn, coll)
for k, x in enumerate((-9.0, -4.2, 4.6, 9.5)):
    p = royal_palm(f"GardenPalm{k}", height=12.5 + k % 2, seed=30 + k)
    p.location = (x, D / 2 + 11.0 + (k % 2) * 3.0, -0.3)
# clipped ficus hedge closing the garden (no bare horizon through the windows)
hedge_m = mat("HedgeBase", (0.02, 0.05, 0.015), 0.8)
gh = _box("GardenHedge", (34, 1.4, 3.4), (0, D / 2 + 17.5, 1.4), hedge_m, coll)
leafy_hedge(gh, density=500.0, seed=7)

# ---- furniture
linen = mat("Linen", (0.80, 0.76, 0.68), 0.95, Sheen_Weight=0.4)
rug_m = mat("Rug", (0.78, 0.74, 0.66), 1.0)
_box("Rug", (5.2, 3.6, 0.02), (0, 0.4, 0.01), rug_m, coll, bevel=0.005)


def soft(o, lv=2):
    s_ = o.modifiers.new("Smooth", "SUBSURF")
    s_.levels = s_.render_levels = lv
    return o


# linen sofa on the west side, facing east
sx = -2.9
soft(_box("SofaBase", (1.0, 2.9, 0.42), (sx, 0.4, 0.23), linen, coll, bevel=0.04))
soft(_box("SofaBack", (0.25, 2.9, 0.55), (sx - 0.4, 0.4, 0.68), linen, coll, bevel=0.06))
for k, y in enumerate((-0.55, 0.4, 1.35)):
    soft(_box(f"SofaSeat{k}", (0.78, 0.92, 0.16), (sx + 0.08, y, 0.52), linen, coll, bevel=0.05))
    soft(_box(f"SofaCush{k}", (0.18, 0.8, 0.5), (sx - 0.22, y, 0.82), linen, coll, bevel=0.07))
for y in (-1.05, 1.85):
    soft(_box(f"SofaArm{y}", (1.0, 0.22, 0.62), (sx, y, 0.33), linen, coll, bevel=0.05))


def place(model, length, loc, yaw=0.0):
    g = PH / "models" / model / f"{model}_1k.gltf"
    if not g.exists():
        print(f"[pbpp] missing {model}")
        return None
    root = normalize(import_model(str(g)), length, model)
    root.location = loc
    root.rotation_euler[2] = math.radians(yaw)
    return root


place("coffee_table_round_01", 1.15, (-1.2, 0.4, 0.0))
place("coffee_table_round_01", 0.55, (-2.9, 2.35, 0.0))
place("modern_arm_chair_01", 0.85, (1.1, -0.3, 0.0), 120)
place("modern_arm_chair_01", 0.85, (1.1, 1.3, 0.0), 60)
place("brass_vase_03", 0.28, (-1.45, 0.25, 0.42))
place("ceramic_vase_04", 0.32, (-2.9, 2.35, 0.55))
place("potted_plant_02", 0.75, (5.2, 3.2, 0.0))
place("ceramic_vase_01", 0.38, (-5.4, 3.3, 0.0))
# white hydrangeas in the vases
hydrangea("Hydrangea0", (-1.45, 0.25, 0.80), 0.13, coll, seed=1)
hydrangea("Hydrangea1", (-2.9, 2.35, 0.98), 0.12, coll, seed=2)
hydrangea("Hydrangea2", (-1.30, 0.40, 0.76), 0.10, coll, seed=3)

# ---- camera: surface into light, glide toward the centre window
cam = camera(lens=26, location=(0.6, -3.6, 1.15), target=(0.0, 4.0, 1.6))
cam.data.clip_start = 0.02
target = bpy.data.objects.new("CamTarget", None)
coll.objects.link(target)
tc = cam.constraints.new("TRACK_TO")
tc.target, tc.track_axis, tc.up_axis = target, "TRACK_NEGATIVE_Z", "UP_Y"
for frac, loc, look in ((0.0, (0.6, -3.6, 1.15), (0.0, 4.0, 1.5)),
                        (0.55, (0.25, -0.2, 1.45), (0.0, 4.0, 1.9)),
                        (1.0, (0.0, 2.95, 1.95), (0.0, 4.5, 2.0))):
    f = 1 + round(frac * (n - 1))
    cam.location = loc
    cam.keyframe_insert("location", frame=f)
    target.location = look
    target.keyframe_insert("location", frame=f)

# opening flash: exposure falls from +4 to 0 over the first ~12% ("surfacing into light")
vs = scene.view_settings
vs.exposure = 4.0
vs.keyframe_insert("exposure", frame=1)
vs.exposure = 0.0
vs.keyframe_insert("exposure", frame=1 + round(0.12 * (n - 1)))

render_frames(scene, args)
