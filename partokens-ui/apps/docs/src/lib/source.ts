import { docs } from '@/.source'
import { loader } from 'fumadocs-core/source'

import { i18n } from './locales'

export const source = loader({
  baseUrl: '/docs',
  i18n,
  source: docs.toFumadocsSource(),
})
