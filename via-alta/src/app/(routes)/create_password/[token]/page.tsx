// Componente de página de Next.js con parámetros asíncronos
// En tu configuración específica de Next.js, params necesita ser una Promesa

// Usa generateMetadata para los metadatos
export async function generateMetadata() {
  return {
    title: 'Crear Contraseña'
  };
}

// Define el tipo de props para el componente Page
interface PageProps {
  params: Promise<{
    token: string;
  }>;
}

// Componente de página simple que trata params como una Promesa
export default async function Page(props: PageProps) {
  // Necesitamos usar await en params ya que es una Promesa en tu configuración
  const params = await props.params;
  const token = params.token;
  
  return <CreatePasswordPage token={token} />;
}

// Importa un componente regular (no un componente cliente)
import CreatePasswordPage from './password-page';