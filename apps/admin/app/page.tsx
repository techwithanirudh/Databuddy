import Link from 'next/link';

export default function AdminHomePage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen">
      <h1 className="text-4xl font-bold mb-8">Databuddy Admin Dashboard</h1>
      <p className="text-lg mb-4">Welcome to the central hub for managing your platform.</p>
      <div className="space-x-4">
        <Link href="/users" className="px-6 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors">
          View Users
        </Link>
        {/* Add links to other main sections as needed */}
      </div>
    </div>
  );
}
