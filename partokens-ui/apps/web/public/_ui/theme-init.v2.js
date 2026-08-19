;(() => {
  const storageKey = 'partokens-theme'
  const media = window.matchMedia('(prefers-color-scheme: dark)')

  const readPreference = () => {
    try {
      const value = window.localStorage.getItem(storageKey)
      return value === 'light' || value === 'dark' || value === 'system' ? value : 'system'
    } catch {
      return 'system'
    }
  }

  const resolveTheme = () => {
    const preference = readPreference()
    return preference === 'dark' || (preference === 'system' && media.matches) ? 'dark' : 'light'
  }

  const ensureIcon = (key, rel, size) => {
    let link = document.querySelector(`link[data-partokens-theme-icon="${key}"]`)
    if (!link) {
      link = document.createElement('link')
      link.dataset.partokensThemeIcon = key
      link.rel = rel
      link.type = 'image/png'
      link.sizes = `${size}x${size}`
      document.head.append(link)
    }
    return link
  }

  const syncBrandAssets = (theme) => {
    for (const size of [16, 32]) {
      ensureIcon(`favicon-${size}`, 'icon', size).href = `/brand/partokens-mark-reference-${size}.png`
    }
    ensureIcon('apple-touch-icon-180', 'apple-touch-icon', 180).href = '/brand/partokens-mark-reference-180.png'

    let themeColor = document.querySelector('meta[name="theme-color"]')
    if (!themeColor) {
      themeColor = document.createElement('meta')
      themeColor.name = 'theme-color'
      document.head.append(themeColor)
    }
    themeColor.content = theme === 'dark' ? '#0d0f12' : '#f7f9fb'
  }

  const syncResolvedTheme = () => {
    const theme = document.documentElement.dataset.theme === 'dark' || document.documentElement.classList.contains('dark') ? 'dark' : 'light'
    syncBrandAssets(theme)
  }

  const applyStoredTheme = () => {
    document.documentElement.dataset.theme = resolveTheme()
    syncResolvedTheme()
  }

  applyStoredTheme()
  new MutationObserver(syncResolvedTheme).observe(document.documentElement, { attributes: true, attributeFilter: ['class', 'data-theme'] })

  const onSystemTheme = () => {
    if (readPreference() === 'system') applyStoredTheme()
  }
  if (typeof media.addEventListener === 'function') media.addEventListener('change', onSystemTheme)
  else media.addListener(onSystemTheme)

  window.addEventListener('storage', (event) => {
    if (event.key === storageKey) applyStoredTheme()
  })
})()
