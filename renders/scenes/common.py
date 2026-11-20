"""
Shared helpers for PBPP Blender scene scripts.

Run any scene headless:
    blender -b -P renders/scenes/car_spin.py -- --model path/to/car.glb --out renders/_work/car-spin --preview

Common CLI flags (after `--`):
    --out DIR          output folder for PNG frames (default renders/_work/<scene>)
    --preview          fast settings: 64 samples, 50% resolution
    --samples N        override Cycles samples (final default 256)
    --res WxH          master resolution (default 1920x1080)
    --frames N         frame count (scene-specific default)
    --hdri PATH        HDRI .exr/.hdr (Poly Haven, CC0). Falls back to Blender's bundled studio lights.
    --only N[,M..]     render only these frame numbers (quick look-dev)
    --device AUTO|HIP|OPTIX|CUDA|METAL|CPU
"""
from __future__ import annotations

import argparse
import math
import os
import sys
from pathlib import Path

import bpy
from mathutils import Vector

REPO = Path(__file__).resolve().parents[2]


# --------------------------------------------------------------------------- args
def parse_args(scene: str, default_frames: int, extra=None) -> argparse.Namespace:
    argv = sys.argv[sys.argv.index("--") + 1 :] if "--" in sys.argv else []
    p = argparse.ArgumentParser(prog=scene)
    p.add_argument("--out", default=str(REPO / "renders" / "_work" / scene))
    p.add_argument("--preview", action="store_true")
    p.add_argument("--samples", type=int, default=None)
    p.add_argument("--res", default="1920x1080")
    p.add_argument("--frames", type=int, default=default_frames)
    p.add_argument("--hdri", default=None)
    p.add_argument("--only", default=None)
    p.add_argument("--device", default="AUTO")
    if extra:
        extra(p)
    a = p.parse_args(argv)
    # Blender resolves relative render paths against the drive root, not the shell's cwd.
    a.out = str(Path(a.out).resolve())
    return a


# --------------------------------------------------------------------------- scene
def reset_scene() -> bpy.types.Scene:
    bpy.ops.wm.read_factory_settings(use_empty=True)
    return bpy.context.scene


def setup_render(scene: bpy.types.Scene, args) -> None:
    w, h = (int(x) for x in args.res.lower().split("x"))
    r = scene.render
    r.engine = "CYCLES"
    r.resolution_x, r.resolution_y = w, h
    r.resolution_percentage = 50 if args.preview else 100
    r.use_persistent_data = True  # keep BVH / textures between frames of the same scene
    r.use_motion_blur = False  # frames are scrubbed by visitors: every frame must be crisp
    r.film_transparent = False
    r.image_settings.file_format = "PNG"
    r.image_settings.color_depth = "16"
    r.image_settings.color_mode = "RGB"

    c = scene.cycles
    c.samples = args.samples or (64 if args.preview else 256)
    # Official Blender builds include OpenImageDenoise; some distro builds don't.
    # (render_frames falls back to no denoise automatically if OIDN is missing.)
    c.use_denoising = True
    try:
        c.denoiser = "OPENIMAGEDENOISE"
    except TypeError:
        pass
    c.max_bounces = 8
    c.glossy_bounces = 4
    c.transmission_bounces = 8
    c.use_adaptive_sampling = True
    c.adaptive_threshold = 0.02   # stop sampling pixels that are already clean
    c.caustics_reflective = False
    c.caustics_refractive = False
    c.sample_clamp_indirect = 8.0

    vs = scene.view_settings
    try:
        vs.view_transform = "AgX"
        for look in ("AgX - Medium High Contrast", "Medium High Contrast"):
            try:
                vs.look = look
                break
            except TypeError:
                continue
    except TypeError:
        vs.view_transform = "Filmic"
    _setup_device(scene, args.device)
    if scene.cycles.device == "CPU":
        r.threads_mode = "AUTO"   # all logical cores


