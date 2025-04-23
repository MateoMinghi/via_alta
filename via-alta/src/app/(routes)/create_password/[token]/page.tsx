// Next.js page component with async params
// In your specific Next.js setup, params needs to be a Promise

// Use generateMetadata for metadata
export async function generateMetadata() {
  return {
    title: 'Create Password'
  };
}

// Define the props type for the Page component
interface PageProps {
  params: Promise<{
    token: string;
  }>;
}

// Simple page component that treats params as a Promise
export default async function Page(props: PageProps) {
  // We'll need to await the params since it's a Promise in your setup
  const params = await props.params;
  const token = params.token;
  
  return <CreatePasswordPage token={token} />;
}

// Import a regular component (not client component)
import CreatePasswordPage from './password-page';