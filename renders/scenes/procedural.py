"""
Procedural, license-free assets for the PBPP scenes (no purchased models needed).

    royal_palm(name, height, seed)          -> Roystonea-style palm (trunk, crownshaft, plumose fronds)
    estate(name, origin, width, depth)      -> fictional Mediterranean Revival house (stucco,
                                               terracotta hip roof, recessed arched glass doors)

Everything is generated from code; textures are CC0 Poly Haven maps from
renders/_work/assets/polyhaven/tex when present (procedural fallbacks otherwise).
No house numbers, signage, or text are ever generated.
"""
from __future__ import annotations

import math
import random
from pathlib import Path

import bmesh
import bpy
from mathutils import Matrix, Vector

from common import ASSETS, pbr_textures

TEX = ASSETS / "polyhaven" / "tex"


# --------------------------------------------------------------------------- helpers
def _mat(name):
    m = bpy.data.materials.get(name)
    if m is None:
        m = bpy.data.materials.new(name)
        m.use_nodes = True
    return m


def _link(obj, coll=None):
    (coll or bpy.context.scene.collection).objects.link(obj)
    return obj


def _mesh_obj(name, bm, mats, coll=None):
    me = bpy.data.meshes.new(name)
    bm.to_mesh(me)
    bm.free()
    for m in mats:
        me.materials.append(m)
    for p in me.polygons:
        p.use_smooth = True
    return _link(bpy.data.objects.new(name, me), coll)


# --------------------------------------------------------------------------- palm materials
def mat_palm_trunk():
    m = _mat("PalmTrunk")
    if m.get("_built"):
        return m
    N, L = m.node_tree.nodes, m.node_tree.links
    b = N["Principled BSDF"]
    tc = N.new("ShaderNodeTexCoord")
    sep = N.new("ShaderNodeSeparateXYZ")
    L.new(tc.outputs["Object"], sep.inputs[0])
    # leaf-scar rings: thin darker bands every ~6-10 cm, irregular
    wave = N.new("ShaderNodeTexWave")
    wave.wave_type = "BANDS"
    wave.bands_direction = "Z"
    wave.inputs["Scale"].default_value = 7.0
    wave.inputs["Distortion"].default_value = 1.2
    wave.inputs["Detail"].default_value = 3
    L.new(tc.outputs["Object"], wave.inputs["Vector"])
    noise = N.new("ShaderNodeTexNoise")
    noise.inputs["Scale"].default_value = 9
    noise.inputs["Detail"].default_value = 10
    L.new(tc.outputs["Object"], noise.inputs["Vector"])
    ring = N.new("ShaderNodeMapRange")
    ring.inputs["From Min"].default_value = 0.9
    ring.inputs["From Max"].default_value = 1.0
    L.new(wave.outputs["Fac"], ring.inputs["Value"])
    ramp = N.new("ShaderNodeValToRGB")
    ramp.color_ramp.elements[0].color = (0.27, 0.26, 0.245, 1)
    ramp.color_ramp.elements[1].color = (0.40, 0.385, 0.36, 1)
    L.new(noise.outputs["Fac"], ramp.inputs["Fac"])
    dark = N.new("ShaderNodeMix")
    dark.data_type = "RGBA"
    dark.blend_type = "MULTIPLY"
    dark.inputs[7].default_value = (0.88, 0.86, 0.83, 1)
    L.new(ring.outputs["Result"], dark.inputs["Factor"])
    L.new(ramp.outputs["Color"], dark.inputs[6])
    # weathered, darker base (splash zone / soil) fading out over the first ~1.2 m
    base_fade = N.new("ShaderNodeMapRange")
    base_fade.inputs["From Min"].default_value = 0.0
    base_fade.inputs["From Max"].default_value = 1.2
    base_fade.inputs["To Min"].default_value = 0.55
    L.new(sep.outputs["Z"], base_fade.inputs["Value"])
    grime = N.new("ShaderNodeMix")
    grime.data_type = "RGBA"
    grime.blend_type = "MULTIPLY"
    grime.inputs["Factor"].default_value = 1.0
    L.new(dark.outputs[2], grime.inputs[6])
    gcol = N.new("ShaderNodeCombineXYZ")
    for ch in ("X", "Y", "Z"):
        L.new(base_fade.outputs["Result"], gcol.inputs[ch])
    L.new(gcol.outputs[0], grime.inputs[7])
    L.new(grime.outputs[2], b.inputs["Base Color"])
    bump = N.new("ShaderNodeBump")
    bump.inputs["Strength"].default_value = 0.2
    add = N.new("ShaderNodeMath")
    add.operation = "ADD"
    L.new(noise.outputs["Fac"], add.inputs[0])
    L.new(ring.outputs["Result"], add.inputs[1])
    L.new(add.outputs[0], bump.inputs["Height"])
    L.new(bump.outputs["Normal"], b.inputs["Normal"])
    b.inputs["Roughness"].default_value = 0.8
    m["_built"] = True
    return m


