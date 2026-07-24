import {
  ArrowRight,
  Bell,
  CalendarDays,
  Check,
  CheckCircle2,
  Chrome,
  CircleDollarSign,
  Copy,
  CreditCard,
  Disc3,
  ExternalLink,
  Fingerprint,
  Gift,
  Github,
  KeyRound,
  Link2,
  LockKeyhole,
  Mail,
  RefreshCw,
  ShieldCheck,
  Trash2,
  UserRound,
  WalletCards,
  X,
  type LucideIcon,
} from 'lucide-react'
import { useState, type FormEvent, type ReactNode } from 'react'

import { resources, type AppLocale } from '@partokens/i18n'

import { translateConsoleAccount } from './console-account-copy'
import { useDialogBehavior } from './console-dialog-behavior'

export type ConsoleAccountScreen = 'console-wallet' | 'console-profile' | 'console-security' | 'console-connections' | 'console-notifications'

type ConsoleAccountPrototypeProps = {
  screen: ConsoleAccountScreen
  locale: AppLocale
  go: (target: ConsoleAccountScreen) => void
  notify: (message: string) => void
}

type Translate = (key: string) => string

function translate(locale: AppLocale, key: string) {
  const local = translateConsoleAccount(locale, key)
  return local === key ? (resources[locale].translation as Record<string, string>)[key] ?? key : local
}

function PageHeading({ eyebrow, title, body, actions }: { eyebrow: string; title: string; body: string; actions?: ReactNode }) {
  return <header className="r33-page-heading"><div><span>{eyebrow}</span><h1>{title}</h1><p>{body}</p></div>{actions ? <div className="r33-page-actions">{actions}</div> : null}</header>
}

function PrimaryRoute({ children, onClick, disabled = false }: { children: ReactNode; onClick: () => void; disabled?: boolean }) {
  return <button type="button" className="pt-button" data-variant="primary" disabled={disabled} onClick={onClick}><span>{children}</span><span className="pt-button-endcap"><ArrowRight size={16} /></span></button>
}

function Modal({ active, label, t, onClose, children, footer }: { active: boolean; label: string; t: Translate; onClose: () => void; children: ReactNode; footer: ReactNode }) {
  const ref = useDialogBehavior<HTMLElement>(active, onClose)
  if (!active) return null
  return <div className="r33-dialog-layer"><button type="button" tabIndex={-1} className="r33-scrim" aria-label={t('Close')} onClick={onClose} /><section ref={ref} tabIndex={-1} className="r33-dialog r34-dialog" role="dialog" aria-modal="true" aria-labelledby="r34-dialog-title"><header><h2 id="r34-dialog-title">{label}</h2><button type="button" className="pt-icon-button" aria-label={t('Close')} title={t('Close')} onClick={onClose}><X size={17} /></button></header><div>{children}</div><footer>{footer}</footer></section></div>
}

function SectionHeading({ eyebrow, title, aside }: { eyebrow: string; title: string; aside?: ReactNode }) {
  return <header><div><span>{eyebrow}</span><h2>{title}</h2></div>{aside}</header>
}

const amountOptions = [10, 25, 50, 100]
const discounts: Record<number, number> = { 10: 1, 25: 0.96, 50: 0.92, 100: 0.88 }
const billingRows: Array<[string, string, string, string, string, string]> = [
  ['PT-20260718-4821', '2026-07-18 14:32', 'Stripe', '$50.00', '$46.00', 'success'],
  ['PT-20260628-1934', '2026-06-28 09:16', 'Alipay', '$25.00', '$24.00', 'success'],
  ['PT-20260602-7790', '2026-06-02 18:40', 'Stripe', '$10.00', '$10.00', 'success'],
]