def _is_integrated(name: str) -> bool:
    n = name.lower()
    return n.strip() in ("amd radeon(tm) graphics", "amd radeon graphics") or "uhd graphics" in n or "iris" in n


def _setup_device(scene, wanted: str) -> None:
    prefs = bpy.context.preferences.addons["cycles"].preferences
    order = ["HIP", "OPTIX", "CUDA", "METAL", "ONEAPI"] if wanted.upper() == "AUTO" else [wanted.upper()]
    for kind in order:
        if kind == "CPU":
            break
        try:
            prefs.compute_device_type = kind
        except TypeError:
            continue
        prefs.get_devices()
        gpus = [d for d in prefs.devices if d.type == kind]
        # Skip CPU-integrated GPUs (e.g. Ryzen "AMD Radeon(TM) Graphics"): they share system
        # RAM and slow the discrete card down. Keep them only if nothing else is present.
        discrete = [d for d in gpus if not _is_integrated(d.name)]
        gpus = discrete or gpus
        if gpus:
            for d in prefs.devices:
                d.use = d in gpus
            scene.cycles.device = "GPU"
            print(f"[pbpp] Cycles device: {kind} -> {', '.join(d.name for d in gpus)}")
            return
    scene.cycles.device = "CPU"
    print("[pbpp] Cycles device: CPU (no GPU found)")


# --------------------------------------------------------------------------- world / light
def world_hdri(scene, hdri: str | None, strength=1.0, rotation_deg=0.0, fallback="studio.exr",
               camera_bg=None) -> None:
    world = bpy.data.worlds.new("World")
    scene.world = world
    world.use_nodes = True
    nt = world.node_tree
    nt.nodes.clear()
    out = nt.nodes.new("ShaderNodeOutputWorld")
    bg = nt.nodes.new("ShaderNodeBackground")
    env = nt.nodes.new("ShaderNodeTexEnvironment")
    mapping = nt.nodes.new("ShaderNodeMapping")
    coord = nt.nodes.new("ShaderNodeTexCoord")
    path = hdri or _bundled_studiolight(fallback)
    env.image = bpy.data.images.load(path, check_existing=True)
    mapping.inputs["Rotation"].default_value[2] = math.radians(rotation_deg)
    bg.inputs["Strength"].default_value = strength
    nt.links.new(coord.outputs["Generated"], mapping.inputs["Vector"])
    nt.links.new(mapping.outputs["Vector"], env.inputs["Vector"])
    nt.links.new(env.outputs["Color"], bg.inputs["Color"])
    if camera_bg is None:
        nt.links.new(bg.outputs["Background"], out.inputs["Surface"])
    else:
        # the HDRI still lights and reflects; the camera sees a plain backdrop instead
        lp = nt.nodes.new("ShaderNodeLightPath")
        flat = nt.nodes.new("ShaderNodeBackground")
        flat.inputs["Color"].default_value = (*camera_bg, 1)
        mix = nt.nodes.new("ShaderNodeMixShader")
        nt.links.new(lp.outputs["Is Camera Ray"], mix.inputs["Fac"])
        nt.links.new(bg.outputs["Background"], mix.inputs[1])
        nt.links.new(flat.outputs["Background"], mix.inputs[2])
        nt.links.new(mix.outputs["Shader"], out.inputs["Surface"])
    print(f"[pbpp] world HDRI: {path}")