def mat_crownshaft():
    m = _mat("PalmCrownshaft")
    if m.get("_built"):
        return m
    N, L = m.node_tree.nodes, m.node_tree.links
    b = N["Principled BSDF"]
    noise = N.new("ShaderNodeTexNoise")
    noise.inputs["Scale"].default_value = 4
    ramp = N.new("ShaderNodeValToRGB")
    ramp.color_ramp.elements[0].color = (0.10, 0.22, 0.05, 1)
    ramp.color_ramp.elements[1].color = (0.18, 0.32, 0.08, 1)
    L.new(noise.outputs["Fac"], ramp.inputs["Fac"])
    L.new(ramp.outputs["Color"], b.inputs["Base Color"])
    b.inputs["Roughness"].default_value = 0.35
    m["_built"] = True
    return m


def mat_frond():
    m = _mat("PalmFrond")
    if m.get("_built"):
        return m
    N, L = m.node_tree.nodes, m.node_tree.links
    out = N["Material Output"]
    b = N["Principled BSDF"]
    oi = N.new("ShaderNodeObjectInfo")
    attr = N.new("ShaderNodeAttribute")
    attr.attribute_name = "leaf_age"
    mixc = N.new("ShaderNodeValToRGB")
    els = mixc.color_ramp.elements
    els[0].position, els[0].color = 0.0, (0.07, 0.17, 0.03, 1)
    els[1].position, els[1].color = 1.0, (0.20, 0.24, 0.07, 1)
    add = N.new("ShaderNodeMath")
    add.operation = "MULTIPLY_ADD"
    add.inputs[1].default_value = 0.85
    L.new(attr.outputs["Fac"], add.inputs[0])
    mulr = N.new("ShaderNodeMath")
    mulr.operation = "MULTIPLY"
    mulr.inputs[1].default_value = 0.15
    L.new(oi.outputs["Random"], mulr.inputs[0])
    L.new(mulr.outputs[0], add.inputs[2])
    L.new(add.outputs[0], mixc.inputs["Fac"])
    L.new(mixc.outputs["Color"], b.inputs["Base Color"])
    b.inputs["Roughness"].default_value = 0.42
    trans = N.new("ShaderNodeBsdfTranslucent")
    trans.inputs["Color"].default_value = (0.22, 0.38, 0.06, 1)
    mix = N.new("ShaderNodeMixShader")
    mix.inputs["Fac"].default_value = 0.22
    L.new(b.outputs["BSDF"], mix.inputs[1])
    L.new(trans.outputs["BSDF"], mix.inputs[2])
    L.new(mix.outputs["Shader"], out.inputs["Surface"])
    m["_built"] = True
    return m


