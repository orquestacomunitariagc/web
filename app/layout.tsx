"use client";

import { ClerkProvider } from "@clerk/nextjs";
import { usePathname } from "next/navigation";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import HeaderMiembros from "@/components/HeaderMiembros";
import FooterMiembros from "@/components/FooterMiembros";
import "../css/styles.css";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const isMembersArea = pathname.startsWith("/miembros");

  return (
    <html lang="es">
      <head>
        <title>OCGC — Orquesta Comunitaria de Gran Canaria</title>
        <meta name="description" content="La Orquesta Comunitaria de Gran Canaria: música sinfónica, coro y ensambles con pasión desde Gran Canaria. Únete a nuestra familia musical." />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="theme-color" content="#0D1B2A" />

        {/* Google Fonts — Montserrat Alternates (corporativo) + Inter (cuerpo) */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        {/* <link
          href="https://fonts.googleapis.com/css2?family=Montserrat+Alternates:ital,wght@0,300;0,400;0,500;0,600;0,700;0,800;1,400&family=Inter:wght@400;500;600;700;800&display=swap"
          rel="stylesheet"
        /> */}
        <link
          href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,600;0,700;1,300;1,400&family=Inter:wght@400;500;600;700;800&display=swap"
          rel="stylesheet"
        />

        {/* Open Graph */}
        <meta property="og:title" content="OCGC — Orquesta Comunitaria de Gran Canaria" />
        <meta property="og:description" content="Música para la comunidad. Creando puentes a través del arte desde Gran Canaria." />
        <meta property="og:type" content="website" />
        <meta property="og:locale" content="es_ES" />

        {/* Favicon */}
        <link rel="icon" href="/favicon.ico" />
      </head>
      <body>
        <ClerkProvider>
          {isMembersArea ? <HeaderMiembros /> : <Header />}
          <main id="main-content">
            {children}
          </main>
          {isMembersArea ? <FooterMiembros /> : <Footer />}
        </ClerkProvider>
      </body>
    </html>
  );
}
