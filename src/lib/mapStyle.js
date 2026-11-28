// Recolours the OpenFreeMap "liberty" style into the site's dark palette.
// Only the site's own colours (see --color-* in index.css): dark browns, with gold for main roads.
const C = {
  ground: '#16110e', // --color-bg
  land: '#16110e',
  residential: '#1a1411',
  park: '#1b1813', // a faint olive-brown, still on palette
  water: '#0c0907', // darker than the page so the sea reads as sea
  building: '#1d1713', // --color-panel
  major: '#7a5f37', // --color-gold, dimmed
  secondary: '#4d3d29',
  minor: '#2d241c',
  casing: '#0f0c0a',
  rail: '#3a2f26',
  label: '#b4aa9c', // --color-muted
  labelSoft: '#8a8074', // --color-faint
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
      set(map, id, 'fill-extrusion-color', ['interpolate', ['linear'], ['coalesce', ['get', 'render_height'], 0], 0, '#211a15', 60, '#2b221b', 150, '#372b21'])
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
      set(map, id, 'text-color', /water/.test(id) ? C.labelSoft : /road|highway/.test(id) ? C.labelSoft : C.label)
      set(map, id, 'text-halo-color', C.halo)
      set(map, id, 'text-halo-width', 1.2)
    } else if (type === 'raster' || type === 'hillshade') {
      map.setLayoutProperty(id, 'visibility', 'none')
    }
  }
}