function WalletPage({ locale, notify }: Pick<ConsoleAccountPrototypeProps, 'locale' | 'notify'>) {
  const t = (key: string) => translate(locale, key)
  const [amount, setAmount] = useState(50)
  const [method, setMethod] = useState('Stripe')
  const [preference, setPreference] = useState('subscription_first')
  const [redemption, setRedemption] = useState('')
  const [confirming, setConfirming] = useState(false)
  const discount = discounts[amount] ?? 1
  const paid = amount * discount
  const resulting = 82.4 + amount

  const completeTopup = () => {
    setConfirming(false)
    notify(t('Demo interaction'))
  }

  return <>
    <PageHeading eyebrow={`${t('Console')} / ${t('Wallet')}`} title={t('Wallet')} body={t('Manage balance, subscriptions, payments, and account rewards.')} actions={<span className="r33-draft-label">{t('Draft content')}</span>} />

    <section className="r34-wallet-hero" aria-label={t('Account balance')}>
      <div className="r34-wallet-total"><span><WalletCards size={18} />{t('Account balance')}</span><strong>$82.40</strong><small>USD · {t('Updated')} 10:42</small></div>
      <dl><div><dt>{t('Total usage')}</dt><dd>$126.54</dd></div><div><dt>{t('Pending rewards')}</dt><dd>$12.80</dd></div><div><dt>{t('Active plan')}</dt><dd>Builder</dd></div></dl>
    </section>

    <section className="r33-section r34-section r34-plan-band">
      <SectionHeading eyebrow="SUBSCRIPTION" title={t('Plans and billing order')} aside={<span className="pt-status" data-tone="success">{t('Active')}</span>} />
      <div className="r34-plan-row">
        <div><strong>Builder</strong><p>$20.00 {t('Included quota')} · 30 {t('days')}</p></div>
        <div><span>{t('Renews or expires')}</span><strong>2026-08-15</strong></div>
        <label className="pt-field"><span>{t('Usage billing preference')}</span><span className="pt-field-control"><select value={preference} onChange={(event) => { setPreference(event.target.value); notify(t('Billing preference updated')) }}><option value="subscription_first">{t('Subscription first')}</option><option value="wallet_first">{t('Balance first')}</option><option value="subscription_only">{t('Subscription only')}</option><option value="wallet_only">{t('Balance only')}</option></select></span></label>
      </div>
    </section>

    <section className="r33-section r34-section r34-topup-section">
      <SectionHeading eyebrow="TOP UP" title={t('Preset amounts')} aside={<span>{t('No custom amount entry is available.')}</span>} />
      <div className="r34-topup-layout">
        <div className="r34-amount-panel">
          <div className="r34-amount-options" role="radiogroup" aria-label={t('Preset amounts')}>{amountOptions.map((item) => {
            const optionDiscount = discounts[item] ?? 1
            return <button type="button" role="radio" aria-checked={amount === item} className={amount === item ? 'active' : ''} key={item} onClick={() => setAmount(item)}><span>${item}</span><small>{optionDiscount < 1 ? `${Math.round((1 - optionDiscount) * 100)}% ${t('off')}` : t('Configured amount')}</small><i /></button>
          })}</div>
          <label className="pt-field"><span>{t('Payment method')}</span><span className="pt-field-control"><CreditCard className="pt-field-leading" size={16} /><select value={method} onChange={(event) => setMethod(event.target.value)}><option>Stripe</option><option>Alipay</option><option>WeChat Pay</option></select></span></label>
        </div>

        <div className="r34-balance-route">
          <div className="r34-route-title"><span>{t('Billing route')}</span><p>{t('See how a configured amount changes from selection to account balance.')}</p></div>
          <div className="r34-route-track">
            <div><span>01</span><small>{t('Configured amount')}</small><strong>${amount.toFixed(2)}</strong></div><i />
            <div><span>02</span><small>{t('off')}</small><strong>{discount < 1 ? `${Math.round((1 - discount) * 100)}%` : '0%'}</strong></div><i />
            <div><span>03</span><small>{t('Estimated payment')}</small><strong>${paid.toFixed(2)}</strong></div><i />
            <div className="is-result"><span>04</span><small>{t('Resulting balance')}</small><strong>${resulting.toFixed(2)}</strong></div>
          </div>
          <div className="r34-route-action"><span><CheckCircle2 size={16} />{method} · {t('Payment preview')}</span><PrimaryRoute onClick={() => setConfirming(true)}><CreditCard size={16} />{t('Continue to payment')}</PrimaryRoute></div>
        </div>
      </div>
    </section>

    <div className="r34-wallet-actions">
      <section className="r33-section r34-section">
        <SectionHeading eyebrow="REDEEM" title={t('Redeem a code')} aside={<CircleDollarSign size={18} />} />
        <form className="r34-inline-form" onSubmit={(event) => { event.preventDefault(); if (!redemption.trim()) return; setRedemption(''); notify(t('Redemption successful')) }}><label className="pt-field"><span>{t('Redemption code')}</span><span className="pt-field-control"><input value={redemption} onChange={(event) => setRedemption(event.target.value)} placeholder="PT-XXXX-XXXX" /></span></label><button type="submit" className="pt-button" data-variant="secondary" disabled={!redemption.trim()}>{t('Redeem')}</button></form>
      </section>
      <section className="r33-section r34-section">
        <SectionHeading eyebrow="REWARDS" title={t('Affiliate rewards')} aside={<Gift size={18} />} />
        <div className="r34-reward-row"><div><span>{t('Pending rewards')}</span><strong>$12.80</strong></div><div><span>{t('Total earned')}</span><strong>$68.20</strong></div><div><span>{t('Invites')}</span><strong>14</strong></div><button type="button" className="pt-button" data-variant="secondary" onClick={() => notify(t('Rewards transferred'))}>{t('Transfer to balance')}</button></div>
      </section>
    </div>

    <section className="r33-section r34-section r33-table-section">
      <SectionHeading eyebrow="HISTORY" title={t('Billing history')} aside={<button type="button" className="pt-icon-button" aria-label={t('Refresh')} title={t('Refresh')} onClick={() => notify(t('Updated'))}><RefreshCw size={16} /></button>} />
      <div className="r33-table-wrap"><table className="pt-table r33-responsive-table"><thead><tr><th>{t('Order')}</th><th>{t('Time')}</th><th>{t('Payment method')}</th><th>{t('Amount')}</th><th>{t('Paid')}</th><th>{t('Status')}</th></tr></thead><tbody>{billingRows.map(([order, time, paymentMethod, billedAmount, rowPaid]) => <tr key={order}><td data-label={t('Order')}><code>{order}</code></td><td data-label={t('Time')}>{time}</td><td data-label={t('Payment method')}>{paymentMethod}</td><td data-label={t('Amount')}>{billedAmount}</td><td data-label={t('Paid')}>{rowPaid}</td><td data-label={t('Status')}><span className="pt-status" data-tone="success">{t('Success')}</span></td></tr>)}</tbody></table></div>
    </section>

    <Modal active={confirming} label={t('Confirm top-up')} t={t} onClose={() => setConfirming(false)} footer={<><button type="button" className="pt-button" data-variant="secondary" onClick={() => setConfirming(false)}>{t('Cancel')}</button><PrimaryRoute onClick={completeTopup}>{t('Confirm and continue')}</PrimaryRoute></>}><dl className="r34-confirm-list"><div><dt>{t('Selected amount')}</dt><dd>${amount.toFixed(2)}</dd></div><div><dt>{t('off')}</dt><dd>{discount < 1 ? `${Math.round((1 - discount) * 100)}%` : '0%'}</dd></div><div><dt>{t('Payment method')}</dt><dd>{method}</dd></div><div><dt>{t('Estimated payment')}</dt><dd>${paid.toFixed(2)}</dd></div></dl><p>{t('A payment page will open after confirmation.')}</p></Modal>
  </>
}