def world_sky(scene, sun_elevation_deg=8.0, sun_rotation_deg=200.0, strength=0.35) -> None:
    """Physically based Nishita sky: golden hour at low sun elevation."""
    world = bpy.data.worlds.new("Sky")
    scene.world = world
    world.use_nodes = True
    nt = world.node_tree
    nt.nodes.clear()
    out = nt.nodes.new("ShaderNodeOutputWorld")
    bg = nt.nodes.new("ShaderNodeBackground")
    sky = nt.nodes.new("ShaderNodeTexSky")
    # Blender 5.x renamed Nishita -> SINGLE_SCATTERING and added MULTIPLE_SCATTERING.
    for kind in ("MULTIPLE_SCATTERING", "SINGLE_SCATTERING", "NISHITA"):
        try:
            sky.sky_type = kind
            break
        except TypeError:
            continue
    sky.sun_elevation = math.radians(sun_elevation_deg)
    sky.sun_rotation = math.radians(sun_rotation_deg)
    sky.altitude = 20
    sky.air_density = 1.2
    # "dust_density" became "aerosol_density" in Blender 5.x
    setattr(sky, "aerosol_density" if hasattr(sky, "aerosol_density") else "dust_density", 2.5)
    bg.inputs["Strength"].default_value = strength
    nt.links.new(sky.outputs["Color"], bg.inputs["Color"])
    nt.links.new(bg.outputs["Background"], out.inputs["Surface"])


def _bundled_studiolight(name: str) -> str:
    base = Path(bpy.utils.system_resource("DATAFILES")) / "studiolights" / "world"
    p = base / name
    if not p.exists():
        cands = sorted(base.glob("*.exr"))
        if not cands:
            raise FileNotFoundError("No HDRI given and no bundled studiolights found; pass --hdri")
        p = cands[0]
    return str(p)


def area_light(name, location, rotation_deg, size, energy, color=(1, 1, 1)):
    data = bpy.data.lights.new(name, "AREA")
    data.shape = "RECTANGLE"
    data.size, data.size_y = size if isinstance(size, tuple) else (size, size)
    data.energy = energy
    data.color = color
    obj = bpy.data.objects.new(name, data)
    obj.visible_camera = False  # studio softboxes light the subject but never appear in frame
    obj.location = location
    obj.rotation_euler = [math.radians(a) for a in rotation_deg]
    bpy.context.scene.collection.objects.link(obj)
    return obj


def sun_light(name, rotation_deg, strength=3.0, color=(1.0, 0.86, 0.68), angle_deg=1.5):
    data = bpy.data.lights.new(name, "SUN")
    data.energy = strength
    data.color = color
    data.angle = math.radians(angle_deg)
    obj = bpy.data.objects.new(name, data)
    obj.rotation_euler = [math.radians(a) for a in rotation_deg]
    bpy.context.scene.collection.objects.link(obj)
    return obj


# --------------------------------------------------------------------------- materials
ASSETS = REPO / "renders" / "_work" / "assets"


def pbr_textures(m, tex_dir, prefix, tile_m=2.0, coords="WORLD_XY", tint=None, bump=1.0):
    """Wire Poly Haven-style maps (<prefix>_diff/_nor_gl/_rough_2k.*) into a Principled material.
    coords WORLD_XY projects from the top in world metres (good for decks on scaled cubes);
    BOX uses object-space triplanar. Returns the Principled node."""
    N, L = m.node_tree.nodes, m.node_tree.links
    b = N["Principled BSDF"]
    d = Path(tex_dir)
    def find(key):
        hits = sorted(d.glob(f"{prefix}_{key}_*"))
        return str(hits[0]) if hits else None
    if coords == "WORLD_XY":
        geo = N.new("ShaderNodeNewGeometry")
        vec = N.new("ShaderNodeVectorMath")
        vec.operation = "SCALE"
        vec.inputs["Scale"].default_value = 1.0 / tile_m
        L.new(geo.outputs["Position"], vec.inputs[0])
        uv = vec.outputs["Vector"]
    else:
        tc = N.new("ShaderNodeTexCoord")
        mp = N.new("ShaderNodeMapping")
        mp.inputs["Scale"].default_value = (1 / tile_m,) * 3
        L.new(tc.outputs["UV" if coords == "UV" else "Object"], mp.inputs["Vector"])
        uv = mp.outputs["Vector"]
    def img(path, non_color):
        t = N.new("ShaderNodeTexImage")
        t.image = bpy.data.images.load(path, check_existing=True)
        if non_color:
            t.image.colorspace_settings.name = "Non-Color"
        if coords == "BOX":
            t.projection = "BOX"
            t.projection_blend = 0.2
        L.new(uv, t.inputs["Vector"])
        return t
    if (p := find("diff")):
        t = img(p, False)
        if tint is not None:
            mix = N.new("ShaderNodeMix")
            mix.data_type = "RGBA"
            mix.blend_type = "MULTIPLY"
            mix.inputs["Factor"].default_value = 1.0
            mix.inputs[7].default_value = (*tint, 1)
            L.new(t.outputs["Color"], mix.inputs[6])
            L.new(mix.outputs[2], b.inputs["Base Color"])
        else:
            L.new(t.outputs["Color"], b.inputs["Base Color"])
    if (p := find("rough")):
        L.new(img(p, True).outputs["Color"], b.inputs["Roughness"])
    if (p := find("nor_gl")):
        nm = N.new("ShaderNodeNormalMap")
        nm.inputs["Strength"].default_value = bump
        L.new(img(p, True).outputs["Color"], nm.inputs["Color"])
        L.new(nm.outputs["Normal"], b.inputs["Normal"])
    return b


