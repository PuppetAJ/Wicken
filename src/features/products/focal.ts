const focalX: Record<string, number> = {
  'ash-dining-table': 25,
  'ash-glaze-dinner-plate': 40,
  'cobalt-column-vase': 0,
  'column-table-lamp': 0,
  'deep-serving-bowl': 30,
  'elm-side-table': 25,
  'everyday-side-plate': 8,
  'globe-wall-light': 8,
  'hanging-pendant-shade': 90,
  'harvest-vase': 45,
  'smoke-glaze-vase': 75,
  'spouted-pendant': 70,
  'stoneware-teapot': 30,
  'taper-candle-holders': 30,
}

export function focalPosition(slug: string): string {
  return `${focalX[slug] ?? 50}% 50%`
}