const accountTabs: Array<{ screen: Exclude<ConsoleAccountScreen, 'console-wallet'>; label: string; icon: LucideIcon }> = [
  { screen: 'console-profile', label: 'Profile', icon: UserRound },
  { screen: 'console-security', label: 'Security', icon: ShieldCheck },
  { screen: 'console-connections', label: 'Connections', icon: Link2 },
  { screen: 'console-notifications', label: 'Notifications', icon: Bell },
]

function AccountTabs({ screen, t, go }: { screen: ConsoleAccountScreen; t: Translate; go: ConsoleAccountPrototypeProps['go'] }) {
  return <nav className="r34-account-tabs" aria-label={t('Account center')}>{accountTabs.map(({ screen: target, label, icon: Icon }) => <button type="button" key={target} aria-current={screen === target ? 'page' : undefined} onClick={() => go(target)}><Icon size={16} /><span>{t(label)}</span></button>)}</nav>
}

function TrustRail({ t, go }: { t: Translate; go: ConsoleAccountPrototypeProps['go'] }) {
  const items: Array<{ label: string; value: string; icon: LucideIcon; state: string; target: ConsoleAccountScreen }> = [
    { label: 'Identity', value: 'Mika Chen', icon: UserRound, state: 'complete', target: 'console-profile' },
    { label: 'Email', value: 'mika@partokens.com', icon: Mail, state: 'complete', target: 'console-connections' },
    { label: 'Two-factor authentication', value: 'Ready to protect', icon: LockKeyhole, state: 'available', target: 'console-security' },
    { label: 'Passkey', value: 'Ready to protect', icon: Fingerprint, state: 'available', target: 'console-security' },
  ]
  return <section className="r34-trust"><header><div><span>{t('Account trust')}</span><p>{t('Keep identity, recovery, and sign-in protection visible in one route.')}</p></div><span className="pt-status" data-tone="warning">2 / 4</span></header><div>{items.map(({ label, value, icon: Icon, state, target }, index) => <button type="button" key={label} onClick={() => go(target)} data-state={state}><span className="r34-trust-icon"><Icon size={17} /></span><small>{t(label)}</small><strong>{value.includes('@') || value === 'Mika Chen' ? value : t(value)}</strong><i>{state === 'complete' ? <Check size={13} /> : index + 1}</i></button>)}</div></section>
}