# --------------------------------------------------------------------------- royal palm
def royal_palm(name="RoyalPalm", height=14.0, seed=1, fronds=16, coll=None):
    """Roystonea regia look: smooth pale-grey columnar trunk with a mid swelling, glossy
    green crownshaft, and a crown of arching plumose fronds (leaflets in several planes)."""
    rng = random.Random(seed)
    mats = [mat_palm_trunk(), mat_crownshaft(), mat_frond()]
    bm = bmesh.new()
    age_layer = bm.verts.layers.float.new("leaf_age")

    # ---- trunk + crownshaft as one lofted tube with a gentle lean
    shaft_len = height * 0.17
    trunk_len = height - shaft_len
    lean = Vector((rng.uniform(-1, 1), rng.uniform(-1, 1), 0)).normalized() * rng.uniform(0.15, 0.55)
    segs, rings = 20, 46

    def center(h):
        u = h / height
        return Vector((0, 0, h)) + lean * (u ** 2)

    prev = None
    ring_list = []
    for i in range(rings + 1):
        h = height * i / rings
        u = h / height
        if h <= trunk_len:
            uu = h / trunk_len
            r = 0.30 + 0.07 * math.sin(math.pi * min(uu * 1.15, 1.0)) - 0.05 * uu + (0.10 * max(0, 0.06 - uu) / 0.06)
        else:
            r = 0.27 - 0.03 * ((h - trunk_len) / shaft_len)
        c = center(h)
        ring = [bm.verts.new(c + Vector((math.cos(a) * r, math.sin(a) * r, 0)))
                for a in (2 * math.pi * k / segs for k in range(segs))]
        for v in ring:
            v[age_layer] = 0.0
        if prev:
            mi = 0 if h <= trunk_len + 1e-6 else 1
            for k in range(segs):
                f = bm.faces.new((prev[k], prev[(k + 1) % segs], ring[(k + 1) % segs], ring[k]))
                f.material_index = mi
        prev = ring
        ring_list.append(ring)
    bm.faces.new(list(reversed(prev))).material_index = 1
    top = center(height)

    # ---- fronds
    up = Vector((0, 0, 1))
    golden = math.radians(137.5)
    for fi in range(fronds):
        age = fi / max(fronds - 1, 1)                     # 0 = young (upright), 1 = old (drooping)
        az = fi * golden + rng.uniform(-0.15, 0.15)
        elev = math.radians(70 - 95 * age + rng.uniform(-6, 6))
        flen = height * rng.uniform(0.24, 0.29) * (0.8 + 0.25 * min(age * 2, 1))
        grav = 0.25 + 0.55 * age
        h_dir = Vector((math.cos(az), math.sin(az), 0))
        d0 = h_dir * math.cos(elev) + up * math.sin(elev)
        base = top + Vector((0, 0, -0.15)) + h_dir * 0.18

        def rachis(t, d0=d0, base=base, flen=flen, grav=grav):
            return base + d0 * flen * t + Vector((0, 0, -grav * flen * t * t))

        twist = rng.uniform(-0.3, 0.3)
        # rachis itself: thin tapered strip (reads at distance)
        rs = 14
        rv = []
        for j in range(rs + 1):
            t = j / rs
            p = rachis(t)
            tan = (rachis(min(t + 0.01, 1)) - rachis(max(t - 0.01, 0))).normalized()
            side = tan.cross(up).normalized() if abs(tan.dot(up)) < 0.99 else Vector((1, 0, 0))
            w = 0.035 * (1 - t) + 0.006
            a = bm.verts.new(p + side * w)
            bb = bm.verts.new(p - side * w)
            a[age_layer] = bb[age_layer] = age
            rv.append((a, bb))
        for j in range(rs):
            bm.faces.new((rv[j][0], rv[j + 1][0], rv[j + 1][1], rv[j][1])).material_index = 2

        n_leaf = 64
        for li in range(n_leaf):
            t = 0.12 + 0.86 * li / (n_leaf - 1)
            p = rachis(t)
            tan = (rachis(min(t + 0.01, 1)) - rachis(max(t - 0.01, 0))).normalized()
            side = tan.cross(up)
            side = side.normalized() if side.length > 1e-4 else Vector((1, 0, 0))
            nrm = side.cross(tan).normalized()
            llen = flen * 0.30 * (math.sin(math.pi * (0.08 + 0.9 * t)) ** 0.55) * rng.uniform(0.85, 1.1)
            for s in (-1, 1):
                plane = math.radians(38 if (li + (s > 0)) % 2 else -18) + twist  # plumose: two planes
                ldir = (side * s * math.cos(plane) + nrm * math.sin(plane) + tan * 0.55).normalized()
                ks = 5
                lw = []
                width_axis = ldir.cross(nrm)
                width_axis = width_axis.normalized() if width_axis.length > 1e-4 else tan
                for j in range(ks + 1):
                    u = j / ks
                    q = p + ldir * llen * u + Vector((0, 0, -0.32 * llen * u * u))
                    w = 0.028 * (1 - u ** 1.6) + 0.002
                    a = bm.verts.new(q + width_axis * w)
                    bb = bm.verts.new(q - width_axis * w)
                    a[age_layer] = bb[age_layer] = age
                    lw.append((a, bb))
                for j in range(ks):
                    f = bm.faces.new((lw[j][0], lw[j + 1][0], lw[j + 1][1], lw[j][1]))
                    f.material_index = 2
    obj = _mesh_obj(name, bm, mats, coll)
    # vertex float layer -> mesh attribute for the shader
    return obj


# --------------------------------------------------------------------------- estate materials
def mat_stucco():
    m = _mat("Stucco")
    if m.get("_built"):
        return m
    t = TEX / "beige_wall_001"
    if t.exists():
        pbr_textures(m, t, "beige_wall_001", tile_m=2.5, coords="BOX", tint=(1.10, 1.04, 0.92), bump=0.6)
    else:
        b = m.node_tree.nodes["Principled BSDF"]
        b.inputs["Base Color"].default_value = (0.86, 0.80, 0.68, 1)
        b.inputs["Roughness"].default_value = 0.85
    m["_built"] = True
    return m


def mat_roof():
    m = _mat("RoofTile")
    if m.get("_built"):
        return m
    t = TEX / "clay_roof_tiles_02"
    if t.exists():
        b = pbr_textures(m, t, "clay_roof_tiles_02", tile_m=2.0, coords="UV", tint=(1.0, 0.92, 0.85), bump=1.0)
    else:
        b = m.node_tree.nodes["Principled BSDF"]
        b.inputs["Base Color"].default_value = (0.45, 0.20, 0.10, 1)
    m["_built"] = True
    return m


def mat_glass():
    m = _mat("WindowGlass")
    b = m.node_tree.nodes["Principled BSDF"]
    b.inputs["Base Color"].default_value = (0.015, 0.02, 0.025, 1)
    b.inputs["Roughness"].default_value = 0.02
    b.inputs["Metallic"].default_value = 0.0
    if "Specular IOR Level" in b.inputs:
        b.inputs["Specular IOR Level"].default_value = 0.9
    # a hint of warm interior light behind the glass (lamps on at golden hour)
    b.inputs["Emission Color"].default_value = (1.0, 0.70, 0.40, 1)
    b.inputs["Emission Strength"].default_value = 0.08
    return m


def mat_steel():
    m = _mat("BlackSteel")
    b = m.node_tree.nodes["Principled BSDF"]
    b.inputs["Base Color"].default_value = (0.012, 0.012, 0.013, 1)
    b.inputs["Metallic"].default_value = 0.6
    b.inputs["Roughness"].default_value = 0.35
    return m


