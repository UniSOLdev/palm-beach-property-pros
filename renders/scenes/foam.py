"""Procedural snow-foam (geometry nodes) for detailing scenes.

Adds a "FoamCoat" geometry-nodes modifier to each mesh. The foam is a lumpy blanket:
the (already smoothed) surface is copied, subdivided, pushed outward along its normals
by a layered-noise thickness (thicker on top surfaces, absent on undersides), then
joined with the original geometry. A control empty ("FoamFront") sweeps along the
object's X axis to animate foam being sprayed on (or rinsed off).

An earlier version meshed a cloud of points into a volume; that read as popcorn
beads rather than snow foam, so it was replaced by this shell approach.
"""
from __future__ import annotations

import bpy

from common import foam_material


def _sock(ng, name, in_out, kind, default=None):
    s = ng.interface.new_socket(name, in_out=in_out, socket_type=kind)
    if default is not None and hasattr(s, "default_value"):
        s.default_value = default
    return s


def _math(N, L, op, a=None, b=None, va=None, vb=None):
    m = N.new("ShaderNodeMath")
    m.operation = op
    if a is not None:
        L.new(a, m.inputs[0])
    elif va is not None:
        m.inputs[0].default_value = va
    if b is not None:
        L.new(b, m.inputs[1])
    elif vb is not None:
        m.inputs[1].default_value = vb
    return m.outputs[0]


def build_foam_group() -> bpy.types.NodeTree:
    ng = bpy.data.node_groups.get("PBPP_FoamShell")
    if ng:
        return ng
    ng = bpy.data.node_groups.new("PBPP_FoamShell", "GeometryNodeTree")
    _sock(ng, "Geometry", "INPUT", "NodeSocketGeometry")
    _sock(ng, "Thickness", "INPUT", "NodeSocketFloat", 0.035)
    _sock(ng, "Front", "INPUT", "NodeSocketObject")
    _sock(ng, "Coverage", "INPUT", "NodeSocketFloat", 0.85)
    _sock(ng, "Axis", "INPUT", "NodeSocketVector", (1.0, 0.0, 0.0))   # sweep direction, object space
    _sock(ng, "Geometry", "OUTPUT", "NodeSocketGeometry")
    N, L = ng.nodes, ng.links
    gi, go = N.new("NodeGroupInput"), N.new("NodeGroupOutput")

    sub = N.new("GeometryNodeSubdivideMesh")
    sub.inputs["Level"].default_value = 1
    L.new(gi.outputs["Geometry"], sub.inputs["Mesh"])

    pos = N.new("GeometryNodeInputPosition")
    nrm = N.new("GeometryNodeInputNormal")
    nsep = N.new("ShaderNodeSeparateXYZ")
    L.new(nrm.outputs["Normal"], nsep.inputs[0])
    psep = N.new("ShaderNodeSeparateXYZ")
    L.new(pos.outputs["Position"], psep.inputs[0])

    # --- which faces carry foam: not undersides, noisy coverage edge, behind the front
    under = _math(N, L, "LESS_THAN", nsep.outputs["Z"], vb=-0.45)
    cov_noise = N.new("ShaderNodeTexNoise")
    cov_noise.inputs["Scale"].default_value = 2.2
    cov_noise.inputs["Detail"].default_value = 4.0
    L.new(pos.outputs["Position"], cov_noise.inputs["Vector"])
    thr = _math(N, L, "ADD", gi.outputs["Coverage"], vb=0.12)
    bare = _math(N, L, "GREATER_THAN", cov_noise.outputs["Fac"], thr)
    info = N.new("GeometryNodeObjectInfo")
    info.transform_space = "RELATIVE"
    L.new(gi.outputs["Front"], info.inputs["Object"])
    fsep = N.new("ShaderNodeSeparateXYZ")
    L.new(info.outputs["Location"], fsep.inputs[0])
    # ragged spray front: x + noise wobble
    edge_noise = N.new("ShaderNodeTexNoise")
    edge_noise.inputs["Scale"].default_value = 3.0
    L.new(pos.outputs["Position"], edge_noise.inputs["Vector"])
    wobble = _math(N, L, "MULTIPLY_ADD", edge_noise.outputs["Fac"], vb=0.6)
    ma = wobble.node
    ma.inputs[2].default_value = -0.3
    # project position and front onto the sweep axis (object space), so the sweep runs
    # nose-to-tail whatever axis the model was built along
    dp = N.new("ShaderNodeVectorMath")
    dp.operation = "DOT_PRODUCT"
    L.new(pos.outputs["Position"], dp.inputs[0])
    L.new(gi.outputs["Axis"], dp.inputs[1])
    df = N.new("ShaderNodeVectorMath")
    df.operation = "DOT_PRODUCT"
    L.new(info.outputs["Location"], df.inputs[0])
    L.new(gi.outputs["Axis"], df.inputs[1])
    xw = _math(N, L, "ADD", dp.outputs["Value"], wobble)
    ahead = _math(N, L, "GREATER_THAN", xw, df.outputs["Value"])
    no1 = _math(N, L, "MAXIMUM", under, bare)
    drop = _math(N, L, "MAXIMUM", no1, ahead)

    dele = N.new("GeometryNodeDeleteGeometry")
    dele.domain = "FACE"
    L.new(sub.outputs["Mesh"], dele.inputs["Geometry"])
    L.new(drop, dele.inputs["Selection"])

    # --- lumpy thickness: big soft mounds + medium clumps + fine curd, thicker on top faces
    n1 = N.new("ShaderNodeTexNoise")
    n1.inputs["Scale"].default_value = 4.0
    n1.inputs["Detail"].default_value = 3.0
    n2 = N.new("ShaderNodeTexNoise")
    n2.inputs["Scale"].default_value = 18.0
    n2.inputs["Detail"].default_value = 2.0
    v3 = N.new("ShaderNodeTexVoronoi")
    v3.feature = "SMOOTH_F1"
    v3.inputs["Scale"].default_value = 55.0
    for n in (n1, n2, v3):
        L.new(pos.outputs["Position"], n.inputs["Vector"])
    a = _math(N, L, "MULTIPLY", n1.outputs["Fac"], vb=1.1)
    b = _math(N, L, "MULTIPLY", n2.outputs["Fac"], vb=0.55)
    c = _math(N, L, "MULTIPLY", v3.outputs["Distance"], vb=-0.35)
    lump = _math(N, L, "ADD", _math(N, L, "ADD", a, b), c)
    up = _math(N, L, "MULTIPLY_ADD", _math(N, L, "MAXIMUM", nsep.outputs["Z"], vb=0.0), vb=0.9)
    up.node.inputs[2].default_value = 0.55
    # feather toward the spray edge: full depth ~0.6 m behind the front, thin film at the edge
    behind = _math(N, L, "SUBTRACT", df.outputs["Value"], xw)
    feather = N.new("ShaderNodeMapRange")
    feather.clamp = True
    feather.inputs["From Min"].default_value = 0.0
    feather.inputs["From Max"].default_value = 0.6
    feather.inputs["To Min"].default_value = 0.08
    L.new(behind, feather.inputs["Value"])
    thick = _math(N, L, "MULTIPLY", _math(N, L, "MULTIPLY", lump, up), gi.outputs["Thickness"])
    thick = _math(N, L, "MULTIPLY", thick, feather.outputs["Result"])
    off = N.new("ShaderNodeVectorMath")
    off.operation = "SCALE"
    L.new(nrm.outputs["Normal"], off.inputs[0])
    L.new(thick, off.inputs["Scale"])
    # store the edge proximity for the shader (dissolves into speckles at the spray front)
    store = N.new("GeometryNodeStoreNamedAttribute")
    store.data_type = "FLOAT"
    store.domain = "POINT"
    store.inputs["Name"].default_value = "foam_edge"
    L.new(dele.outputs["Geometry"], store.inputs["Geometry"])
    L.new(feather.outputs["Result"], store.inputs["Value"])
    setp = N.new("GeometryNodeSetPosition")
    L.new(store.outputs["Geometry"], setp.inputs["Geometry"])
    L.new(off.outputs[0], setp.inputs["Offset"])

    smooth = N.new("GeometryNodeSetShadeSmooth")
    L.new(setp.outputs["Geometry"], smooth.inputs["Geometry"])
    setmat = N.new("GeometryNodeSetMaterial")
    setmat.inputs["Material"].default_value = foam_material()
    L.new(smooth.outputs["Geometry"], setmat.inputs["Geometry"])

    join = N.new("GeometryNodeJoinGeometry")
    L.new(gi.outputs["Geometry"], join.inputs["Geometry"])
    L.new(setmat.outputs["Geometry"], join.inputs["Geometry"])
    L.new(join.outputs["Geometry"], go.inputs["Geometry"])
    return ng