function ProfileDetails({ t, notify }: { t: Translate; notify: (message: string) => void }) {
  const [displayName, setDisplayName] = useState('Mika Chen')
  const [checkedIn, setCheckedIn] = useState(false)
  const days = Array.from({ length: 35 }, (_, index) => index < 3 || index > 33 ? null : index - 2)
  return <div className="r34-profile-grid">
    <form className="r33-section r34-section r34-profile-form" onSubmit={(event) => { event.preventDefault(); notify(t('Profile updated')) }}>
      <SectionHeading eyebrow="IDENTITY" title={t('Profile details')} aside={<UserRound size={18} />} />
      <div className="r34-form-body"><label className="pt-field"><span>{t('Display name')}</span><span className="pt-field-control"><input value={displayName} onChange={(event) => setDisplayName(event.target.value)} /></span></label><label className="pt-field"><span>{t('Username')}</span><span className="pt-field-control"><input value="mika" disabled /></span></label><label className="pt-field"><span>{t('Email')}</span><span className="pt-field-control"><input value="mika@partokens.com" disabled /></span></label></div>
      <footer><button type="submit" className="pt-button" data-variant="primary">{t('Save profile')}</button></footer>
    </form>
    <section className="r33-section r34-section r34-checkin">
      <SectionHeading eyebrow="DAILY CREDIT" title={t('Daily check-in')} aside={<CalendarDays size={18} />} />
      <div className="r34-calendar-head"><strong>2026 / 07</strong><span>{t('This month')}: {checkedIn ? 13 : 12}</span></div>
      <div className="r34-calendar" aria-label={t('Check-in activity')}>{['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((day, index) => <small key={`${day}-${index}`}>{day}</small>)}{days.map((day, index) => <span key={`${day}-${index}`} className={day && [1, 2, 3, 7, 9, 11, 14, 16, 18, 20].includes(day) || (checkedIn && day === 22) ? 'checked' : day === 22 ? 'today' : ''}>{day}{day && ([1, 2, 3, 7, 9, 11, 14, 16, 18, 20].includes(day) || (checkedIn && day === 22)) ? <Check size={9} /> : null}</span>)}</div>
      <button type="button" className="pt-button" data-variant={checkedIn ? 'secondary' : 'primary'} disabled={checkedIn} onClick={() => { setCheckedIn(true); notify(t('Checked in today')) }}>{checkedIn ? <Check size={16} /> : <CalendarDays size={16} />}{t(checkedIn ? 'Checked in today' : 'Check in')}</button>
    </section>
  </div>
}

type SecurityDialog = 'two-factor' | 'passkey' | 'token' | 'delete' | null

function SecurityPage({ t, notify }: { t: Translate; notify: (message: string) => void }) {
  const [dialog, setDialog] = useState<SecurityDialog>(null)
  const [twoFactor, setTwoFactor] = useState(false)
  const [passkey, setPasskey] = useState(false)
  const [token, setToken] = useState('')
  const [code, setCode] = useState('')
  const [deletePassword, setDeletePassword] = useState('')
  const [deletePhrase, setDeletePhrase] = useState('')

  const close = () => { setDialog(null); setCode(''); setDeletePassword(''); setDeletePhrase('') }
  const confirmSecurity = () => {
    if (dialog === 'two-factor') { setTwoFactor(true); notify(t('Enabled')) }
    if (dialog === 'passkey') { setPasskey(true); notify(t('Account connected')) }
    if (dialog === 'token') { setToken('pt_sys_demo_8X4K-29PM-7Q2A'); notify(t('Generated')) }
    if (dialog === 'delete') notify(t('Demo interaction'))
    close()
  }

  return <>
    <div className="r34-security-grid">
      <section className="r33-section r34-section r34-security-method"><SectionHeading eyebrow="TOTP" title={t('Two-factor authentication')} aside={<LockKeyhole size={18} />} /><div><p>{t('Use an authenticator app and backup codes to protect account access.')}</p><span className="r34-security-state"><small>{t('Status')}</small><strong>{t(twoFactor ? 'Enabled' : 'Disabled')}</strong></span><button type="button" className="pt-button" data-variant={twoFactor ? 'secondary' : 'primary'} onClick={() => twoFactor ? setTwoFactor(false) : setDialog('two-factor')}>{twoFactor ? t('Disable 2FA') : t('Set up 2FA')}</button></div></section>
      <section className="r33-section r34-section r34-security-method"><SectionHeading eyebrow="WEBAUTHN" title={t('Passkey')} aside={<Fingerprint size={18} />} /><div><p>{t('Use your device biometrics or security key for phishing-resistant verification.')}</p><span className="r34-security-state"><small>{t('Status')}</small><strong>{t(passkey ? 'Enabled' : 'Disabled')}</strong></span><button type="button" className="pt-button" data-variant={passkey ? 'secondary' : 'primary'} onClick={() => passkey ? setPasskey(false) : setDialog('passkey')}>{passkey ? t('Delete Passkey') : t('Register Passkey')}</button></div></section>
    </div>
    <section className="r33-section r34-section r34-token-section"><SectionHeading eyebrow="SYSTEM CREDENTIAL" title={t('System access token')} aside={<KeyRound size={18} />} /><div><p>{t('This token grants access to account-level system APIs. Generate it only when required.')}</p>{token ? <div className="r34-secret"><code>{token}</code><button type="button" className="pt-icon-button" aria-label={t('Copy')} title={t('Copy')} onClick={() => { void navigator.clipboard?.writeText(token); notify(t('Copied')) }}><Copy size={16} /></button></div> : <span className="r34-token-empty">•••• •••• •••• ••••</span>}<button type="button" className="pt-button" data-variant="secondary" onClick={() => setDialog('token')}>{t(token ? 'Regenerate token' : 'Generate token')}</button></div></section>
    <form className="r33-section r34-section r34-password" onSubmit={(event) => { event.preventDefault(); notify(t('Password updated')); event.currentTarget.reset() }}><SectionHeading eyebrow="PASSWORD" title={t('Change password')} aside={<ShieldCheck size={18} />} /><div className="r34-password-fields"><label className="pt-field"><span>{t('Current password')}</span><span className="pt-field-control"><input type="password" autoComplete="current-password" required /></span></label><label className="pt-field"><span>{t('New password')}</span><span className="pt-field-control"><input type="password" autoComplete="new-password" required /></span></label><label className="pt-field"><span>{t('Confirm password')}</span><span className="pt-field-control"><input type="password" autoComplete="new-password" required /></span></label><button type="submit" className="pt-button" data-variant="primary">{t('Update password')}</button></div></form>
    <section className="r34-danger-zone"><div><span>{t('Danger zone')}</span><h2>{t('Delete account')}</h2><p>{t('Permanently disable this account and revoke access. This action cannot be undone.')}</p></div><button type="button" className="pt-button" data-variant="danger" onClick={() => setDialog('delete')}><Trash2 size={15} />{t('Delete account')}</button></section>

    <Modal active={dialog === 'two-factor'} label={t('Set up 2FA')} t={t} onClose={close} footer={<><button type="button" className="pt-button" data-variant="secondary" onClick={close}>{t('Cancel')}</button><button type="button" className="pt-button" data-variant="primary" disabled={!code} onClick={confirmSecurity}>{t('Enable 2FA')}</button></>}><div className="r34-setup-key"><span><ShieldCheck size={20} /></span><div><small>{t('Manual setup key')}</small><code>JBSW Y3DP EHPK 3PXP</code></div></div><p>{t('Use an authenticator app and backup codes to protect account access.')}</p><label className="pt-field"><span>{t('Authenticator code')}</span><span className="pt-field-control"><input value={code} onChange={(event) => setCode(event.target.value)} inputMode="numeric" placeholder="000 000" /></span></label></Modal>
    <Modal active={dialog === 'passkey'} label={t('Register Passkey')} t={t} onClose={close} footer={<><button type="button" className="pt-button" data-variant="secondary" onClick={close}>{t('Cancel')}</button><button type="button" className="pt-button" data-variant="primary" onClick={confirmSecurity}><Fingerprint size={16} />{t('Verify and continue')}</button></>}><div className="r34-passkey-prompt"><span><Fingerprint size={24} /></span><p>{t('Use your device biometrics or security key for phishing-resistant verification.')}</p></div></Modal>
    <Modal active={dialog === 'token'} label={t(token ? 'Regenerate access token?' : 'Generate access token?')} t={t} onClose={close} footer={<><button type="button" className="pt-button" data-variant="secondary" onClick={close}>{t('Cancel')}</button><button type="button" className="pt-button" data-variant="primary" onClick={confirmSecurity}>{t('Confirm')}</button></>}><p>{t('Generating a new token invalidates the previous value. The full token is shown only in this window.')}</p></Modal>
    <Modal active={dialog === 'delete'} label={t('Delete account')} t={t} onClose={close} footer={<><button type="button" className="pt-button" data-variant="secondary" onClick={close}>{t('Cancel')}</button><button type="button" className="pt-button" data-variant="danger" disabled={!deletePassword || deletePhrase !== 'mika'} onClick={confirmSecurity}><Trash2 size={15} />{t('Permanently delete')}</button></>}><p>{t('Permanently disable this account and revoke access. This action cannot be undone.')}</p><label className="pt-field"><span>{t('Password')}</span><span className="pt-field-control"><input type="password" value={deletePassword} onChange={(event) => setDeletePassword(event.target.value)} /></span></label><label className="pt-field"><span>{t('Type username to confirm')}: <code>mika</code></span><span className="pt-field-control"><input value={deletePhrase} onChange={(event) => setDeletePhrase(event.target.value)} /></span></label></Modal>
  </>
}

function ConnectionsPage({ t, notify }: { t: Translate; notify: (message: string) => void }) {
  const [connections, setConnections] = useState<Record<string, boolean>>({ Email: true, GitHub: true, LinuxDO: false, Google: false })
  const rows: Array<{ label: string; detail: string; icon: LucideIcon }> = [
    { label: 'Email', detail: 'mika@partokens.com', icon: Mail },
    { label: 'GitHub', detail: '@mika-chen', icon: Github },
    { label: 'LinuxDO', detail: t('Available to connect'), icon: Disc3 },
    { label: 'Google', detail: t('Available to connect'), icon: Chrome },
  ]
  const toggle = (label: string) => {
    setConnections((current) => ({ ...current, [label]: !current[label] }))
    notify(t(connections[label] ? 'Disconnected' : 'Account connected'))
  }
  return <section className="r33-section r34-section r34-connections"><SectionHeading eyebrow="SIGN-IN" title={t('Connected sign-in methods')} aside={<Link2 size={18} />} /><div>{rows.map(({ label, detail, icon: Icon }) => <div className="r34-connection-row" key={label}><span className="r34-provider-icon"><Icon size={18} /></span><div><strong>{label}</strong><small>{connections[label] ? detail : t('Not connected')}</small></div><span className="pt-status" data-tone={connections[label] ? 'success' : 'info'}>{t(connections[label] ? 'Connected' : 'Available')}</span><button type="button" className="pt-button" data-variant="secondary" onClick={() => toggle(label)}>{t(connections[label] ? 'Disconnect' : 'Connect')}</button></div>)}</div></section>
}

type NotifyMethod = 'email' | 'webhook' | 'bark' | 'gotify'

function NotificationsPage({ locale, t, notify }: { locale: AppLocale; t: Translate; notify: (message: string) => void }) {
  const [method, setMethod] = useState<NotifyMethod>('email')
  const [unsetPrice, setUnsetPrice] = useState(false)
  const [recordIp, setRecordIp] = useState(false)
  return <form className="r33-section r34-section r34-notifications" onSubmit={(event) => { event.preventDefault(); notify(t('Preferences updated')) }}><SectionHeading eyebrow="NOTIFICATIONS" title={t('Notifications and behavior')} aside={<Bell size={18} />} /><div className="r34-notify-form"><div className="r34-notify-fields"><label className="pt-field"><span>{t('Interface language')}</span><span className="pt-field-control"><input value={locale} disabled /></span></label><label className="pt-field"><span>{t('Notification method')}</span><span className="pt-field-control"><select value={method} onChange={(event) => setMethod(event.target.value as NotifyMethod)}><option value="email">Email</option><option value="webhook">Webhook</option><option value="bark">Bark</option><option value="gotify">Gotify</option></select></span></label><label className="pt-field"><span>{t('Balance warning in USD')}</span><span className="pt-field-control"><input type="number" min="0.01" step="0.01" defaultValue="10.00" /></span></label>{method === 'email' ? <label className="pt-field"><span>{t('Notification email')}</span><span className="pt-field-control"><input type="email" defaultValue="mika@partokens.com" /></span></label> : null}{method === 'webhook' ? <><label className="pt-field"><span>{t('Webhook URL')}</span><span className="pt-field-control"><input type="url" placeholder="https://example.com/webhook" /></span></label><label className="pt-field"><span>{t('Webhook secret')}</span><span className="pt-field-control"><input type="password" /></span></label></> : null}{method === 'bark' ? <label className="pt-field"><span>{t('Bark push URL')}</span><span className="pt-field-control"><input type="url" placeholder="https://api.day.app/..." /></span></label> : null}{method === 'gotify' ? <><label className="pt-field"><span>{t('Gotify server URL')}</span><span className="pt-field-control"><input type="url" /></span></label><label className="pt-field"><span>{t('Gotify application token')}</span><span className="pt-field-control"><input type="password" /></span></label></> : null}</div><div className="r34-private-settings"><span>{t('Private behavior')}</span><label><span><strong>{t('Allow models without configured pricing')}</strong><small>{t('Requests may use models whose price has not been set')}</small></span><button type="button" className="pt-switch" role="switch" aria-checked={unsetPrice} onClick={() => setUnsetPrice((value) => !value)}><span /></button></label><label><span><strong>{t('Record request IP in logs')}</strong><small>{t('Store source IP addresses in your private usage logs')}</small></span><button type="button" className="pt-switch" role="switch" aria-checked={recordIp} onClick={() => setRecordIp((value) => !value)}><span /></button></label></div></div><footer><button type="submit" className="pt-button" data-variant="primary">{t('Save preferences')}</button></footer></form>
}

function AccountFamily({ screen, locale, go, notify }: ConsoleAccountPrototypeProps) {
  const t = (key: string) => translate(locale, key)
  const title = screen === 'console-security' ? 'Security' : screen === 'console-connections' ? 'Connections' : screen === 'console-notifications' ? 'Notifications' : 'Profile'
  const body = screen === 'console-security' ? 'Manage passwords and stronger sign-in methods from one security surface.' : screen === 'console-connections' ? 'Review the services that can sign in to this account.' : screen === 'console-notifications' ? 'Choose where balance alerts arrive and how private request data is handled.' : 'Edit the information people see without exposing internal account identifiers.'
  return <>
    <PageHeading eyebrow={`${t('Console')} / ${t('Account center')}`} title={t(title)} body={t(body)} actions={<span className="r33-draft-label">{t('Draft content')}</span>} />
    <AccountTabs screen={screen} t={t} go={go} />
    <TrustRail t={t} go={go} />
    {screen === 'console-profile' ? <ProfileDetails t={t} notify={notify} /> : null}
    {screen === 'console-security' ? <SecurityPage t={t} notify={notify} /> : null}
    {screen === 'console-connections' ? <ConnectionsPage t={t} notify={notify} /> : null}
    {screen === 'console-notifications' ? <NotificationsPage locale={locale} t={t} notify={notify} /> : null}
  </>
}

export function ConsoleAccountPage(props: ConsoleAccountPrototypeProps) {
  return props.screen === 'console-wallet' ? <WalletPage locale={props.locale} notify={props.notify} /> : <AccountFamily {...props} />
}
