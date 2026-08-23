import { afterEach, describe, expect, it, vi } from 'vitest'

import {
  clearStudioCredential,
  createStudioProject,
  findStudioNodePosition,
  generateStudioImages,
  getStudioCredential,
  isValidStudioImageSize,
  setStudioCredential,
  studioGroup,
  studioModelCapabilities,
} from '@partokens/studio'

afterEach(clearStudioCredential)

describe('studio credential boundary', () => {
  it('keeps the revealed key only in the module credential slot', () => {
    setStudioCredential({ tokenId: 7, tokenName: 'Studio', key: 'sk-memory-only' })
    expect(getStudioCredential()).toMatchObject({ tokenId: 7, tokenName: 'Studio', key: 'sk-memory-only' })
    clearStudioCredential()
    expect(getStudioCredential()).toBeNull()
  })
})

describe('studio image transport', () => {
  it('uses the generation endpoint and bearer key without returning the key', async () => {
    setStudioCredential({ tokenId: 7, tokenName: 'Studio', key: 'sk-memory-only' })
    const fetcherMock = vi.fn(async (_input: RequestInfo | URL, _init?: RequestInit) => new Response(JSON.stringify({ data: [{ b64_json: 'AQID' }] }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    }))
    const fetcher = fetcherMock as unknown as typeof fetch

    const result = await generateStudioImages({
      model: 'gpt-image-1',
      prompt: 'A measured product photo',
      size: '1024x1024',
      quality: 'medium',
      background: 'transparent',
      count: 1,
    }, undefined, fetcher)

    expect(fetcher).toHaveBeenCalledOnce()
    expect(fetcher).toHaveBeenCalledWith('/v1/images/generations', expect.objectContaining({
      method: 'POST',
      headers: expect.objectContaining({ Authorization: 'Bearer sk-memory-only' }),
    }))
    expect(result[0]?.blob?.size).toBe(3)
    expect(JSON.stringify(result)).not.toContain('sk-memory-only')
  })

  it('uses multipart edits when a source image is connected', async () => {
    setStudioCredential({ tokenId: 8, tokenName: 'Studio edit', key: 'sk-edit-only' })
    const fetcher = vi.fn(async () => new Response(JSON.stringify({ data: [{ b64_json: 'AQID' }] }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    })) as unknown as typeof fetch

    await generateStudioImages({
      model: 'gpt-image-1',
      prompt: 'Keep the composition',
      size: '1024x1024',
      quality: 'medium',
      background: 'auto',
      count: 1,
      sourceImages: [new Blob(['image'], { type: 'image/png' })],
    }, undefined, fetcher)

    expect(fetcher).toHaveBeenCalledWith('/v1/images/edits', expect.objectContaining({ method: 'POST', body: expect.any(FormData) }))
  })

  it('uses a stable translation key for unclassified HTTP failures', async () => {
    setStudioCredential({ tokenId: 9, tokenName: 'Studio failure', key: 'sk-failure-only' })
    const fetcher = vi.fn(async () => new Response(JSON.stringify({}), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })) as unknown as typeof fetch

    await expect(generateStudioImages({
      model: 'gpt-image-1',
      prompt: 'A request that fails safely',
      size: 'auto',
      quality: 'auto',
      background: 'auto',
      count: 1,
    }, undefined, fetcher)).rejects.toThrow('The image service could not complete this request.')
  })

  it('passes supported custom dimensions and up to ten images through unchanged', async () => {
    setStudioCredential({ tokenId: 10, tokenName: 'Studio custom', key: 'sk-custom-only' })
    const fetcherMock = vi.fn(async (_input: RequestInfo | URL, _init?: RequestInit) => new Response(JSON.stringify({ data: [{ b64_json: 'AQID' }] }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    }))
    const fetcher = fetcherMock as unknown as typeof fetch

    await generateStudioImages({
      model: 'gpt-image-1',
      prompt: 'A wide editorial image',
      size: '1600x1024',
      quality: 'medium',
      background: 'auto',
      count: 10,
    }, undefined, fetcher)

    const request = fetcherMock.mock.calls[0]?.[1] as RequestInit
    expect(JSON.parse(String(request.body))).toMatchObject({ size: '1600x1024', n: 10 })
  })

  it('generates GPT Image 2 batches as one request per image without n', async () => {
    setStudioCredential({ tokenId: 11, tokenName: 'GPT Image 2', key: 'sk-image-2-only' })
    let callCount = 0
    const fetcherMock = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      if (String(input) !== '/v1/images/generations') throw new Error(`unexpected request: ${String(input)}`)
      callCount += 1
      const body = JSON.parse(String(init?.body)) as Record<string, unknown>
      expect(body).not.toHaveProperty('n')
      return new Response(JSON.stringify({ data: [{ b64_json: callCount === 1 ? 'AQID' : 'BAUG' }] }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      })
    })
    const fetcher = fetcherMock as unknown as typeof fetch

    const result = await generateStudioImages({
      model: 'gpt-image-2',
      prompt: 'Two different cats',
      size: '1024x1024',
      quality: 'high',
      background: 'auto',
      count: 2,
    }, undefined, fetcher)

    expect(callCount).toBe(2)
    expect(result).toHaveLength(2)
  })

  it('falls back to the Responses image tool when the image endpoint rejects n', async () => {
    setStudioCredential({ tokenId: 12, tokenName: 'GPT Image 2 fallback', key: 'sk-image-2-fallback' })
    const fetcherMock = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      if (String(input) === '/v1/images/generations') {
        return new Response(JSON.stringify({ error: { message: "Unknown parameter: 'tools[0].n'." } }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        })
      }
      if (String(input) !== '/v1/responses') throw new Error(`unexpected request: ${String(input)}`)
      const body = JSON.parse(String(init?.body)) as { tools?: Array<Record<string, unknown>> }
      expect(body.tools).toEqual([{ type: 'image_generation', size: '1024x1024', quality: 'high' }])
      return new Response(JSON.stringify({
        output: [{ type: 'image_generation_call', result: 'AQID' }],
      }), { status: 200, headers: { 'Content-Type': 'application/json' } })
    })

    const result = await generateStudioImages({
      model: 'gpt-image-2',
      prompt: 'A small cat',
      size: '1024x1024',
      quality: 'high',
      background: 'auto',
      count: 1,
    }, undefined, fetcherMock as unknown as typeof fetch)

    expect(result).toHaveLength(1)
    expect(fetcherMock).toHaveBeenCalledTimes(2)
  })
})