# --------------------------------------------------------------------------- estate geometry
def _box(name, size, loc, mat, coll=None, bevel=0.0):
    bm = bmesh.new()
    bmesh.ops.create_cube(bm, size=1.0)
    bmesh.ops.scale(bm, vec=Vector(size), verts=bm.verts)
    bmesh.ops.translate(bm, vec=Vector(loc), verts=bm.verts)
    me = bpy.data.meshes.new(name)
    bm.to_mesh(me)
    bm.free()
    me.materials.append(mat)
    o = _link(bpy.data.objects.new(name, me), coll)
    if bevel:
        bv = o.modifiers.new("Bevel", "BEVEL")
        bv.width, bv.segments = bevel, 3
    return o


def _arch_cutter(name, w, h, depth, loc, coll):
    """Round-headed arch prism (opening w x h, the top is a semicircle), axis along +Y."""
    bm = bmesh.new()
    r = w / 2
    pts = [(-r, 0), (r, 0), (r, h - r)]
    for k in range(1, 16):
        a = math.pi * k / 16
        pts.append((r * math.cos(a), h - r + r * math.sin(a)))
    pts.append((-r, h - r))
    front = [bm.verts.new((x, -depth / 2, z)) for x, z in pts]
    back = [bm.verts.new((x, depth / 2, z)) for x, z in pts]
    bm.faces.new(front[::-1])
    bm.faces.new(back)
    n = len(pts)
    for i in range(n):
        bm.faces.new((front[i], front[(i + 1) % n], back[(i + 1) % n], back[i]))
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    bmesh.ops.translate(bm, vec=Vector(loc), verts=bm.verts)
    me = bpy.data.meshes.new(name)
    bm.to_mesh(me)
    bm.free()
    o = _link(bpy.data.objects.new(name, me), coll)
    # Must stay in the render depsgraph for the Boolean to see it; make it invisible to rays.
    for attr in ("visible_camera", "visible_diffuse", "visible_glossy", "visible_transmission",
                 "visible_volume_scatter", "visible_shadow"):
        setattr(o, attr, False)
    o.display_type = "WIRE"
    return o, pts


def _arch_panel(name, pts, y, mat, coll, inset=0.0):
    """Flat arch-shaped panel (glass / interior) at depth y, facing -Y."""
    bm = bmesh.new()
    vs = [bm.verts.new((x * (1 - inset), y, z)) for x, z in pts]
    bm.faces.new(vs)
    me = bpy.data.meshes.new(name)
    bm.to_mesh(me)
    bm.free()
    me.materials.append(mat)
    return _link(bpy.data.objects.new(name, me), coll)


def _hip_roof(name, w, d, base_z, pitch_deg, overhang, mat, coll):
    W, D = w / 2 + overhang, d / 2 + overhang
    rise = min(W, D) * math.tan(math.radians(pitch_deg))
    ridge = max(W - D, 0) if W >= D else 0
    bm = bmesh.new()
    a = bm.verts.new((-W, -D, base_z))
    b = bm.verts.new((W, -D, base_z))
    c = bm.verts.new((W, D, base_z))
    d_ = bm.verts.new((-W, D, base_z))
    r1 = bm.verts.new((-ridge, 0, base_z + rise))
    r2 = bm.verts.new((ridge, 0, base_z + rise))
    faces = [bm.faces.new((a, b, r2, r1)), bm.faces.new((c, d_, r1, r2)),
             bm.faces.new((b, c, r2)), bm.faces.new((d_, a, r1))]
    # UVs: per face, project onto the slope plane so tiles run down-slope at real scale
    bm.normal_update()
    uv = bm.loops.layers.uv.new("UVMap")
    for f in faces:
        n = f.normal
        down = (Vector((0, 0, -1)) - n * n.dot(Vector((0, 0, -1)))).normalized()
        across = n.cross(down).normalized()
        for lp in f.loops:
            co = lp.vert.co
            lp[uv].uv = (co.dot(across), co.dot(down))
    # thin thickness so eaves read from below
    me = bpy.data.meshes.new(name)
    bm.to_mesh(me)
    bm.free()
    me.materials.append(mat)
    o = _link(bpy.data.objects.new(name, me), coll)
    sol = o.modifiers.new("Thickness", "SOLIDIFY")
    sol.thickness = 0.12
    sol.offset = -1
    return o


