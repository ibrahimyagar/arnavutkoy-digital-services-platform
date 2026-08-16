import { useState, type FormEvent, type ReactNode } from 'react'

export type CardPaymentValues = {
  cardHolderName: string
  cardNumber: string
  expiryMonthYear: string
  cvv: string
}

const defaults: CardPaymentValues = {
  cardHolderName: '',
  cardNumber: '',
  expiryMonthYear: '',
  cvv: '',
}

type Props = {
  submitLabel: string
  busy?: boolean
  busyLabel?: string
  onSubmit: (values: CardPaymentValues) => Promise<void> | void
  extraFields?: ReactNode
  initialHolder?: string
}

function formatCardNumber(value: string) {
  const digits = value.replace(/\D/g, '').slice(0, 19)
  return digits.replace(/(\d{4})(?=\d)/g, '$1 ').trim()
}

function formatExpiry(value: string) {
  const digits = value.replace(/\D/g, '').slice(0, 4)
  if (digits.length <= 2) return digits
  return `${digits.slice(0, 2)}/${digits.slice(2)}`
}

export function CardPaymentForm({ submitLabel, busy, busyLabel, onSubmit, extraFields, initialHolder }: Props) {
  const [values, setValues] = useState<CardPaymentValues>({
    ...defaults,
    cardHolderName: initialHolder ?? '',
  })
  const [localError, setLocalError] = useState<string | null>(null)

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setLocalError(null)
    const digits = values.cardNumber.replace(/\s/g, '')
    if (digits.length < 15) {
      setLocalError('Kart numarası en az 15 hane olmalı.')
      return
    }
    if (!/^\d{2}\/\d{2}$/.test(values.expiryMonthYear)) {
      setLocalError('Son kullanma AA/YY formatında olmalı.')
      return
    }
    if (!/^\d{3,4}$/.test(values.cvv)) {
      setLocalError('CVV 3 veya 4 hane olmalı.')
      return
    }
    await onSubmit({
      ...values,
      cardNumber: digits,
    })
  }

  return (
    <form className="stack" onSubmit={(e) => void handleSubmit(e)}>
      {extraFields}
      <h3 style={{ margin: 0 }}>Kart bilgileri</h3>
      <p className="muted" style={{ margin: 0, fontSize: '0.85rem' }}>
        Demo tahsilat; gerçek banka işlemi yoktur. Örnek: 4111111111111111 · 12/30 · 123
      </p>
      {localError ? <div className="error-box">{localError}</div> : null}
      <div className="field">
        <label htmlFor="cardHolder">Kart sahibi</label>
        <input
          id="cardHolder"
          value={values.cardHolderName}
          onChange={(e) => setValues((v) => ({ ...v, cardHolderName: e.target.value }))}
          required
          autoComplete="cc-name"
        />
      </div>
      <div className="field">
        <label htmlFor="payCardNumber">Kart no</label>
        <input
          id="payCardNumber"
          inputMode="numeric"
          value={values.cardNumber}
          onChange={(e) => setValues((v) => ({ ...v, cardNumber: formatCardNumber(e.target.value) }))}
          required
          autoComplete="cc-number"
          placeholder="XXXX XXXX XXXX XXXX"
        />
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
        <div className="field">
          <label htmlFor="expiry">SKT (AA/YY)</label>
          <input
            id="expiry"
            value={values.expiryMonthYear}
            onChange={(e) => setValues((v) => ({ ...v, expiryMonthYear: formatExpiry(e.target.value) }))}
            required
            placeholder="12/30"
            autoComplete="cc-exp"
          />
        </div>
        <div className="field">
          <label htmlFor="cvv">CVV</label>
          <input
            id="cvv"
            value={values.cvv}
            onChange={(e) => setValues((v) => ({ ...v, cvv: e.target.value.replace(/\D/g, '').slice(0, 4) }))}
            required
            autoComplete="cc-csc"
            inputMode="numeric"
          />
        </div>
      </div>
      <button className="btn btn-primary" type="submit" disabled={busy}>
        {busy ? (busyLabel ?? 'İşleniyor…') : submitLabel}
      </button>
    </form>
  )
}
