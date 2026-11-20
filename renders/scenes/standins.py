"""Crude stand-in geometry so every scene script can be tested WITHOUT purchased models.

Stand-in renders are for pipeline testing only and must never ship to the website
(brand rule: photoreal only). Final renders always use a licensed model via --model.
"""
from __future__ import annotations

import bpy

from common import car_paint, principled


def _mod(o, kind, **kw):
    m = o.modifiers.new(kind.title(), kind)
    for k, v in kw.items():
        setattr(m, k, v)
    return m


def standin_car() -> list[bpy.types.Object]:
    paint = car_paint()
    glass = principled("Glass", (0.02, 0.025, 0.03), roughness=0.02, Transmission_Weight=0.0)
    tire = principled("Tire", (0.015, 0.015, 0.015), roughness=0.75)
    rim = principled("Rim", (0.75, 0.75, 0.76), roughness=0.18, metallic=1.0)
    objs = []

    bpy.ops.mesh.primitive_cube_add(location=(0, 0, 0.72))
    body = bpy.context.active_object
    body.name, body.scale = "Body", (2.45, 0.95, 0.38)
    _mod(body, "BEVEL", width=0.22, segments=6)
    _mod(body, "SUBSURF", levels=2, render_levels=2)
    body.data.materials.append(paint)
    objs.append(body)

    bpy.ops.mesh.primitive_cube_add(location=(-0.25, 0, 1.25))
    cabin = bpy.context.active_object
    cabin.name, cabin.scale = "Cabin", (1.35, 0.82, 0.3)
    _mod(cabin, "BEVEL", width=0.2, segments=6)
    _mod(cabin, "SUBSURF", levels=2, render_levels=2)
    cabin.data.materials.append(glass)
    objs.append(cabin)

    for x in (-1.55, 1.55):
        for y in (-0.88, 0.88):
            bpy.ops.mesh.primitive_cylinder_add(radius=0.36, depth=0.26, location=(x, y, 0.36), rotation=(1.5708, 0, 0))
            t = bpy.context.active_object
            t.name = "Tire"
            _mod(t, "BEVEL", width=0.06, segments=4)
            t.data.materials.append(tire)
            bpy.ops.mesh.primitive_cylinder_add(radius=0.24, depth=0.27, location=(x, y, 0.36), rotation=(1.5708, 0, 0))
            r = bpy.context.active_object
            r.name = "Rim"
            r.data.materials.append(rim)
            objs += [t, r]
    for o in objs:
        bpy.context.view_layer.objects.active = o
        bpy.ops.object.shade_smooth()
    return objs


def standin_yacht() -> list[bpy.types.Object]:
    hull_m = principled("Hull", (0.92, 0.93, 0.94), roughness=0.15, Coat_Weight=1.0)
    deck_m = principled("Teak", (0.36, 0.22, 0.12), roughness=0.5)
    glass = principled("Tint", (0.01, 0.015, 0.02), roughness=0.03, metallic=0.2)
    objs = []
    bpy.ops.mesh.primitive_cube_add(location=(0, 0, 1.2))
    hull = bpy.context.active_object
    hull.name, hull.scale = "Hull", (12.0, 2.8, 1.6)
    _mod(hull, "BEVEL", width=1.1, segments=8)
    _mod(hull, "SUBSURF", levels=2, render_levels=2)
    hull.data.materials.append(hull_m)
    objs.append(hull)
    for i, (sx, sy, z, x) in enumerate(((8.5, 2.4, 3.4, -1.0), (6.0, 2.1, 4.7, -2.0), (3.6, 1.7, 5.9, -2.6))):
        bpy.ops.mesh.primitive_cube_add(location=(x, 0, z))
        d = bpy.context.active_object
        d.name, d.scale = f"Deck{i}", (sx, sy, 0.62)
        _mod(d, "BEVEL", width=0.5, segments=6)
        d.data.materials.append(hull_m if i else deck_m)
        d.data.materials.append(glass)
        objs.append(d)
    return objs