def principled(name, color, roughness=0.4, metallic=0.0, **inputs):
    m = bpy.data.materials.new(name)
    m.use_nodes = True
    b = m.node_tree.nodes["Principled BSDF"]
    b.inputs["Base Color"].default_value = (*color, 1)
    b.inputs["Roughness"].default_value = roughness
    b.inputs["Metallic"].default_value = metallic
    for k, v in inputs.items():
        key = k.replace("_", " ")
        if key in b.inputs:
            b.inputs[key].default_value = v
    return m


def car_paint(name="Paint", color=(0.012, 0.02, 0.045)):
    """Deep navy metallic paint with clearcoat."""
    m = principled(name, color, roughness=0.32, metallic=0.85)
    b = m.node_tree.nodes["Principled BSDF"]
    for key, val in (("Coat Weight", 1.0), ("Coat Roughness", 0.02), ("Clearcoat", 1.0), ("Clearcoat Roughness", 0.02)):
        if key in b.inputs:
            b.inputs[key].default_value = val
    return m


def foam_material():
    """Snow-foam: bright, slightly translucent, soft."""
    m = principled("Foam", (0.95, 0.96, 0.98), roughness=0.55)
    b = m.node_tree.nodes["Principled BSDF"]
    for key, val in (("Subsurface Weight", 0.35), ("Subsurface", 0.35)):
        if key in b.inputs:
            b.inputs[key].default_value = val
    if "Subsurface Radius" in b.inputs:
        b.inputs["Subsurface Radius"].default_value = (0.12, 0.12, 0.12)
    # micro-bubble surface: two Voronoi scales as bump, tiny wet sparkle where cells meet
    N, L = m.node_tree.nodes, m.node_tree.links
    tc = N.new("ShaderNodeTexCoord")
    v1 = N.new("ShaderNodeTexVoronoi")
    v1.feature = "SMOOTH_F1"
    v1.inputs["Scale"].default_value = 260.0
    v2 = N.new("ShaderNodeTexVoronoi")
    v2.inputs["Scale"].default_value = 900.0
    for v in (v1, v2):
        L.new(tc.outputs["Object"], v.inputs["Vector"])
    add = N.new("ShaderNodeMath")
    add.operation = "MULTIPLY_ADD"
    add.inputs[1].default_value = 0.4
    L.new(v2.outputs["Distance"], add.inputs[0])
    L.new(v1.outputs["Distance"], add.inputs[2])
    bump = N.new("ShaderNodeBump")
    bump.inputs["Strength"].default_value = 0.6
    bump.inputs["Distance"].default_value = 0.002
    L.new(add.outputs[0], bump.inputs["Height"])
    L.new(bump.outputs["Normal"], b.inputs["Normal"])
    # slight grey-blue variation so the blanket is not a flat white
    nz = N.new("ShaderNodeTexNoise")
    nz.inputs["Scale"].default_value = 6.0
    L.new(tc.outputs["Object"], nz.inputs["Vector"])
    ramp = N.new("ShaderNodeValToRGB")
    ramp.color_ramp.elements[0].color = (0.58, 0.61, 0.66, 1)
    ramp.color_ramp.elements[1].color = (0.82, 0.84, 0.87, 1)
    L.new(nz.outputs["Fac"], ramp.inputs["Fac"])
    L.new(ramp.outputs["Color"], b.inputs["Base Color"])
    b.inputs["Roughness"].default_value = 0.35
    # dissolve near the spray front: foam_edge (0 at the edge .. 1 fully behind) vs fine noise
    out = N["Material Output"]
    attr = N.new("ShaderNodeAttribute")
    attr.attribute_name = "foam_edge"
    speck = N.new("ShaderNodeTexNoise")
    speck.inputs["Scale"].default_value = 90.0
    speck.inputs["Detail"].default_value = 4.0
    L.new(tc.outputs["Object"], speck.inputs["Vector"])
    keep = N.new("ShaderNodeMath")
    keep.operation = "GREATER_THAN"
    L.new(attr.outputs["Fac"], keep.inputs[0])
    edge_thr = N.new("ShaderNodeMapRange")
    edge_thr.inputs["To Min"].default_value = 0.15
    edge_thr.inputs["To Max"].default_value = 0.85
    L.new(speck.outputs["Fac"], edge_thr.inputs["Value"])
    L.new(edge_thr.outputs["Result"], keep.inputs[1])
    # attribute missing (static foam, no front) -> Fac 0; treat as fully kept
    has = N.new("ShaderNodeMath")
    has.operation = "LESS_THAN"
    has.inputs[1].default_value = 1e-4
    L.new(attr.outputs["Fac"], has.inputs[0])
    keep_any = N.new("ShaderNodeMath")
    keep_any.operation = "MAXIMUM"
    L.new(keep.outputs[0], keep_any.inputs[0])
    L.new(has.outputs[0], keep_any.inputs[1])
    tr = N.new("ShaderNodeBsdfTransparent")
    mix = N.new("ShaderNodeMixShader")
    L.new(keep_any.outputs[0], mix.inputs["Fac"])
    L.new(tr.outputs["BSDF"], mix.inputs[1])
    L.new(b.outputs["BSDF"], mix.inputs[2])
    L.new(mix.outputs["Shader"], out.inputs["Surface"])
    return m


