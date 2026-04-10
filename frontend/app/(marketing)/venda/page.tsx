import { redirect } from 'next/navigation'

// Pricing page hidden during pre-launch phase.
// Traffic is redirected to the waitlist page.
export default function VendaPage() {
  redirect('/euthy-lancamento')
}
