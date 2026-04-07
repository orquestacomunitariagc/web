import { auth, currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { UserButton } from "@clerk/nextjs";

export default async function MiembrosPage() {
  const { userId } = await auth();
  
  if (!userId) {
    redirect("/sign-in");
  }

  const user = await currentUser();
  const userRoles = (user?.publicMetadata?.roles as string[]) || [];
  const isMaster = user?.publicMetadata?.isMaster as boolean;

  return (
    <div style={{ padding: "2rem" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "2rem" }}>
        <h1 style={{ fontFamily: 'var(--font-display)', color: 'var(--clr-navy)' }}>Panel de Miembros OCGC</h1>
        <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
          <span>Hola, {user?.firstName}</span>
          <UserButton />
        </div>
      </div>

      <section className="card" style={{ padding: 'var(--sp-8)' }}>
        <h2 style={{ fontFamily: 'var(--font-display)', marginBottom: 'var(--sp-4)' }}>Mis Permisos Actuales</h2>
        <ul style={{ listStyle: 'none', padding: 0 }}>
          {userRoles.length > 0 ? (
            userRoles.map(role => (
              <li key={role} style={{ marginBottom: 'var(--sp-2)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--clr-success)" strokeWidth="2.5">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
                Asignado a: <strong>{role}</strong>
              </li>
            ))
          ) : (
            <li>No tienes secciones asignadas. Eres público.</li>
          )}
          {isMaster && (
            <li style={{ marginTop: 'var(--sp-4)', color: 'var(--clr-gold)', fontWeight: 700 }}>
              👑 Eres Master (Director/Admin)
            </li>
          )}
        </ul>
      </section>

      <section 
        className="card" 
        style={{ 
          marginTop: "3rem", 
          padding: 'var(--sp-8)', 
          background: 'var(--clr-navy-lt)', 
          border: 'none' 
        }}
      >
        <h2 style={{ fontFamily: 'var(--font-display)', color: 'var(--clr-navy)' }}>Siguiente paso</h2>
        <p>Aquí conectaríamos con la base de datos Neon (Drizzle) para buscar en la tabla <code>scores</code> las partituras donde <code>allowedRoles</code> coincida con tus roles actuales.</p>
      </section>
    </div>
  );
}