def estate(name="Estate", origin=(0, 0, 0), width=24.0, depth=12.0, floors=2, wing=True, coll=None):
    """Fictional Mediterranean Revival house. Façade faces -Y; `origin` is the centre of the
    façade at ground level. Ground-floor loggia of recessed arched glass doors, arched upper
    windows with black-steel muntins, cornice band, terracotta hip roof, chimney, side wing."""
    if coll is None:
        coll = bpy.data.collections.new(name)
        bpy.context.scene.collection.children.link(coll)
    stucco, roof, glass, steel = mat_stucco(), mat_roof(), mat_glass(), mat_steel()
    fh = 3.7
    H = fh * floors
    body = _box(f"{name}_Body", (width, depth, H), (0, depth / 2, H / 2), stucco, coll)
    boolm = body.modifiers.new("Openings", "BOOLEAN")
    boolm.operation = "DIFFERENCE"
    boolm.solver = "EXACT"
    cut_coll = bpy.data.collections.new(f"{name}_Cutters")
    coll.children.link(cut_coll)
    boolm.operand_type = "COLLECTION"
    boolm.collection = cut_coll

    recess = 0.45
    bays = max(3, int(width // 4.2))
    pitch = width / bays
    for i in range(bays):
        x = -width / 2 + pitch * (i + 0.5)
        # ground floor: tall arched French door
        w, h = min(2.4, pitch * 0.6), 3.0
        _, pts = _arch_cutter(f"{name}_ArchG{i}", w, h, recess * 2, (x, 0, 0.0), cut_coll)
        g = _arch_panel(f"{name}_GlassG{i}", pts, recess - 0.02, glass, coll)
        g.location.x = x
        # muntins
        _box(f"{name}_MullG{i}", (0.05, 0.05, h - 0.05), (x, recess - 0.05, h / 2), steel, coll)
        for z in (0.95, 1.9):
            _box(f"{name}_TranG{i}_{z}", (w * 0.98, 0.05, 0.04), (x, recess - 0.05, z), steel, coll)
        # upper floor: arched window with a stone sill
        if floors > 1:
            w2, h2, z2 = min(1.3, pitch * 0.38), 2.0, fh + 0.75
            _, pts2 = _arch_cutter(f"{name}_ArchU{i}", w2, h2, recess * 2, (x, 0, z2), cut_coll)
            g2 = _arch_panel(f"{name}_GlassU{i}", [(px, pz + z2) for px, pz in pts2], recess - 0.02, glass, coll)
            g2.location.x = x
            _box(f"{name}_MullU{i}", (0.04, 0.05, h2 - 0.05), (x, recess - 0.05, z2 + h2 / 2), steel, coll)
            _box(f"{name}_TranU{i}", (w2, 0.05, 0.035), (x, recess - 0.05, z2 + 1.1), steel, coll)
            _box(f"{name}_Sill{i}", (w2 + 0.3, 0.22, 0.08), (x, -0.06, z2 - 0.04), stucco, coll, bevel=0.015)
    # cornice + string course
    _box(f"{name}_Cornice", (width + 0.3, depth + 0.3, 0.22), (0, depth / 2, H - 0.11), stucco, coll, bevel=0.03)
    if floors > 1:
        _box(f"{name}_Course", (width + 0.08, depth + 0.08, 0.14), (0, depth / 2, fh - 0.05), stucco, coll, bevel=0.02)
    # plinth
    _box(f"{name}_Plinth", (width + 0.1, depth + 0.1, 0.35), (0, depth / 2, 0.17), stucco, coll, bevel=0.02)
    r = _hip_roof(f"{name}_Roof", width, depth, H, 24, 0.75, roof, coll)
    r.location.y = depth / 2
    # chimney
    _box(f"{name}_Chimney", (1.0, 0.8, 3.2), (width * 0.28, depth * 0.62, H + 2.0), stucco, coll)
    _box(f"{name}_ChimCap", (1.25, 1.05, 0.15), (width * 0.28, depth * 0.62, H + 3.65), stucco, coll, bevel=0.02)
    if wing:
        ww, wd, wh = 9.0, 8.0, fh
        wx = width / 2 + ww / 2
        _box(f"{name}_Wing", (ww, wd, wh), (wx, wd / 2 + 2.0, wh / 2), stucco, coll)
        _box(f"{name}_WingCornice", (ww + 0.25, wd + 0.25, 0.2), (wx, wd / 2 + 2.0, wh - 0.1), stucco, coll, bevel=0.03)
        rw = _hip_roof(f"{name}_WingRoof", ww, wd, wh, 24, 0.6, roof, coll)
        rw.location = (wx, wd / 2 + 2.0, 0)
    root = bpy.data.objects.new(name, None)
    _link(root)
    for o in list(coll.all_objects):
        if o.parent is None:
            o.parent = root
    root.location = origin
    return root


# --------------------------------------------------------------------------- hedges
def _leaf_mesh():
    me = bpy.data.meshes.get("HedgeLeaf")
    if me:
        return me
    bm = bmesh.new()
    pts = []
    for k in range(10):
        a = 2 * math.pi * k / 10
        pts.append(bm.verts.new((0.032 * math.cos(a), 0.019 * math.sin(a), 0.004 * math.cos(a) ** 2)))
    bm.faces.new(pts)
    me = bpy.data.meshes.new("HedgeLeaf")
    bm.to_mesh(me)
    bm.free()
    return me


def mat_hedge_leaf():
    m = _mat("HedgeLeafMat")
    if m.get("_built"):
        return m
    N, L = m.node_tree.nodes, m.node_tree.links
    out = N["Material Output"]
    b = N["Principled BSDF"]
    oi = N.new("ShaderNodeObjectInfo")
    ramp = N.new("ShaderNodeValToRGB")
    ramp.color_ramp.elements[0].color = (0.025, 0.06, 0.015, 1)
    ramp.color_ramp.elements[1].color = (0.085, 0.15, 0.035, 1)
    L.new(oi.outputs["Random"], ramp.inputs["Fac"])
    L.new(ramp.outputs["Color"], b.inputs["Base Color"])
    b.inputs["Roughness"].default_value = 0.42
    tr = N.new("ShaderNodeBsdfTranslucent")
    tr.inputs["Color"].default_value = (0.12, 0.22, 0.04, 1)
    mix = N.new("ShaderNodeMixShader")
    mix.inputs["Fac"].default_value = 0.2
    L.new(b.outputs["BSDF"], mix.inputs[1])
    L.new(tr.outputs["BSDF"], mix.inputs[2])
    L.new(mix.outputs["Shader"], out.inputs["Surface"])
    m["_built"] = True
    return m


def _rand_range(node, lo, hi):
    """Set Min/Max on a FLOAT Random Value node (socket order differs across Blender versions)."""
    for sock in node.inputs:
        if sock.type == "VALUE" and sock.name in ("Min", "Max"):
            sock.default_value = lo if sock.name == "Min" else hi


def _rand_out(node):
    return next(o for o in node.outputs if o.type == "VALUE")


def _leaf_scatter_group(density=650.0):
    ng = bpy.data.node_groups.get("PBPP_LeafScatter")
    if ng is None:
        ng = bpy.data.node_groups.new("PBPP_LeafScatter", "GeometryNodeTree")
        ng.interface.new_socket("Geometry", in_out="INPUT", socket_type="NodeSocketGeometry")
        d = ng.interface.new_socket("Density", in_out="INPUT", socket_type="NodeSocketFloat")
        d.default_value = density
        ng.interface.new_socket("Leaf", in_out="INPUT", socket_type="NodeSocketObject")
        sd = ng.interface.new_socket("Seed", in_out="INPUT", socket_type="NodeSocketInt")
        sd.default_value = 0
        ng.interface.new_socket("Geometry", in_out="OUTPUT", socket_type="NodeSocketGeometry")
        N, L = ng.nodes, ng.links
        gi, go = N.new("NodeGroupInput"), N.new("NodeGroupOutput")
        dist = N.new("GeometryNodeDistributePointsOnFaces")
        L.new(gi.outputs["Geometry"], dist.inputs["Mesh"])
        L.new(gi.outputs["Density"], dist.inputs["Density"])
        L.new(gi.outputs["Seed"], dist.inputs["Seed"])
        info = N.new("GeometryNodeObjectInfo")
        L.new(gi.outputs["Leaf"], info.inputs["Object"])
        rot = N.new("FunctionNodeRandomValue")
        rot.data_type = "FLOAT_VECTOR"
        rot.inputs["Max"].default_value = (6.283, 6.283, 6.283)
        scl = N.new("FunctionNodeRandomValue")
        scl.data_type = "FLOAT"
        _rand_range(scl, 0.7, 1.35)
        jit = N.new("FunctionNodeRandomValue")
        jit.data_type = "FLOAT"
        _rand_range(jit, -0.02, 0.035)
        off = N.new("ShaderNodeVectorMath")
        off.operation = "SCALE"
        L.new(dist.outputs["Normal"], off.inputs[0])
        L.new(_rand_out(jit), off.inputs["Scale"])
        setp = N.new("GeometryNodeSetPosition")
        L.new(dist.outputs["Points"], setp.inputs["Geometry"])
        L.new(off.outputs[0], setp.inputs["Offset"])
        inst = N.new("GeometryNodeInstanceOnPoints")
        L.new(setp.outputs["Geometry"], inst.inputs["Points"])
        L.new(info.outputs["Geometry"], inst.inputs["Instance"])
        L.new(rot.outputs[0], inst.inputs["Rotation"])
        L.new(_rand_out(scl), inst.inputs["Scale"])
        join = N.new("GeometryNodeJoinGeometry")
        L.new(gi.outputs["Geometry"], join.inputs["Geometry"])
        L.new(inst.outputs["Instances"], join.inputs["Geometry"])
        L.new(join.outputs["Geometry"], go.inputs["Geometry"])
    return ng


def leafy_hedge(obj, density=650.0, seed=0):
    """Cover a clipped-hedge volume with instanced small leaves (ficus look). The box itself
    becomes the dark, shadowed interior of the hedge."""
    inner = _mat("HedgeInner")
    ib = inner.node_tree.nodes["Principled BSDF"]
    ib.inputs["Base Color"].default_value = (0.008, 0.02, 0.005, 1)
    ib.inputs["Roughness"].default_value = 0.9
    obj.data.materials.clear()
    obj.data.materials.append(inner)
    leaf_obj = bpy.data.objects.get("HedgeLeafProto")
    if leaf_obj is None:
        leaf_obj = bpy.data.objects.new("HedgeLeafProto", _leaf_mesh())
        leaf_obj.data.materials.append(mat_hedge_leaf())
        bpy.context.scene.collection.objects.link(leaf_obj)
        leaf_obj.hide_render = True
        leaf_obj.location.z = -500
    ng = _leaf_scatter_group(density)
    mod = obj.modifiers.new("Leaves", "NODES")
    mod.node_group = ng
    ids = {i.name: i.identifier for i in ng.interface.items_tree if getattr(i, "in_out", "") == "INPUT"}
    from foam import _set_input
    _set_input(mod, ids["Density"], density)
    _set_input(mod, ids["Leaf"], leaf_obj)
    _set_input(mod, ids["Seed"], seed)
    return obj


# --------------------------------------------------------------------------- terrace furniture
def mat_teak():
    m = _mat("Teak")
    if not m.get("_built"):
        N, L = m.node_tree.nodes, m.node_tree.links
        b = N["Principled BSDF"]
        wave = N.new("ShaderNodeTexWave")
        wave.inputs["Scale"].default_value = 3.0
        wave.inputs["Distortion"].default_value = 6.0
        ramp = N.new("ShaderNodeValToRGB")
        ramp.color_ramp.elements[0].color = (0.22, 0.13, 0.07, 1)
        ramp.color_ramp.elements[1].color = (0.36, 0.23, 0.13, 1)
        L.new(wave.outputs["Fac"], ramp.inputs["Fac"])
        L.new(ramp.outputs["Color"], b.inputs["Base Color"])
        b.inputs["Roughness"].default_value = 0.45
        m["_built"] = True
    return m


def mat_canvas(color=(0.86, 0.82, 0.73)):
    m = _mat("Canvas")
    if not m.get("_built"):
        b = m.node_tree.nodes["Principled BSDF"]
        b.inputs["Base Color"].default_value = (*color, 1)
        b.inputs["Roughness"].default_value = 0.92
        if "Sheen Weight" in b.inputs:
            b.inputs["Sheen Weight"].default_value = 0.3
        m["_built"] = True
    return m


def chaise_lounger(name, loc, yaw_deg=0.0, coll=None):
    """Teak chaise with a cream cushion; backrest at the -X end, raised 40 degrees."""
    teak, canvas = mat_teak(), mat_canvas()
    root = bpy.data.objects.new(name, None)
    _link(root, coll)
    parts = [
        _box(f"{name}_RailL", (2.0, 0.05, 0.08), (0, 0.33, 0.30), teak, coll, bevel=0.01),
        _box(f"{name}_RailR", (2.0, 0.05, 0.08), (0, -0.33, 0.30), teak, coll, bevel=0.01),
    ]
    for x in (-0.9, 0.9):
        for y in (-0.33, 0.33):
            parts.append(_box(f"{name}_Leg{x}{y}", (0.06, 0.06, 0.28), (x, y, 0.14), teak, coll, bevel=0.008))
    seat = _box(f"{name}_Cushion", (1.3, 0.66, 0.09), (0.33, 0, 0.385), canvas, coll, bevel=0.03)
    back = _box(f"{name}_Back", (0.72, 0.66, 0.09), (0, 0, 0), canvas, coll, bevel=0.03)
    back.rotation_euler[1] = math.radians(-40)
    back.location = (-0.58, 0, 0.58)
    parts += [seat, back]
    for o in parts:
        o.parent = root
    root.location = loc
    root.rotation_euler[2] = math.radians(yaw_deg)
    return root


def market_umbrella(name, loc, radius=1.4, coll=None):
    """Open octagonal market umbrella: teak pole, cream canvas canopy with a slight sag."""
    teak, canvas = mat_teak(), mat_canvas()
    root = bpy.data.objects.new(name, None)
    _link(root, coll)
    pole = _box(f"{name}_Pole", (0.045, 0.045, 2.5), (0, 0, 1.25), teak, coll, bevel=0.01)
    base = _box(f"{name}_Base", (0.45, 0.45, 0.06), (0, 0, 0.03), mat_steel(), coll, bevel=0.01)
    bm = bmesh.new()
    apex = bm.verts.new((0, 0, 2.62))
    ring = []
    for k in range(8):
        a = 2 * math.pi * k / 8
        ring.append(bm.verts.new((radius * math.cos(a), radius * math.sin(a), 2.18)))
    mids = []
    for k in range(8):
        a = 2 * math.pi * (k + 0.5) / 8
        r = radius * math.cos(math.pi / 8) * 0.97
        mids.append(bm.verts.new((r * math.cos(a), r * math.sin(a), 2.24)))
    for k in range(8):
        bm.faces.new((apex, ring[k], mids[k]))
        bm.faces.new((apex, mids[k], ring[(k + 1) % 8]))
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    me = bpy.data.meshes.new(f"{name}_Canopy")
    bm.to_mesh(me)
    bm.free()
    me.materials.append(canvas)
    canopy = _link(bpy.data.objects.new(f"{name}_Canopy", me), coll)
    sol = canopy.modifiers.new("Thick", "SOLIDIFY")
    sol.thickness = 0.01
    for o in (pole, base, canopy):
        o.parent = root
    root.location = loc
    return root



def scatter_on(obj, proto, density, seed=0, name="Scatter"):
    """Instance `proto` over obj's surface (random rotation/scale, slight normal jitter)."""
    ng = _leaf_scatter_group(density)
    mod = obj.modifiers.new(name, "NODES")
    mod.node_group = ng
    ids = {i.name: i.identifier for i in ng.interface.items_tree if getattr(i, "in_out", "") == "INPUT"}
    from foam import _set_input
    _set_input(mod, ids["Density"], density)
    _set_input(mod, ids["Leaf"], proto)
    _set_input(mod, ids["Seed"], seed)
    return mod


def hydrangea(name, loc, radius=0.14, coll=None, seed=0):
    """White hydrangea head: a dome covered in small four-petal florets."""
    petal = bpy.data.objects.get("HydrangeaFloret")
    if petal is None:
        bm = bmesh.new()
        c = bm.verts.new((0, 0, 0.003))
        ring = []
        for k in range(16):
            a = 2 * math.pi * k / 16
            r = 0.012 * (0.55 + 0.45 * abs(math.cos(2 * a)))
            ring.append(bm.verts.new((r * math.cos(a), r * math.sin(a), 0)))
        for k in range(16):
            bm.faces.new((c, ring[k], ring[(k + 1) % 16]))
        me = bpy.data.meshes.new("HydrangeaFloret")
        bm.to_mesh(me)
        bm.free()
        m = _mat("HydrangeaPetal")
        N, L = m.node_tree.nodes, m.node_tree.links
        b = N["Principled BSDF"]
        oi = N.new("ShaderNodeObjectInfo")
        ramp = N.new("ShaderNodeValToRGB")
        ramp.color_ramp.elements[0].color = (0.80, 0.84, 0.80, 1)
        ramp.color_ramp.elements[1].color = (0.95, 0.96, 0.94, 1)
        L.new(oi.outputs["Random"], ramp.inputs["Fac"])
        L.new(ramp.outputs["Color"], b.inputs["Base Color"])
        b.inputs["Roughness"].default_value = 0.6
        if "Subsurface Weight" in b.inputs:
            b.inputs["Subsurface Weight"].default_value = 0.4
        me.materials.append(m)
        petal = bpy.data.objects.new("HydrangeaFloret", me)
        bpy.context.scene.collection.objects.link(petal)
        petal.hide_render = True
        petal.location.z = -500
    bm = bmesh.new()
    bmesh.ops.create_icosphere(bm, subdivisions=3, radius=radius)
    me = bpy.data.meshes.new(name)
    bm.to_mesh(me)
    bm.free()
    leafm = _mat("HydrangeaCore")
    leafm.node_tree.nodes["Principled BSDF"].inputs["Base Color"].default_value = (0.55, 0.60, 0.52, 1)
    me.materials.append(leafm)
    head = _link(bpy.data.objects.new(name, me), coll)
    head.location = loc
    head.scale = (1, 1, 0.8)
    scatter_on(head, petal, density=2600.0, seed=seed, name="Florets")
    return head



def mat_striped_lawn(stripe_m=1.6):
    """Manicured turf: alternating mower stripes, fine grass-blade bump, subtle colour noise."""
    m = _mat("StripedLawn")
    if m.get("_built"):
        return m
    N, L = m.node_tree.nodes, m.node_tree.links
    b = N["Principled BSDF"]
    geo = N.new("ShaderNodeNewGeometry")
    sep = N.new("ShaderNodeSeparateXYZ")
    L.new(geo.outputs["Position"], sep.inputs[0])
    stripes = N.new("ShaderNodeMath")
    stripes.operation = "SINE"
    sc = N.new("ShaderNodeMath")
    sc.operation = "MULTIPLY"
    sc.inputs[1].default_value = math.pi / stripe_m
    L.new(sep.outputs["X"], sc.inputs[0])
    L.new(sc.outputs[0], stripes.inputs[0])
    sharp = N.new("ShaderNodeMapRange")
    sharp.inputs["From Min"].default_value = -0.15
    sharp.inputs["From Max"].default_value = 0.15
    L.new(stripes.outputs[0], sharp.inputs["Value"])
    noise = N.new("ShaderNodeTexNoise")
    noise.inputs["Scale"].default_value = 2.5
    L.new(geo.outputs["Position"], noise.inputs["Vector"])
    ramp = N.new("ShaderNodeValToRGB")
    ramp.color_ramp.elements[0].color = (0.030, 0.075, 0.014, 1)
    ramp.color_ramp.elements[1].color = (0.065, 0.13, 0.025, 1)
    mixf = N.new("ShaderNodeMath")
    mixf.operation = "MULTIPLY_ADD"
    mixf.inputs[1].default_value = 0.75
    L.new(sharp.outputs["Result"], mixf.inputs[0])
    nz = N.new("ShaderNodeMath")
    nz.operation = "MULTIPLY"
    nz.inputs[1].default_value = 0.25
    L.new(noise.outputs["Fac"], nz.inputs[0])
    L.new(nz.outputs[0], mixf.inputs[2])
    L.new(mixf.outputs[0], ramp.inputs["Fac"])
    L.new(ramp.outputs["Color"], b.inputs["Base Color"])
    blades = N.new("ShaderNodeTexNoise")
    blades.inputs["Scale"].default_value = 320.0
    blades.inputs["Detail"].default_value = 2.0
    L.new(geo.outputs["Position"], blades.inputs["Vector"])
    bump = N.new("ShaderNodeBump")
    bump.inputs["Strength"].default_value = 0.6
    L.new(blades.outputs["Fac"], bump.inputs["Height"])
    L.new(bump.outputs["Normal"], b.inputs["Normal"])
    b.inputs["Roughness"].default_value = 0.85
    if "Sheen Weight" in b.inputs:
        b.inputs["Sheen Weight"].default_value = 0.08
    m["_built"] = True
    return m
