"use client";

import '@/css/miembros.css';

export default function MiembrosLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="members-content-wrapper">
      <main className="members-main-body">
        <div className="container-white-ocgc">
           {children}
        </div>
      </main>

      <style jsx global>{`
        body { background-color: #f7f7f7 !important; min-height: 100vh; padding-top: 0 !important; }
        .members-main-body { padding: 3rem 0 6rem; width: 100%; box-sizing: border-box; }
        .container-white-ocgc { width: 90%; max-width: 1240px; margin: 0 auto; background: white; padding: 4rem; border-radius: 20px; box-shadow: 0 4px 40px rgba(0,0,0,0.03); min-height: 60vh; }
      `}</style>
    </div>
  );
}
