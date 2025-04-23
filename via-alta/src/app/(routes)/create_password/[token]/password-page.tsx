// This is a server component that simply renders the client component
export default function CreatePasswordPage({ token }: { token: string }) {
    return <CreatePasswordClient token={token} />;
  }
  
  // Import client component
  import { CreatePasswordClient } from './password-client.tsx';