import Link from 'next/link';

export default function FooterMiembros() {
  const year = new Date().getFullYear();

  return (
    <footer className="footer-miembros">
      <div className="footer-miembros-inner">
        {/* Brand */}
        <div className="footer-miembros-col">
          <p className="footer-brand" style={{ fontSize: 'var(--text-xl)', color: '#fff', opacity: 0.85 }}>OCGC</p>
          <p>Zona exclusiva para miembros de la Orquesta Comunitaria de Gran Canaria.</p>
          <p>¿Necesitas ayuda? Contacta con tu coordinador de sección.</p>
        </div>

        {/* Secciones */}
        <div className="footer-miembros-col">
          <h4>Secciones</h4>
          <Link href="/miembros/tablon">Tablón de Anuncios</Link>
          <Link href="/miembros/repositorio">Repositorio de Partituras</Link>
          <Link href="/miembros/agenda">Agenda y Ensayos</Link>
        </div>

        {/* Legal */}
        <div className="footer-miembros-col">
          <h4>Legal</h4>
          <a href="#">Aviso Legal</a>
          <a href="#">Política de Privacidad</a>
          <a href="#">Cookies</a>
        </div>

        {/* Contacto */}
        <div className="footer-miembros-col">
          <h4>Sitio Público</h4>
          <Link href="/">Inicio</Link>
          <Link href="/conciertos">Conciertos</Link>
          <Link href="/nosotros">Quiénes somos</Link>
        </div>
      </div>

      <div className="footer-miembros-bottom">
        <p>© {year} OCGC — Zona Privada de Miembros</p>
        <div className="social-links">
          <a href="https://www.instagram.com/orquestacomunitariagc/" target="_blank" rel="noreferrer" aria-label="Instagram">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden="true">
              <rect x="2" y="2" width="20" height="20" rx="5" ry="5"/>
              <circle cx="12" cy="12" r="4"/>
              <circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none"/>
            </svg>
          </a>
          <a href="https://www.tiktok.com/@orquestacomunitariagc" target="_blank" rel="noreferrer" aria-label="TikTok">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1V9.01a6.33 6.33 0 0 0-.79-.05 6.34 6.34 0 0 0-6.34 6.34 6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.33-6.34V8.69a8.18 8.18 0 0 0 4.78 1.52V6.76a4.85 4.85 0 0 1-1.01-.07z"/>
            </svg>
          </a>
        </div>
      </div>
    </footer>
  );
}
