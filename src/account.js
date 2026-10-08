// Talks to the account API in server/app.js. Every call resolves to the parsed
// JSON body or throws an Error carrying the server's message.
async function call(method, url, body) {
  const response = await fetch(url, {
    method,
    credentials: 'same-origin',
    headers: body ? { 'Content-Type': 'application/json' } : {},
    body: body ? JSON.stringify(body) : undefined,
  })
  const data = await response.json().catch(() => ({}))
  if (!response.ok) throw new Error(data.error || 'Something went wrong. Try again.')
  return data
}

export const getSession = () => call('GET', '/api/session')
export const signUp = (email, password) => call('POST', '/api/signup', { email, password })
export const signIn = (email, password) => call('POST', '/api/login', { email, password })
export const signOut = () => call('POST', '/api/logout', {})
export const fetchResults = () => call('GET', '/api/results')
// Saves finished rounds; the account keeps its first score for any round it already has.
export const uploadResults = (results) => call('POST', '/api/results', { results })
