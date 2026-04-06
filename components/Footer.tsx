import Link from 'next/link';

export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer>
      <div className="footer-top">
        {/* Brand col */}
        <div className="footer-col">
          <p className="footer-brand">OCGC</p>
          <p className="footer-tagline">Orquesta Comunitaria de Gran Canaria</p>
          <p style={{ fontSize: 'var(--text-sm)', marginTop: 'var(--sp-4)', lineHeight: 1.65 }}>
            Música para la comunidad.<br />Creando puentes a través del arte.
          </p>
        </div>

        {/* Sponsors */}
        <div className="footer-col">
          <h4>Entidades Patrocinadoras</h4>
          <div className="sponsor-grid">
            <img src="/assets/images/sponsors/caja_siete.png" alt="Fundación CajaSiete" />
            <img src="/assets/images/sponsors/cabildo.png" alt="Cabildo de Gran Canaria" />
            <img src="/assets/images/sponsors/gob_canarias.png" alt="Gobierno de Canarias" />
            <img src="/assets/images/sponsors/philip.png" alt="Philip Morris Spain" />
            <img src="/assets/images/sponsors/disa.png" alt="Fundación DISA" />
          </div>
        </div>

        {/* Collabs */}
        <div className="footer-col">
          <h4>Con la colaboración de</h4>
          <div className="collabs-grid">
            <img src="/assets/images/collabs/telde.png" alt="Telde Cultura" />
            <img src="/assets/images/collabs/binter.png" alt="Binter" />
            <img src="/assets/images/collabs/sta_catalina.png" alt="Santa Catalina" />
            <img src="/assets/images/collabs/corte_ingles.png" alt="El Corte Inglés" />
            <img src="/assets/images/collabs/gabinete.png" alt="Gabinete Literario" />
            <img src="/assets/images/collabs/emem.png" alt="EMEM" />
            <img src="/assets/images/collabs/jaime_balmes.png" alt="Colegio Jaime Balmes" />
          </div>
        </div>

        {/* Legal */}
        <div className="footer-col">
          <h4>Legal</h4>
          <a href="#">Aviso Legal</a>
          <a href="#">Política de privacidad</a>
          <a href="#">Política de cookies</a>
          <h4 style={{ marginTop: 'var(--sp-6)' }}>Contacto</h4>
          <a href="mailto:contacto@ocgc.es">contacto@ocgc.es</a>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="footer-bottom">
        <p>© {year} Orquesta Comunitaria Gran Canaria. Todos los derechos reservados.</p>

        <div className="social-links">
          {/* Secret member access */}
          <Link href="/miembros" title="Acceso a Miembros" style={{ display: 'inline-flex', alignItems: 'center' }}>
            <img src="/assets/images/violin.png" alt="Acceso Miembros" style={{ height: '18px', filter: 'brightness(0) invert(1)', opacity: 0.4 }} />
          </Link>

          {/* Instagram */}
          <a href="https://www.instagram.com/orquestacomunitariagc/" target="_blank" rel="noreferrer" aria-label="Instagram">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden="true">
              <rect x="2" y="2" width="20" height="20" rx="5" ry="5"/>
              <circle cx="12" cy="12" r="4"/>
              <circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none"/>
            </svg>
          </a>

          {/* TikTok */}
          <a href="https://www.tiktok.com/@orquestacomunitariagc" target="_blank" rel="noreferrer" aria-label="TikTok">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1V9.01a6.33 6.33 0 0 0-.79-.05 6.34 6.34 0 0 0-6.34 6.34 6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.33-6.34V8.69a8.18 8.18 0 0 0 4.78 1.52V6.76a4.85 4.85 0 0 1-1.01-.07z"/>
            </svg>
          </a>

          {/* Facebook */}
          <a href="#" aria-label="Facebook">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/>
            </svg>
          </a>

          {/* YouTube */}
          <a href="#" aria-label="YouTube">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              <path d="M22.54 6.42a2.78 2.78 0 0 0-1.95-1.96C18.88 4 12 4 12 4s-6.88 0-8.59.46A2.78 2.78 0 0 0 1.46 6.42 29 29 0 0 0 1 12a29 29 0 0 0 .46 5.58 2.78 2.78 0 0 0 1.95 1.96C5.12 20 12 20 12 20s6.88 0 8.59-.46a2.78 2.78 0 0 0 1.95-1.96A29 29 0 0 0 23 12a29 29 0 0 0-.46-5.58z"/>
              <polygon fill="white" points="9.75 15.02 15.5 12 9.75 8.98 9.75 15.02"/>
            </svg>
          </a>
        </div>
      </div>
    </footer>
  );
}
