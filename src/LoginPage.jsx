import { useState } from 'react'
import { ArrowRight, Eye, EyeOff, LockKeyhole, MapPin, MapPinned, ShieldCheck } from 'lucide-react'
import './App.css'

export default function LoginPage({ onLogin }) {
  const [mode, setMode] = useState('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [inviteCode, setInviteCode] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  async function submit(event) {
    event.preventDefault()
    setError('')
    setBusy(true)
    try {
      const response = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: mode,
          email: email.trim(),
          password,
          inviteCode,
        }),
      })
      const result = await response.json()
      if (!response.ok || result.error) throw new Error(result.error || 'Could not sign in.')
      onLogin({ token: result.token, user: result.user })
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <main className="auth-page">
      <div className="auth-art" aria-hidden="true">
        <div className="auth-art-top"><span className="brand-mark"><MapPinned size={19} /></span><span>fieldnotes<span className="brand-period">.</span></span></div>
        <div className="auth-art-copy"><span>LOCAL BUSINESS INTELLIGENCE</span><h1>Know your<br />next best lead.</h1><p>Turn local discovery into thoughtful outreach, all in one calm workspace.</p></div>
        <div className="auth-art-grid"><div><span>01</span><strong>Discover</strong><small>Find the right businesses</small></div><div><span>02</span><strong>Understand</strong><small>See the opportunity</small></div><div><span>03</span><strong>Connect</strong><small>Keep every follow-up moving</small></div></div>
        <div className="auth-art-stamp"><MapPin size={15} /> BUILT FOR YOUR NEXT MILE</div>
      </div>
      <section className="auth-panel">
        <div className="auth-mobile-brand"><span className="brand-mark"><MapPinned size={19} /></span><strong>fieldnotes<span className="brand-period">.</span></strong></div>
        <div className="auth-card">
          <span className="auth-kicker"><LockKeyhole size={14} /> PRIVATE WORKSPACE</span>
          <h2>{mode === 'login' ? 'Welcome back' : 'Create your workspace'}</h2>
          <p className="auth-intro">{mode === 'login' ? 'Sign in to pick up where your team left off.' : 'Set up an account to start organizing your leads.'}</p>
          <form onSubmit={submit} className="auth-form">
            <label><span>WORK EMAIL</span><input type="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@company.com" required /></label>
            <label><span>PASSWORD</span><div className="auth-password"><input type={showPassword ? 'text' : 'password'} autoComplete={mode === 'login' ? 'current-password' : 'new-password'} minLength={10} value={password} onChange={(event) => setPassword(event.target.value)} placeholder="At least 10 characters" required /><button type="button" onClick={() => setShowPassword((current) => !current)} aria-label={showPassword ? 'Hide password' : 'Show password'}>{showPassword ? <EyeOff size={16} /> : <Eye size={16} />}</button></div></label>
            {mode === 'register' && <label><span>INVITE CODE <small>Required after the first account</small></span><input value={inviteCode} onChange={(event) => setInviteCode(event.target.value)} placeholder="Ask your workspace admin" /></label>}
            {error && <div className="auth-error" role="alert">{error}</div>}
            <button className="auth-submit" type="submit" disabled={busy}>{busy ? 'Connecting…' : mode === 'login' ? 'Sign in' : 'Create account'}<ArrowRight size={16} /></button>
          </form>
          <div className="auth-switch">{mode === 'login' ? 'New to Fieldnotes?' : 'Already have an account?'} <button type="button" onClick={() => { setMode(mode === 'login' ? 'register' : 'login'); setError('') }}>{mode === 'login' ? 'Create an account' : 'Sign in'}</button></div>
          <div className="auth-security"><ShieldCheck size={15} /><span>Password hashes and sign-in sessions are stored in a separate, private Google spreadsheet.</span></div>
        </div>
        <footer className="auth-footer">FIELDNOTES <span>·</span> YOUR LEADS, KEPT IN ONE PLACE</footer>
      </section>
    </main>
  )
}
