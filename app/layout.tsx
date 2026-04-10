import { ClerkProvider } from "@clerk/nextjs";
import { Metadata, Viewport } from "next";
import ClientLayout from "@/components/ClientLayout";
import { NotificationProvider } from "@/components/ui/NotificationContext";
import "../css/styles.css";

export const metadata: Metadata = {
  title: "OCGC — Orquesta Comunitaria de Gran Canaria",
  description: "La Orquesta Comunitaria de Gran Canaria: música sinfónica, coro y ensambles con pasión desde Gran Canaria. Únete a nuestra familia musical.",
  openGraph: {
    title: "OCGC — Orquesta Comunitaria de Gran Canaria",
    description: "Música para la comunidad. Creando puentes a través del arte desde Gran Canaria.",
    type: "website",
    locale: "es_ES",
  },
  icons: {
    icon: "/favicon.ico",
  }
};

export const viewport: Viewport = {
  themeColor: "#0D1B2A",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ClerkProvider>
      <html lang="es">
        <head>
          {/* Google Fonts — Montserrat Alternates (corporativo) + Inter (cuerpo) */}
          <link rel="preconnect" href="https://fonts.googleapis.com" />
          <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
          <link
            href="https://fonts.googleapis.com/css2?family=Montserrat+Alternates:ital,wght@0,300;0,400;0,500;0,600;0,700;0,800;1,400&family=Inter:wght@400;500;600;700;800&display=swap"
            rel="stylesheet"
          />
        </head>
        <body>
          <NotificationProvider>
            <ClientLayout>
              <main id="main-content">
                {children}
              </main>
            </ClientLayout>
          </NotificationProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}
