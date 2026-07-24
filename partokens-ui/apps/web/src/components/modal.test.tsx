// @vitest-environment jsdom

import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { useState } from 'react'
import { describe, expect, it } from 'vitest'

import { Modal } from './modal'

function Harness() {
  const [open, setOpen] = useState(false)
  return <><button onClick={() => setOpen(true)}>Open</button>{open ? <Modal label="Example" onClose={() => setOpen(false)}><button>Cancel</button><button data-modal-initial-focus>Confirm</button></Modal> : null}</>
}

describe('Modal', () => {
  it('isolates the application, owns focus, and restores the opener on close', async () => {
    const root = document.createElement('div')
    root.id = 'root'
    document.body.append(root)
    const view = render(<Harness />, { container: root })
    const opener = view.getByRole('button', { name: 'Open' })

    opener.focus()
    fireEvent.click(opener)
    const dialog = await screen.findByRole('dialog', { name: 'Example' })
    await waitFor(() => expect(document.activeElement?.textContent).toBe('Confirm'))
    expect(root.hasAttribute('inert')).toBe(true)
    expect(dialog.getAttribute('aria-modal')).toBe('true')

    fireEvent.keyDown(document, { key: 'Escape' })
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull())
    expect(root.hasAttribute('inert')).toBe(false)
    expect(document.activeElement).toBe(opener)
  })
})
