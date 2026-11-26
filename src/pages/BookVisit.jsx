import { useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { ArrowRight, Check, CircleCheck, CircleAlert, Loader2 } from 'lucide-react'
import { RESIDENCES } from '../data/residences'
import { BOOK_VISIT_PHOTO } from '../data/media'
import { LEAD_ENDPOINT, SALES_LOUNGE } from '../data/site'
import { useIsDesktop } from '../lib/hooks'

const TIMES = ['Morning', 'Afternoon', 'Evening']

// Indian mobile: optional +91 / 0, then 10 digits starting 6–9.
const normalisePhone = (v) => v.replace(/[\s()-]/g, '').replace(/^(\+?91|0)(?=\d{10}$)/, '')
const phoneValid = (v) => /^[6-9]\d{9}$/.test(normalisePhone(v))
const emailValid = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim())
const nameValid = (v) => v.trim().length >= 2

const VALIDATORS = { name: nameValid, phone: phoneValid, email: emailValid }
// Kept short: each error sits on the label's line, so it never adds height.
const ERRORS = {
  name: 'Enter your name',
  phone: '10-digit number',
  email: 'Invalid email',
}

export default function BookVisit() {
  const isDesktop = useIsDesktop()
  const [params] = useSearchParams()
  const [form, setForm] = useState({ name: '', phone: '', email: '' })
  const [touched, setTouched] = useState({})
  const [home, setHome] = useState(RESIDENCES.some((r) => r.id === params.get('home')) ? params.get('home') : null)
  const [time, setTime] = useState(null)
  const [status, setStatus] = useState({ state: 'idle' }) // idle | sending | sent | error

  const fieldState = (k) => (!touched[k] || !form[k] ? 'idle' : VALIDATORS[k](form[k]) ? 'ok' : 'bad')
  const allValid = Object.keys(VALIDATORS).every((k) => VALIDATORS[k](form[k]))

  const onSubmit = async (e) => {
    e.preventDefault()
    setTouched({ name: true, phone: true, email: true })
    if (!allValid || status.state === 'sending') return
    if (!LEAD_ENDPOINT) {
      setStatus({
        state: 'error',
        message: `Online booking isn’t connected yet. Please call ${SALES_LOUNGE.phone} and our team will book your visit.`,
      })
      return
    }
    setStatus({ state: 'sending' })
    try {
      const res = await fetch(LEAD_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name.trim(),
          phone: `+91${normalisePhone(form.phone)}`,
          email: form.email.trim(),
          residence: home,
          preferredTime: time,
          source: 'website-book-visit',
          page: window.location.href,
          submittedAt: new Date().toISOString(),
        }),
      })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      setStatus({ state: 'sent' })
    } catch {
      setStatus({ state: 'error', message: `We couldn’t send your request. Please try again or call ${SALES_LOUNGE.phone}.` })
    }
  }

  const field = (key, label, props) => {
    const st = fieldState(key)
    return (
      <label className="block min-w-0">
        <span className="flex items-baseline justify-between gap-2">
          <span className="truncate text-[12px] font-semibold uppercase tracking-[0.12em] text-ink/70">
            {label} <span className="text-gold">*</span>
          </span>
          {st === 'bad' && (
            <span id={`${key}-err`} className="shrink-0 text-[12px] text-bad">
              {ERRORS[key]}
            </span>
          )}
        </span>
        <span className="relative mt-1.5 block compact:mt-1 land:mt-0.5">
          <input
            {...props}
            value={form[key]}
            onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
            onBlur={() => setTouched((t) => ({ ...t, [key]: true }))}
            aria-invalid={st === 'bad'}
            aria-describedby={st === 'bad' ? `${key}-err` : undefined}
            className={`h-11 w-full rounded-lg border bg-white/[0.04] px-3.5 pr-10 text-[14px] compact:h-9 land:h-8 text-ink outline-none transition-colors placeholder:text-ink/35 focus:bg-white/[0.07] ${
              st === 'bad' ? 'border-bad' : st === 'ok' ? 'border-ok/70' : 'border-white/12 focus:border-gold/70'
            }`}
          />
          {st === 'ok' && <Check size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-ok" />}
          {st === 'bad' && <CircleAlert size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-bad" />}
        </span>
      </label>
    )
  }

  const formEl = (
    <form onSubmit={onSubmit} noValidate className="relative flex flex-col gap-4 compact:gap-2.5 land:grid land:grid-cols-2 land:gap-x-5 land:gap-y-2">
      <div className="land:col-span-2">
        <p className="eyebrow compact:hidden">Private Consultation</p>
        <h1 className="mt-1.5 font-display text-[22px] font-semibold xs:text-[26px] lg:text-[30px] compact:mt-0 compact:text-[20px] land:text-[18px]">Book a Private Viewing</h1>
        <p className="mt-1 text-[14px] text-ink/65 compact:hidden">Share your details and our advisory team will confirm your visit.</p>
      </div>
      <div className="flex flex-col gap-4 compact:gap-2.5 land:gap-2">
      {field('name', 'Full Name', { type: 'text', autoComplete: 'name', placeholder: 'Your full name' })}
      <div className="grid gap-4 compact:gap-2.5 md:grid-cols-2 land:grid-cols-1 land:gap-2">
        {field('phone', 'Mobile Number', { type: 'tel', inputMode: 'tel', autoComplete: 'tel', placeholder: '+91 98XXX XXXXX' })}
        {field('email', 'Email Address', { type: 'email', autoComplete: 'email', placeholder: 'you@example.com' })}
      </div>
      </div>

      <div className="flex flex-col gap-4 compact:gap-2.5 land:justify-between land:gap-2">
      <fieldset>
        <legend className="text-[12px] font-semibold uppercase tracking-[0.12em] text-ink/70">Preferred Residence</legend>
        <div className="mt-1.5 grid grid-cols-2 gap-3">
          {RESIDENCES.map((r) => {
            const active = home === r.id
            return (
              <button
                key={r.id}
                type="button"
                aria-pressed={active}
                onClick={() => setHome(active ? null : r.id)}
                className={`rounded-xl border px-4 py-3 text-left transition-colors compact:px-3 compact:py-1.5 land:py-1 ${
                  active ? 'border-gold bg-gold/10' : 'border-white/12 bg-white/[0.03] hover:border-white/30'
                }`}
              >
                <span className="block font-display text-[16px] font-semibold compact:text-[14px]">{r.title}</span>
                <span className={`block text-[12px] ${active ? 'text-gold' : 'text-ink/55'}`}>
                  {r.carpetArea.toLocaleString('en-IN')} sq.ft{isDesktop ? ` · ${r.tag}` : ''}
                </span>
              </button>
            )
          })}
        </div>
      </fieldset>

      <fieldset>
        <legend className="text-[12px] font-semibold uppercase tracking-[0.12em] text-ink/70">Preferred Visit Time</legend>
        <div className="mt-1.5 flex flex-wrap gap-2">
          {TIMES.map((t) => (
            <button
              key={t}
              type="button"
              aria-pressed={time === t}
              onClick={() => setTime(time === t ? null : t)}
              className={`rounded-full px-4 py-2 text-[13px] font-medium transition-colors compact:py-1.5 land:py-1 ${
                time === t ? 'bg-gold text-[#1a130d]' : 'border border-white/12 text-ink/75 hover:text-ink'
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      </fieldset>

      <button type="submit" disabled={status.state === 'sending' || status.state === 'sent'} className="btn-gold mt-2 h-12 w-full shrink-0 text-[15px] compact:mt-0 compact:h-10 land:h-9 land:text-[14px]">
        {status.state === 'sending' ? (
          <>
            <Loader2 size={16} className="animate-spin" /> Sending…
          </>
        ) : status.state === 'sent' ? (
          <>
            <Check size={16} /> Request Sent
          </>
        ) : (
          <>
            Confirm Private Viewing <ArrowRight size={16} />
          </>
        )}
      </button>

      </div>

      {/* Floats over the form so a message never pushes the page taller. */}
      <div aria-live="polite" className="absolute inset-x-0 bottom-14 z-10 compact:bottom-12 land:bottom-11">
        {status.state === 'sent' && (
          <p className="flex items-start gap-2 rounded-lg border border-ok/50 bg-[#17251e] px-4 py-3 text-[13px] text-ok">
            <CircleCheck size={16} className="mt-0.5 shrink-0" />
            Thank you, {form.name.trim().split(' ')[0]}. Your request is in — our advisory team will call you to confirm your visit.
          </p>
        )}
        {status.state === 'error' && (
          <p className="flex items-start gap-2 rounded-lg border border-bad/50 bg-[#2a1816] px-4 py-3 text-[13px] text-bad">
            <CircleAlert size={16} className="mt-0.5 shrink-0" />
            {status.message}
          </p>
        )}
      </div>
    </form>
  )

  const photo = (
    <div className="relative h-full overflow-hidden rounded-2xl">
      <img src={BOOK_VISIT_PHOTO.src} alt={BOOK_VISIT_PHOTO.alt} className="absolute inset-0 h-full w-full object-cover" />
      <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-black/30" />
      <img src="/media/tughra-logo-cream.png" alt="Tughra Royale" className="absolute left-6 top-6 h-24 w-auto" />
      <div className="absolute inset-x-6 bottom-6">
        <p className="eyebrow">By Appointment Only</p>
        <p className="mt-1.5 font-display text-[30px] font-semibold leading-[1.1]">
          Visit the Sales
          <br />
          Gallery.
        </p>
        <p className="mt-3 text-[13px] text-ink/75">{SALES_LOUNGE.name}</p>
        <p className="text-[13px] text-ink/75">
          {SALES_LOUNGE.hours} ·{' '}
          <a href={`tel:${SALES_LOUNGE.phone.replace(/\s/g, '')}`} className="underline-offset-2 hover:underline">
            {SALES_LOUNGE.phone}
          </a>
        </p>
      </div>
    </div>
  )

  if (!isDesktop) {
    return (
      <div className="absolute inset-x-0 bottom-[var(--nav-h)] top-0 flex flex-col justify-center overflow-hidden px-4 pb-2 pt-[max(0.5rem,env(safe-area-inset-top))] md:px-8">
        <div className="mx-auto w-full max-w-[560px] land:max-w-[760px]">{formEl}</div>
        <p className="mt-6 text-center text-[12px] text-ink/50 [@media(max-height:760px)]:hidden">
          {SALES_LOUNGE.name} · {SALES_LOUNGE.hours}
        </p>
      </div>
    )
  }

  return (
    <div className="absolute inset-x-4 bottom-4 top-[88px] grid grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] gap-4">
      {photo}
      <div className="solid-panel overflow-hidden rounded-2xl">
        <div className="mx-auto flex h-full max-w-[560px] flex-col justify-center px-8 py-8 compact:py-3">{formEl}</div>
      </div>
    </div>
  )
}