def _set_input(mod, identifier, value):
    """Blender 5.x: mod.properties.inputs.<id>.value; Blender 4.x: mod[<id>] ID property."""
    props = getattr(mod, "properties", None)
    if props is not None and hasattr(props, "inputs"):
        getattr(props.inputs, identifier).value = value
    else:
        mod[identifier] = value


def add_foam(objs, front: bpy.types.Object, density=None, radius=0.035, voxel=None, coverage=0.85):
    """Attach foam to every exterior mesh in objs. `radius` is the mean foam thickness in
    metres (density/voxel are accepted for backward compatibility and ignored)."""
    ng = build_foam_group()
    bpy.context.view_layer.update()
    ids = {i.name: i.identifier for i in ng.interface.items_tree if getattr(i, "in_out", "") == "INPUT"}
    count = 0
    for o in objs:
        if o.type != "MESH" or o.hide_render or o.get("pbpp_interior"):
            continue
        s = max(o.matrix_world.to_scale())  # world metres -> object local units
        mod = o.modifiers.new("FoamCoat", "NODES")
        mod.node_group = ng
        axis = (o.matrix_world.inverted().to_3x3() @ __import__("mathutils").Vector((1, 0, 0))).normalized()
        for key, val in (("Thickness", radius / s), ("Coverage", coverage), ("Front", front), ("Axis", axis)):
            _set_input(mod, ids[key], val)
        count += 1
    print(f"[pbpp] foam on {count} meshes")
