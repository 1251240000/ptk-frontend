// @vitest-environment jsdom

import { fireEvent, render, screen } from '@testing-library/react'
import { Mail } from 'lucide-react'
import { describe, expect, it, vi } from 'vitest'

import { AuthField, PasswordField } from '../auth-shell'

describe('authentication fields', () => {
  it('associates visible labels, hints, and errors with the native input', () => {
    render(<AuthField label="Email" value="invalid" onChange={vi.fn()} icon={Mail} type="email" error="Enter a valid email" />)

    const input = screen.getByLabelText('Email')
    expect(input.getAttribute('type')).toBe('email')
    expect(input.getAttribute('aria-invalid')).toBe('true')
    expect(document.getElementById(input.getAttribute('aria-describedby') || '')?.textContent).toBe('Enter a valid email')
  })

  it('keeps a localized accessible name on the password reveal control', () => {
    render(<PasswordField locale="zh-CN" label="密码" value="secret-value" onChange={vi.fn()} autoComplete="current-password" />)

    const input = screen.getByLabelText('密码')
    const reveal = screen.getByRole('button', { name: '显示密码' })
    expect(input.getAttribute('type')).toBe('password')
    expect(reveal.getAttribute('tabindex')).toBe('-1')

    fireEvent.click(reveal)
    expect(input.getAttribute('type')).toBe('text')
    expect(screen.getByRole('button', { name: '隐藏密码' })).not.toBeNull()
  })
})
