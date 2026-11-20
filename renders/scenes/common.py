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
    return p.parse_args(argv)


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
    c.max_bounces = 10
    c.glossy_bounces = 6
    c.transmission_bounces = 10
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
        if gpus:
            for d in prefs.devices:
                d.use = d.type == kind
            scene.cycles.device = "GPU"
            print(f"[pbpp] Cycles device: {kind} -> {', '.join(d.name for d in gpus)}")
            return
    scene.cycles.device = "CPU"
    print("[pbpp] Cycles device: CPU (no GPU found)")


# --------------------------------------------------------------------------- world / light
def world_hdri(scene, hdri: str | None, strength=1.0, rotation_deg=0.0, fallback="studio.exr") -> None:
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
    nt.links.new(bg.outputs["Background"], out.inputs["Surface"])
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
    sky.sky_type = "NISHITA"
    sky.sun_elevation = math.radians(sun_elevation_deg)
    sky.sun_rotation = math.radians(sun_rotation_deg)
    sky.altitude = 20
    sky.air_density = 1.2
    sky.dust_density = 2.5
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
    return m


def floor_studio(size=60.0, color=(0.018, 0.02, 0.026), roughness=0.18):
    bpy.ops.mesh.primitive_plane_add(size=size, location=(0, 0, 0))
    floor = bpy.context.active_object
    floor.name = "Floor"
    floor.data.materials.append(principled("Floor", color, roughness=roughness, Specular_IOR_Level=0.6))
    return floor


# --------------------------------------------------------------------------- import / normalize
def import_model(path: str) -> list[bpy.types.Object]:
    before = set(bpy.data.objects)
    ext = Path(path).suffix.lower()
    if ext in (".glb", ".gltf"):
        bpy.ops.import_scene.gltf(filepath=path)
    elif ext == ".fbx":
        bpy.ops.import_scene.fbx(filepath=path)
    elif ext == ".obj":
        bpy.ops.wm.obj_import(filepath=path)
    elif ext == ".blend":
        with bpy.data.libraries.load(path, link=False) as (src, dst):
            dst.objects = list(src.objects)
        for o in dst.objects:
            if o is not None:
                bpy.context.scene.collection.objects.link(o)
    else:
        raise ValueError(f"Unsupported model format: {ext}")
    objs = [o for o in bpy.data.objects if o not in before]
    print(f"[pbpp] imported {len(objs)} objects from {path}")
    return objs


def world_bbox(objs) -> tuple[Vector, Vector]:
    lo = Vector((math.inf,) * 3)
    hi = Vector((-math.inf,) * 3)
    bpy.context.view_layer.update()
    for o in objs:
        if o.type not in {"MESH", "CURVE", "SURFACE", "META", "FONT"}:
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
    root.location -= Vector((center.x, center.y, lo.z))
    bpy.context.view_layer.update()
    return root


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


def linear_keys(obj):
    """Make every keyframe on obj linear (constant-speed moves for scrubbing)."""
    ad = obj.animation_data
    if not ad or not ad.action:
        return
    for fc in ad.action.fcurves:
        for kp in fc.keyframe_points:
            kp.interpolation = "LINEAR"


def render_frames(scene, args) -> None:
    out = Path(args.out)
    out.mkdir(parents=True, exist_ok=True)
    frames = range(scene.frame_start, scene.frame_end + 1)
    if args.only:
        frames = [int(x) for x in args.only.split(",")]
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
