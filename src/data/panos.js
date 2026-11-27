// Panorama scenes exported from Marzipano Tool (public/Fortune-panos/app-files/tiles).
// Every scene shares the same tile pyramid; only the starting view differs.
// Values: [initial yaw, initial pitch] in radians.
export const PANO_TILE_ROOT = '/Fortune-panos/app-files/tiles'

export const PANO_LEVELS = [
  { tileSize: 256, size: 256, fallbackOnly: true },
  { tileSize: 512, size: 512 },
  { tileSize: 512, size: 1024 },
  { tileSize: 512, size: 2048 },
  { tileSize: 512, size: 4096 },
]
export const PANO_FACE_SIZE = 3600

export const SCENES = {
  "0-day_0027_podium-hight-3765m": [1.8996, -0.0225],
  "1-day_0026_1st-floor----42m": [1.7174, -0.0719],
  "2-day_0025_2nd-floor----459m": [1.7844, -0.0553],
  "3-day_0024_3rd-floor---498m": [1.6315, 0.0053],
  "4-day_0023_4th-floor---537m": [1.7656, 0.0374],
  "5-day_0022_5th-floor---576m": [1.6926, 0.0166],
  "6-day_0021_6th-floor---615m": [1.6934, -0.0105],
  "7-day_0016_7th-floor---654m": [1.7943, 0.0406],
  "8-day_0014_8th-floor---693m": [1.6971, -0.048],
  "9-day_0013_9th-floor---732m": [1.8124, -0.0092],
  "10-day_0012_10th-floor---771m": [1.8299, 0.0258],
  "11-day_0011_11th-floor---81m": [1.7998, 0.0003],
  "12-day_0010_12th-floor---849m": [1.8835, 0.0243],
  "13-day_0009_13th-floor---888": [1.8096, 0.0203],
  "14-day_0008_14th-floor---927m": [1.868, 0.0346],
  "15-day_0007_15th-floor---966m": [1.8757, 0.0669],
  "16-day_0005_16th-floor-1005m": [1.7839, 0.0472],
  "17-day_0004_17th-floor---1047m": [1.7776, 0.0089],
  "18-day_0003_terrace---1089m": [1.7906, 0.0074],
  "19-evening_0086_terrace---1089m": [1.8139, 0.0142],
  "20-evening_0085_17th-floor---1047m": [1.8118, 0.0434],
  "21-evening_0084_16th-floor---1005m": [1.8204, 0.0415],
  "22-evening_0083_15th-floor---966m": [1.8167, 0.034],
  "23-evening_0082_14th-floor---927m": [1.8128, 0.0314],
  "24-evening_0081_13th-floor---888m": [1.8069, 0.0105],
  "25-evening_0080_12th-floor---849m": [1.7991, 0.0224],
  "26-evening_0079_11th-floor---81m": [1.8107, 0.0116],
  "27-evening_0078_10th-floor---771m": [1.7868, 0.0229],
  "28-evening_0077_9th-floor---732m": [1.794, 0.0239],
  "29-evening_0076_8th-floor---693m": [1.8078, 0.0359],
  "30-evening_0075_7th-floor---654m": [1.8058, 0.0267],
  "31-evening_0074_6th-floor---615m": [1.7916, 0.0341],
  "32-evening_0073_5th-floor---576m": [1.7792, -0.0117],
  "33-evening_0072_4th-floor---537m": [1.7886, 0.0048],
  "34-evening_0071_3rd-floor---498m": [1.806, 0.0129],
  "35-evening_0070_2nd-floor---459m": [1.7936, 0.0277],
  "36-evening_0069_1st-floor---42m": [1.7817, 0.0002],
  "37-evening_0068_podium-3765m": [1.7715, 0.0142],
  "38-night_0090_terrace---1089m": [1.776, 0.0142],
  "39-night_0091_17th-floor---1047m": [1.7871, 0.0276],
  "40-night_0092_16th-floor---1005m": [1.7652, 0.0171],
  "41-night_0093_15th-floor---966m": [1.7472, 0.0076],
  "42-night_0094_14th-floor---927m": [1.777, 0.0244],
  "43-night_0095_13th-floor---888m": [1.7712, 0.018],
  "44-night_0096_12th-floor---849m": [1.7748, 0.0257],
  "45-night_0097_11th-floor---81m": [1.772, 0.0176],
  "46-night_0098_10th-floor---771m": [1.7771, 0.0154],
  "47-night_0099_9th-floor---732m": [1.768, 0.0183],
  "48-night_0100_8th-floor--693m": [1.7653, 0.0075],
  "49-night_0101_7th-floor---654m": [1.7666, -0.0],
  "50-night_0102_6th-floor---615m": [1.7421, 0.0074],
  "51-night_0103_5th-floor---576m": [1.78, 0.0392],
  "52-night_0104_4th-floor---537m": [1.7557, 0.0111],
  "53-night_0105_3rd-floor---498m": [1.7531, 0.0219],
  "54-night_0106_2nd-floor---459m": [1.7596, 0.0129],
  "55-night_0107_1st-floor---42m": [1.7518, 0.0353],
  "56-night_0108_podium---3765m": [1.7644, 0.0151],
}

