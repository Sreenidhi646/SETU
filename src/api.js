// Integration point for the team. Matching is done by the backend (verified scheme DB + deterministic rules), never in the frontend.
// Expected scheme record (suggested): { name, level: 'central' | 'state', state, status: 'eligible' | 'ineligible' | 'need_info',
//   conditions: [{ text, met }], official_url, last_verified }
export function matchSchemes(profile) {
  // e.g. return fetch('/api/eligibility', { method: 'POST', body: JSON.stringify(profile) }).then(r => r.json())
  return { connected: false, profile, schemes: [] }
}
