// Lets pages wait for the preloader to finish before running their entrance animations.
let resolveIntro
export const introDone = new Promise((r) => (resolveIntro = r))
export const finishIntro = () => resolveIntro()

/** The logo intro plays on every full page load (it has a Skip button). */
export const shouldPlayIntro = () => true
