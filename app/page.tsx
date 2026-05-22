import { redirect } from 'next/navigation';

// Root redirects to /menu (table param optional — added by QR code)
export default function Home() {
  redirect('/menu');
}