def floor_studio(size=60.0, color=(0.018, 0.02, 0.026), roughness=0.18):
    bpy.ops.mesh.primitive_plane_add(size=size, location=(0, 0, 0))
    floor = bpy.context.active_object
    floor.name = "Floor"
    floor.data.materials.append(principled("Floor", color, roughness=roughness, Specular_IOR_Level=0.6))
    return floor


# --------------------------------------------------------------------------- import / normalize
def import_model(path: str, collection: str | None = None) -> list[bpy.types.Object]:
    path = str(Path(path).resolve())  # Blender resolves relative paths against the drive root
    before = set(bpy.data.objects)
    ext = Path(path).suffix.lower()
    if ext in (".glb", ".gltf"):
        bpy.ops.import_scene.gltf(filepath=path)
    elif ext == ".fbx":
        bpy.ops.import_scene.fbx(filepath=path)
    elif ext == ".obj":
        bpy.ops.wm.obj_import(filepath=path)
    elif ext == ".blend":
        # A .blend may hold several vehicles plus its own studio lights / cameras / floor.
        # `collection` picks one collection (recursively); lights and cameras are always skipped.
        with bpy.data.libraries.load(path, link=False) as (src, dst):
            print(f"[pbpp] collections in {Path(path).name}: {list(src.collections)}")
            if collection:
                if collection not in src.collections:
                    raise ValueError(f"collection {collection!r} not in {list(src.collections)}")
                dst.collections = [collection]
            else:
                dst.objects = list(src.objects)
        if collection:
            def walk(c):
                yield from c.objects
                for ch in c.children:
                    yield from walk(ch)
            loaded = list({o for c in dst.collections if c for o in walk(c)})
        else:
            loaded = [o for o in dst.objects if o is not None]
        for o in loaded:
            if o.type in {"LIGHT", "CAMERA"}:
                continue
            if o.name not in bpy.context.scene.collection.objects:
                bpy.context.scene.collection.objects.link(o)
    else:
        raise ValueError(f"Unsupported model format: {ext}")
    objs = [o for o in bpy.data.objects if o not in before and o.type not in {"LIGHT", "CAMERA"}]
    print(f"[pbpp] imported {len(objs)} objects from {path}")
    return objs


