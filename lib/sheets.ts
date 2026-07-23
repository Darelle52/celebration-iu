const SHEET_ID = '1s_yUdfAjF3zlPbGE2RF5pSis-nouSgkqD-hFQyP4nOA'
const CLIENT_EMAIL = 'sheets-rsvp@mariage-ingrid-ulrich.iam.gserviceaccount.com'
const PRIVATE_KEY = process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n') || ''

async function getAccessToken(): Promise<string> {
  const now = Math.floor(Date.now() / 1000)
  const header = { alg: 'RS256', typ: 'JWT' }
  const payload = {
    iss: CLIENT_EMAIL,
    scope: 'https://www.googleapis.com/auth/spreadsheets',
    aud: 'https://oauth2.googleapis.com/token',
    exp: now + 3600,
    iat: now,
  }
  const encode = (obj: object) =>
    Buffer.from(JSON.stringify(obj)).toString('base64url')
  const headerB64 = encode(header)
  const payloadB64 = encode(payload)
  const signingInput = `${headerB64}.${payloadB64}`
  const crypto = await import('crypto')
  const sign = crypto.createSign('RSA-SHA256')
  sign.update(signingInput)
  const signature = sign.sign(PRIVATE_KEY, 'base64url')
  const jwt = `${signingInput}.${signature}`
  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion: jwt,
    }),
  })
  const data = await res.json()
  return data.access_token
}

export async function appendToSheet(row: string[], color?: string) {
  try {
    const token = await getAccessToken()
    const appendUrl = `https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}/values/A1:append?valueInputOption=USER_ENTERED&includeValuesInResponse=true`
    const appendRes = await fetch(appendUrl, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ values: [row] }),
    })
    const appendData = await appendRes.json()

    if (color && appendData.updates?.updatedRange) {
      const range = appendData.updates.updatedRange
      const rowNum = parseInt(range.match(/\d+$/)?.[0] || '0')
      if (rowNum > 1) {
        const hex = color.replace('#', '')
        const r = parseInt(hex.substring(0, 2), 16) / 255
        const g = parseInt(hex.substring(2, 4), 16) / 255
        const b = parseInt(hex.substring(4, 6), 16) / 255

        const colorUrl = `https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}:batchUpdate`
        await fetch(colorUrl, {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({
            requests: [{
              repeatCell: {
                range: {
                  sheetId: 0,
                  startRowIndex: rowNum - 1,
                  endRowIndex: rowNum,
                  startColumnIndex: 0,
                  endColumnIndex: 6
                },
                cell: {
                  userEnteredFormat: {
                    backgroundColor: { red: r, green: g, blue: b },
                    textFormat: { foregroundColor: { red: 1, green: 1, blue: 1 } }
                  }
                },
                fields: 'userEnteredFormat(backgroundColor,textFormat)'
              }
            }]
          }),
        })
      }
    }
    console.log('Sheet updated OK')
  } catch (e) {
    console.error('Sheet error:', e)
  }
}

// Append to a specific sheet/tab by name (e.g. "Messages")
export async function appendToSheetTab(sheetName: string, row: string[]) {
  try {
    const token = await getAccessToken()
    const range = `${sheetName}!A1`
    const url = `https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}/values/${encodeURIComponent(range)}:append?valueInputOption=USER_ENTERED`
    const res = await fetch(url, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ values: [row] }),
    })
    const data = await res.json()
    if (data.error) console.error('Sheet tab error:', data.error)
    else console.log('Sheet tab updated OK')
  } catch (e) {
    console.error('Sheet tab error:', e)
  }
}
