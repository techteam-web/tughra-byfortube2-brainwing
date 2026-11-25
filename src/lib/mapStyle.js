// Recolours the OpenFreeMap "liberty" style into the site's dark palette.
const C = {
  ground: '#16110e',
  land: '#1a1410',
  residential: '#1d1612',
  park: '#1c2419',
  water: '#0f1c27',
  building: '#2a211b',
  major: '#6b5442',
  secondary: '#4c3c30',
  minor: '#33291f',
  casing: '#120e0b',
  rail: '#3a2f26',
  label: '#b4aa9c',
  labelSoft: '#8a8074',
  halo: '#16110e',
}

const set = (map, id, prop, value) => {
  try {
    map.setPaintProperty(id, prop, value)
  } catch {
    /* property not valid for this layer */
  }
}

export function applyDarkStyle(map) {
  for (const layer of map.getStyle().layers) {
    const { id, type } = layer
    if (type === 'background') set(map, id, 'background-color', C.ground)
    else if (type === 'fill') {
      let color = C.land
      if (/water/.test(id)) color = C.water
      else if (/park|grass|wood|pitch/.test(id)) color = C.park
      else if (/residential/.test(id)) color = C.residential
      else if (/building/.test(id)) color = C.building
      set(map, id, 'fill-color', color)
      set(map, id, 'fill-outline-color', 'rgba(0,0,0,0)')
      if (/pattern|ice|wetland|sand/.test(id)) map.setLayoutProperty(id, 'visibility', 'none')
    } else if (type === 'fill-extrusion') {
      set(map, id, 'fill-extrusion-color', ['interpolate', ['linear'], ['coalesce', ['get', 'render_height'], 0], 0, '#241c17', 60, '#2f251e', 150, '#3d2f25'])
      set(map, id, 'fill-extrusion-opacity', 0.92)
    } else if (type === 'line') {
      if (/waterway/.test(id)) set(map, id, 'line-color', C.water)
      else if (/boundary|hatching|one_way/.test(id)) map.setLayoutProperty(id, 'visibility', 'none')
      else if (/casing/.test(id)) set(map, id, 'line-color', C.casing)
      else if (/rail/.test(id)) set(map, id, 'line-color', C.rail)
      else if (/motorway|trunk|primary/.test(id)) set(map, id, 'line-color', C.major)
      else if (/secondary|tertiary/.test(id)) set(map, id, 'line-color', C.secondary)
      else if (/road|bridge|tunnel|path|street|link|service|track/.test(id)) set(map, id, 'line-color', C.minor)
      else set(map, id, 'line-color', C.minor)
    } else if (type === 'symbol') {
      // Keep place and road names, drop POI icons, shields and arrows.
      if (/poi|shield|airport|arrow|transit|aerodrome/.test(id)) {
        map.setLayoutProperty(id, 'visibility', 'none')
        continue
      }
      set(map, id, 'text-color', /water/.test(id) ? '#5d7a93' : /road|highway/.test(id) ? C.labelSoft : C.label)
      set(map, id, 'text-halo-color', C.halo)
      set(map, id, 'text-halo-width', 1.2)
    } else if (type === 'raster' || type === 'hillshade') {
      map.setLayoutProperty(id, 'visibility', 'none')
    }
  }
}