INTERIOR_WORDS = ("seat", "dashboard", "pedal", "steering", "engine", "interior", "carpet", "headliner")


def tag_interior(objs, words=INTERIOR_WORDS) -> int:
    """Mark cabin / engine-bay parts so exterior effects (foam) skip them."""
    n = 0
    for o in objs:
        if any(w in o.name.lower() for w in words):
            o["pbpp_interior"] = True
            n += 1
    return n


def drop_ground_planes(objs, min_size=8.0):
    """Hide big flat planes shipped with a model (studio floors) and return the rest."""
    keep = []
    for o in objs:
        if o.type == "MESH" and o.name.lower().startswith("plane"):
            d = o.dimensions
            if max(d.x, d.y) > min_size or min(d) < 1e-4:
                o.hide_render = o.hide_viewport = True
                print(f"[pbpp] hid ground plane {o.name} {tuple(round(v, 2) for v in d)}")
                continue
        keep.append(o)
    return keep


def world_bbox(objs) -> tuple[Vector, Vector]:
    lo = Vector((math.inf,) * 3)
    hi = Vector((-math.inf,) * 3)
    bpy.context.view_layer.update()
    for o in objs:
        if o.type not in {"MESH", "CURVE", "SURFACE", "META", "FONT"}:
            continue
        if o.hide_render:  # hidden parts are not evaluated; their bound_box is stale
            continue
        for c in o.bound_box:
            w = o.matrix_world @ Vector(c)
            lo = Vector(map(min, lo, w))
            hi = Vector(map(max, hi, w))
    return lo, hi


def normalize(objs, target_length: float, name="Subject") -> bpy.types.Object:
    """Parent objects to an empty, scale so the longest horizontal side == target_length,
    center on the origin, and rest on the floor (z=0). Returns the root empty."""
    root = bpy.data.objects.new(name, None)
    bpy.context.scene.collection.objects.link(root)
    tops = [o for o in objs if o.parent is None or o.parent not in objs]
    for o in tops:
        o.parent = root
    lo, hi = world_bbox(objs)
    size = hi - lo
    s = target_length / max(size.x, size.y, 1e-6)
    root.scale = (s, s, s)
    bpy.context.view_layer.update()
    lo, hi = world_bbox(objs)
    center = (lo + hi) / 2
    # Move the children (not the root) so the root's origin -- the turntable pivot -- sits at
    # the subject's centre. Moving the root instead makes an off-origin model orbit.
    shift = Vector((center.x, center.y, lo.z)) / s
    for o in tops:
        o.location -= shift
    bpy.context.view_layer.update()
    return root


PAINTS = {
    "navy": (0.010, 0.020, 0.050),      # brand deep navy (#081A2E family)
    "white": (0.80, 0.80, 0.78),        # pearl white
    "rosso": (0.32, 0.012, 0.010),      # deep Italian red
}