describe('studio model capabilities', () => {
  it('gates DALL-E 3 to one output and no edit flow', () => {
    expect(studioModelCapabilities('dall-e-3')).toMatchObject({ maxCount: 1, supportsEdit: false })
  })

  it('allows GPT Image requests to select up to ten outputs', () => {
    expect(studioModelCapabilities('gpt-image-1').maxCount).toBe(10)
  })

  it('offers a compact set of recommended GPT Image sizes plus custom size support', () => {
    const capabilities = studioModelCapabilities('gpt-image-1')

    expect(capabilities.supportsCustomSize).toBe(true)
    expect(capabilities.sizes).toEqual(['auto', '1024x1024', '1536x1024', '1024x1536', '1792x1024', '1024x1792', '2048x1152', '1152x2048'])
    expect(capabilities.sizes.filter((item) => item !== 'auto')).toHaveLength(7)
  })

  it('validates custom dimensions before a request is sent', () => {
    expect(isValidStudioImageSize('1600x1024', 'gpt-image-1')).toBe(true)
    expect(isValidStudioImageSize('1600x900', 'gpt-image-1')).toBe(false)
    expect(isValidStudioImageSize('480x480', 'gpt-image-1')).toBe(false)
    expect(isValidStudioImageSize('3840x1280', 'gpt-image-1')).toBe(true)
    expect(isValidStudioImageSize('3840x1264', 'gpt-image-1')).toBe(false)
    expect(isValidStudioImageSize('custom')).toBe(false)
    expect(isValidStudioImageSize('1600x1024', 'dall-e-3')).toBe(false)
  })

  it('uses conservative defaults for models without a reviewed override', () => {
    expect(studioModelCapabilities('unreviewed-image-model')).toEqual({
      sizes: ['auto'],
      qualities: ['auto'],
      backgrounds: ['auto'],
      maxCount: 1,
      supportsEdit: false,
      supportsCustomSize: false,
    })
  })
})

describe('studio project factory', () => {
  it('accepts a localized title for the initial prompt node', () => {
    const project = createStudioProject('user:7', '未命名画布', '图片提示词')

    expect(project.title).toBe('未命名画布')
    expect(project.nodes[0]?.title).toBe('图片提示词')
    expect(project.settings.group).toBe(studioGroup)
  })

  it('places new nodes outside existing node bounds', () => {
    const existing = [{ x: 96, y: 96, width: 250, height: 170 }]
    const position = findStudioNodePosition(existing, 220, 145, { x: 96, y: 96 })

    expect(position).toEqual({ x: 96, y: 298 })
  })

  it('finds another free position for repeated generated nodes', () => {
    const existing = [
      { x: 96, y: 96, width: 250, height: 170 },
      { x: 426, y: 96, width: 260, height: 225 },
    ]
    const position = findStudioNodePosition(existing, 260, 225, { x: 426, y: 96 })

    expect(position).toEqual({ x: 426, y: 353 })
  })
})
