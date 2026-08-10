import { buildRequestTimeline } from '../lib/requestStatus'

export function RequestStatusTimeline({ status }: { status: string }) {
  const steps = buildRequestTimeline(status)

  return (
    <ol className="request-timeline" aria-label="Talep durum adımları">
      {steps.map((step, index) => (
        <li key={step.status} className={`request-timeline-step is-${step.state}`}>
          {index > 0 ? <span className="request-timeline-line" aria-hidden /> : null}
          <span className="request-timeline-dot" aria-hidden />
          <span className="request-timeline-label">{step.label}</span>
        </li>
      ))}
    </ol>
  )
}
