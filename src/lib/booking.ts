import { clinic } from '../config/clinic'

export interface BookingPayload {
  name: string
  phone: string
  email: string
  treatment: string
  date: string
  message: string
}

export type BookingResult =
  | { status: 'confirmed'; reference?: string }
  | { status: 'received'; reference?: string }
  | { status: 'handoff' }
  | { status: 'error'; message: string }

/**
 * Sends a booking request to the configured clinic API.
 * - No endpoint configured → 'handoff' (the UI offers WhatsApp / phone; nothing is claimed).
 * - 2xx → 'received' unless the backend explicitly returns { status: 'confirmed' }.
 */
export async function submitBooking(payload: BookingPayload, signal?: AbortSignal): Promise<BookingResult> {
  const endpoint = clinic.booking.endpoint
  if (!endpoint) return { status: 'handoff' }
  try {
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({ ...payload, source: 'website' }),
      signal,
    })
    if (!res.ok) return { status: 'error', message: `The booking service responded with ${res.status}.` }
    let data: { status?: string; reference?: string } = {}
    try {
      data = await res.json()
    } catch {
      /* empty body is fine */
    }
    return data.status === 'confirmed'
      ? { status: 'confirmed', reference: data.reference }
      : { status: 'received', reference: data.reference }
  } catch (e) {
    if ((e as Error).name === 'AbortError') throw e
    return { status: 'error', message: 'We couldn’t reach the booking service.' }
  }
}

export function bookingWhatsappText(p: BookingPayload, treatmentName: string) {
  return [
    `Hello ${clinic.name}! I'd like to request an appointment.`,
    `Name: ${p.name}`,
    `Phone: ${p.phone}`,
    p.email && `Email: ${p.email}`,
    treatmentName && `Treatment: ${treatmentName}`,
    p.date && `Preferred date: ${p.date}`,
    p.message && `Note: ${p.message}`,
  ]
    .filter(Boolean)
    .join('\n')
}
