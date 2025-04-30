// Este es un componente del servidor que simplemente renderiza el componente cliente
export default function CreatePasswordPage({ token }: { token: string }) {
    return <CreatePasswordClient token={token} />;
  }
  
  // Importa el componente cliente
  import { CreatePasswordClient } from './password-client.tsx';