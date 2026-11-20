"""Procedural snow-foam (geometry nodes) for detailing scenes.

Adds a "FoamCoat" geometry-nodes modifier to each mesh: points are scattered on
upward/side-facing surfaces, turned into a blobby volume, meshed, and joined
with the original geometry. A control empty ("FoamFront") sweeps along world X
to animate foam being sprayed on (or rinsed off).
"""
from __future__ import annotations

import bpy

from common import foam_material


def _sock(ng, name, in_out, kind, default=None):
    s = ng.interface.new_socket(name, in_out=in_out, socket_type=kind)
    if default is not None and hasattr(s, "default_value"):
        s.default_value = default
    return s


def build_foam_group() -> bpy.types.NodeTree:
    ng = bpy.data.node_groups.get("PBPP_Foam")
    if ng:
        return ng
    ng = bpy.data.node_groups.new("PBPP_Foam", "GeometryNodeTree")
    _sock(ng, "Geometry", "INPUT", "NodeSocketGeometry")
    _sock(ng, "Density", "INPUT", "NodeSocketFloat", 900.0)
    _sock(ng, "Radius", "INPUT", "NodeSocketFloat", 0.035)
    _sock(ng, "Voxel", "INPUT", "NodeSocketFloat", 0.012)
    _sock(ng, "Front", "INPUT", "NodeSocketObject")
    _sock(ng, "Coverage", "INPUT", "NodeSocketFloat", 0.42)
    _sock(ng, "Geometry", "OUTPUT", "NodeSocketGeometry")

    N, L = ng.nodes, ng.links
    gi, go = N.new("NodeGroupInput"), N.new("NodeGroupOutput")

    # selection: not facing straight down, noisy coverage, behind the foam front (world X)
    normal = N.new("GeometryNodeInputNormal")
    nsep = N.new("ShaderNodeSeparateXYZ")
    L.new(normal.outputs["Normal"], nsep.inputs[0])
    facing = N.new("FunctionNodeCompare")
    facing.data_type, facing.operation = "FLOAT", "GREATER_THAN"
    L.new(nsep.outputs["Z"], facing.inputs[0])
    facing.inputs[1].default_value = -0.35

    noise = N.new("ShaderNodeTexNoise")
    noise.inputs["Scale"].default_value = 3.5
    noise.inputs["Detail"].default_value = 6.0
    cover = N.new("FunctionNodeCompare")
    cover.data_type, cover.operation = "FLOAT", "LESS_THAN"
    L.new(noise.outputs["Fac"], cover.inputs[0])
    cover_scale = N.new("ShaderNodeMath")  # coverage 0.42 -> threshold ~0.55 on noise (0..1, centered .5)
    cover_scale.operation = "ADD"
    L.new(gi.outputs["Coverage"], cover_scale.inputs[0])
    cover_scale.inputs[1].default_value = 0.13
    L.new(cover_scale.outputs[0], cover.inputs[1])

    # front: compare position (object space) against the front empty's location in this object's space
    pos = N.new("GeometryNodeInputPosition")
    psep = N.new("ShaderNodeSeparateXYZ")
    L.new(pos.outputs["Position"], psep.inputs[0])
    info = N.new("GeometryNodeObjectInfo")
    info.transform_space = "RELATIVE"
    L.new(gi.outputs["Front"], info.inputs["Object"])
    fsep = N.new("ShaderNodeSeparateXYZ")
    L.new(info.outputs["Location"], fsep.inputs[0])
    behind = N.new("FunctionNodeCompare")
    behind.data_type, behind.operation = "FLOAT", "LESS_THAN"
    L.new(psep.outputs["X"], behind.inputs[0])
    L.new(fsep.outputs["X"], behind.inputs[1])

    and1 = N.new("FunctionNodeBooleanMath")
    and1.operation = "AND"
    L.new(facing.outputs[0], and1.inputs[0])
    L.new(cover.outputs[0], and1.inputs[1])
    and2 = N.new("FunctionNodeBooleanMath")
    and2.operation = "AND"
    L.new(and1.outputs[0], and2.inputs[0])
    L.new(behind.outputs[0], and2.inputs[1])

    dist = N.new("GeometryNodeDistributePointsOnFaces")
    dist.distribute_method = "RANDOM"
    L.new(gi.outputs["Geometry"], dist.inputs["Mesh"])
    L.new(and2.outputs[0], dist.inputs["Selection"])
    L.new(gi.outputs["Density"], dist.inputs["Density"])

    # push points slightly off the surface so foam sits on the paint
    off = N.new("GeometryNodeSetPosition")
    scale = N.new("ShaderNodeVectorMath")
    scale.operation = "SCALE"
    L.new(dist.outputs["Normal"], scale.inputs[0])
    L.new(gi.outputs["Radius"], scale.inputs["Scale"])
    L.new(dist.outputs["Points"], off.inputs["Geometry"])
    L.new(scale.outputs[0], off.inputs["Offset"])

    vol = N.new("GeometryNodePointsToVolume")
    L.new(off.outputs["Geometry"], vol.inputs["Points"])
    L.new(gi.outputs["Radius"], vol.inputs["Radius"])
    vol.resolution_mode = "VOXEL_SIZE"
    L.new(gi.outputs["Voxel"], vol.inputs["Voxel Size"])

    mesh = N.new("GeometryNodeVolumeToMesh")
    L.new(vol.outputs["Volume"], mesh.inputs["Volume"])
    smooth = N.new("GeometryNodeSetShadeSmooth")
    L.new(mesh.outputs["Mesh"], smooth.inputs["Geometry"])
    setmat = N.new("GeometryNodeSetMaterial")
    setmat.inputs["Material"].default_value = foam_material()
    L.new(smooth.outputs["Geometry"], setmat.inputs["Geometry"])

    join = N.new("GeometryNodeJoinGeometry")
    L.new(gi.outputs["Geometry"], join.inputs["Geometry"])
    L.new(setmat.outputs["Geometry"], join.inputs["Geometry"])
    L.new(join.outputs["Geometry"], go.inputs["Geometry"])
    return ng


def add_foam(objs, front: bpy.types.Object, density=900.0, radius=0.035, voxel=0.012, coverage=0.42):
    """Attach foam to every mesh in objs. Density/radius are in world units (meters)."""
    ng = build_foam_group()
    ids = {i.name: i.identifier for i in ng.interface.items_tree if getattr(i, "in_out", "") == "INPUT"}
    count = 0
    for o in objs:
        if o.type != "MESH" or o.hide_render:
            continue
        s = max(o.matrix_world.to_scale())  # convert world units -> object local units
        mod = o.modifiers.new("FoamCoat", "NODES")
        mod.node_group = ng
        mod[ids["Density"]] = density * s * s
        mod[ids["Radius"]] = radius / s
        mod[ids["Voxel"]] = voxel / s
        mod[ids["Coverage"]] = coverage
        mod[ids["Front"]] = front
        count += 1
    print(f"[pbpp] foam on {count} meshes")
