// Guest scores handed over from the old address (see handOffPage in server/app.js) arrive in the
// URL fragment as #sg-transfer=<json>&hash=<the page's own fragment, e.g. #archive>. They're added to this browser's storage without replacing
// anything already here, then the fragment is removed so a reload or a shared link doesn't repeat it.
const PREFIX = '#sg-transfer='
const RESULTS_KEY = 'soccer-guessr:results'
const PROGRESS_KEY = 'soccer-guessr:progress'

const isRound = (round) => /^[1-9]\d{0,5}$/.test(round)
const isObject = (value) => value && typeof value === 'object' && !Array.isArray(value)

function validResult(result) {
  if (!isObject(result)) return false
  const { earned, available } = result
  return Number.isInteger(available) && available > 0 && Number.isInteger(earned) && earned >= 0 && earned <= available
}

function validProgress(state) {
  return isObject(state) && Number.isInteger(state.step) && state.step >= 0 && isObject(state.guesses) && Array.isArray(state.results)
}

function read(key) {
  try {
    const value = JSON.parse(localStorage.getItem(key))
    return isObject(value) ? value : {}
  } catch {
    return {}
  }
}

// Exported for tests: merges handed-over data into what's already stored and returns the result.
export function mergeTransfer(data, stored) {
  const results = { ...stored.results }
  for (const [round, result] of Object.entries(isObject(data[RESULTS_KEY]) ? data[RESULTS_KEY] : {})) {
    if (isRound(round) && !results[round] && validResult(result)) results[round] = result
  }
  const progress = { ...stored.progress }
  for (const [round, state] of Object.entries(isObject(data[PROGRESS_KEY]) ? data[PROGRESS_KEY] : {})) {
    if (isRound(round) && !results[round] && !progress[round] && validProgress(state)) progress[round] = state
  }
  return { results, progress }
}

export function importTransfer() {
  if (!window.location.hash.startsWith(PREFIX)) return
  const [payload, hashPart = ''] = window.location.hash.slice(PREFIX.length).split('&hash=')
  let hash = ''
  try {
    hash = decodeURIComponent(hashPart)
    const data = JSON.parse(decodeURIComponent(payload))
    if (isObject(data)) {
      const { results, progress } = mergeTransfer(data, { results: read(RESULTS_KEY), progress: read(PROGRESS_KEY) })
      localStorage.setItem(RESULTS_KEY, JSON.stringify(results))
      localStorage.setItem(PROGRESS_KEY, JSON.stringify(progress))
    }
  } catch {
    // A garbled link or no storage: the player just starts fresh here.
  }
  window.history.replaceState(null, '', window.location.pathname + window.location.search + (hash.startsWith('#') ? hash : ''))
}