const sceneByNumber = Object.fromEntries(Object.keys(SCENES).map((id) => [Number(id.split('-')[0]), id]))

// Top to bottom. Scene numbers are the Marzipano export prefixes: [day, evening, night].
// Heights are the finished floor levels in metres above ground (±0.00) from the building
// section in "2D Render.dwg". The export's floors 1-17 are the residential floors 11th-27th;
// the podium view is from the 10th floor amenity deck and the terrace view from the pool terrace.
const FLOOR_ROWS = [
  ['Terrace', 'TER', 111.3, [18, 19, 38]],
  ['27th Floor', '27', 105.3, [17, 20, 39]],
  ['26th Floor', '26', 101.1, [16, 21, 40]],
  ['25th Floor', '25', 97.2, [15, 22, 41]],
  ['24th Floor', '24', 93.3, [14, 23, 42]],
  ['23rd Floor', '23', 89.4, [13, 24, 43]],
  ['22nd Floor', '22', 85.5, [12, 25, 44]],
  ['21st Floor', '21', 81.6, [11, 26, 45]],
  ['20th Floor', '20', 77.7, [10, 27, 46]],
  ['19th Floor', '19', 73.8, [9, 28, 47]],
  ['18th Floor', '18', 69.9, [8, 29, 48]],
  ['17th Floor', '17', 66, [7, 30, 49]],
  ['16th Floor', '16', 62.1, [6, 31, 50]],
  ['15th Floor', '15', 58.2, [5, 32, 51]],
  ['14th Floor', '14', 54.3, [4, 33, 52]],
  ['13th Floor', '13', 50.4, [3, 34, 53]],
  ['12th Floor', '12', 46.5, [2, 35, 54]],
  ['11th Floor', '11', 42.6, [1, 36, 55]],
  ['Podium', 'POD', 36.3, [0, 37, 56]],
]

export const PANO_FLOORS = FLOOR_ROWS.map(([label, short, height, [d, e, n]]) => ({
  label,
  short,
  height,
  scenes: { day: sceneByNumber[d], evening: sceneByNumber[e], night: sceneByNumber[n] },
}))

export const LIGHT_MODES = [
  { key: 'day', label: 'Day' },
  { key: 'evening', label: 'Evening' },
  { key: 'night', label: 'Night' },
]

// Compass calibration: the yaw (radians) at which the camera looks due west.
// Measured on the panoramas themselves: the Mahalaxmi Racecourse oval and the twin spires of
// The Imperial (Tardeo) both line up with their true map bearings from the tower at this value.
// All 57 scenes share it (they match each other to within 2 degrees).
export const WEST_YAW = 1.068

// Home page background panorama (drone shot from the terrace) with a
// transparent foreground layer of the tower's own balcony on top.
export const HOME_PANO = {
  tiles: '/assets/mainpano/tiles/0-dji_0086_terrace---1089m_new',
  foreground: '/assets/mainpano/fg/{f}.webp',
  startYawDeg: 60,
}
