import { redirect } from 'next/navigation';

export default function TrendsRedirect() {
  redirect('/dashboard/trends/portfolio-trends');
}