def recolor_paint(objs, rgb) -> int:
    """Set the body-paint base colour on a purchased model (materials named like '* car paint *'
    or 'open door paint *'); leaves its flake/roughness/coat setup intact."""
    done = set()
    for o in objs:
        if o.type != "MESH":
            continue
        for m in o.data.materials:
            if not m or m.name in done or not m.node_tree:
                continue
            n = m.name.lower()
            if ("car paint" in n or "door paint" in n) and "caliper" not in n:
                for node in m.node_tree.nodes:
                    if node.bl_idname == "ShaderNodeBsdfPrincipled" and not node.inputs["Base Color"].is_linked:
                        node.inputs["Base Color"].default_value = (*rgb, 1)
                done.add(m.name)
    print(f"[pbpp] repainted {len(done)} paint materials")
    return len(done)


def strip_branding(objs, words=("logo", "badge", "emblem", "plate", "license", "decal", "text")) -> int:
    """Hide objects whose names suggest manufacturer branding or plates (brand rule)."""
    n = 0
    for o in objs:
        if any(w in o.name.lower() for w in words):
            o.hide_render = True
            o.hide_viewport = True
            n += 1
    if n:
        print(f"[pbpp] hid {n} branding/plate objects")
    return n


# --------------------------------------------------------------------------- camera / render
def camera(name="Camera", lens=50.0, location=(0, -10, 2), target=(0, 0, 0.8)):
    data = bpy.data.cameras.new(name)
    data.lens = lens
    data.sensor_width = 36
    cam = bpy.data.objects.new(name, data)
    bpy.context.scene.collection.objects.link(cam)
    cam.location = location
    look_at(cam, target)
    bpy.context.scene.camera = cam
    return cam


def look_at(obj, target):
    direction = Vector(target) - obj.location
    obj.rotation_euler = direction.to_track_quat("-Z", "Y").to_euler()


def track_to(obj, target_obj):
    c = obj.constraints.new("TRACK_TO")
    c.target = target_obj
    c.track_axis = "TRACK_NEGATIVE_Z"
    c.up_axis = "UP_Y"
    return c


def iter_fcurves(idblock):
    """F-curves of an ID's action. Works with Blender 4.4+ slotted actions (5.x removed
    Action.fcurves) and with legacy actions on older builds."""
    ad = getattr(idblock, "animation_data", None)
    act = ad.action if ad else None
    if act is None:
        return
    layers = getattr(act, "layers", None)
    if layers:
        slot = getattr(ad, "action_slot", None)
        for layer in layers:
            for strip in layer.strips:
                bags = [strip.channelbag(slot)] if slot is not None and hasattr(strip, "channelbag") else list(strip.channelbags)
                for bag in bags:
                    if bag is not None:
                        yield from bag.fcurves
    elif hasattr(act, "fcurves"):
        yield from act.fcurves


def linear_keys(obj):
    """Make every keyframe on obj linear (constant-speed moves for scrubbing)."""
    for fc in iter_fcurves(obj):
        for kp in fc.keyframe_points:
            kp.interpolation = "LINEAR"


def render_frames(scene, args) -> None:
    out = Path(args.out)
    out.mkdir(parents=True, exist_ok=True)
    frames = range(scene.frame_start, scene.frame_end + 1)
    if args.only:
        frames = [int(x) for x in args.only.split(",")]
    # Particle systems are only simulated when frames are stepped in order; jumping straight
    # to frame 140 (--only) would render an empty system. Step through once to fill the cache.
    if any(o.particle_systems for o in scene.objects if hasattr(o, "particle_systems")):
        for f in range(scene.frame_start, max(frames) + 1):
            scene.frame_set(f)
    for f in frames:
        scene.frame_set(f)
        scene.render.filepath = str(out / f"{f:03d}.png")
        try:
            bpy.ops.render.render(write_still=True)
        except RuntimeError as e:
            if "OpenImageDenoise" not in str(e) or not scene.cycles.use_denoising:
                raise
            print("[pbpp] OpenImageDenoise unavailable in this Blender build: rendering without denoise")
            scene.cycles.use_denoising = False
            bpy.ops.render.render(write_still=True)
        print(f"[pbpp] frame {f}/{scene.frame_end}")
    print(f"[pbpp] done -> {out}")
