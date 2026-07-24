export const dynamic = 'force-static'

export function GET() {
  return Response.json({ service: 'partokens-docs', status: 'ok' }, {
    headers: { 'Cache-Control': 'no-store' },
  })
}
