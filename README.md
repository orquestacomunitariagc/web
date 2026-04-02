# Portal de Miembros OCGC - Documentación del Proyecto

Este documento describe la arquitectura, funcionalidades y flujos de trabajo del portal digital de la **Orquesta Comunitaria de Gran Canaria (OCGC)**. El sistema está diseñado para gestionar el archivo de partituras, el registro de músicos y el control de acceso basado en roles dinámicos.

---

## 1. Arquitectura Técnica

- **Framework**: [Next.js](https://nextjs.org/) (App Router).
- **Autenticación**: [Clerk](https://clerk.com/) (Gestión de usuarios y metadatos de roles).
- **Base de Datos**: PostgreSQL alojado en [Neon](https://neon.tech/) con ORM [Prisma](https://www.prisma.io/).
- **Almacenamiento de Archivos**: [Vercel Blob](https://vercel.com/docs/storage/vercel-blob) para PDFs de partituras.
- **Estilos**: Vanilla CSS y Styled JSX.

---

## 2. Modelos de Datos (Prisma)

### Partituras y Repertorios
- **Score**: Almacena la URL del archivo (Vercel Blob), el título y la lógica de acceso (`allowedRoles` como `String[]`).
- **Category**: Agrupa las partituras por programas o conciertos (ej: "Sinfonía 9", "Concierto de Navidad").

### Estructura de Diccionario Dinámico
- **Seccion**: Almacena los instrumentos/roles (ej: "Violín primero", "Clarinete"). Ahora incluye el campo `familia` (Cuerda, Viento, etc.) para su organización visual en el panel.
- **SystemConfig**: Almacena configuraciones globales del sistema en formato JSON.

### Datos de Usuarios
- **User**: Perfil personal del músico (DNI, Residencia, Empleo). Sincronizado con Clerk mediante `clerkUserId`.
- **Estructura**: Tabla de relación que asocia a un usuario con una agrupación (Orquesta, Coro) y un instrumento específico.
- **InvitationCode**: Tokens criptográficos de un solo uso para invitar a nuevos músicos.

---

## 3. Funcionalidades Principales

### A. Registro de Músicos (Onboarding Seguro)
- **Ruta**: `/registro-usuarios` (Bloqueada por Token).
- **Sistema de Invitaciones**: El registro ya no es accesible mediante una URL estática. Ahora requiere un **Token de Invitación Nominativo** generado por un Administrador.
- **Seguridad Criptográfica**: Cada token tiene **128 bits de entropía** (32 caracteres hexadecimales aleatorios), lo que hace imposible el acceso por fuerza bruta o predicción.
- **Trazabilidad**: Las invitaciones son nominativas. Al generarlas, el Admin asigna un "Nombre - Sección", permitiendo saber exactamente quién ha recibido el código y quién falta por registrarse.
- **Caducidad y Un solo Uso**: Los tokens caducan automáticamente a los **7 días** y se desactivan permanentemente tras el primer uso exitoso.
- **Automatización**: Al registrarse, el sistema asigna automáticamente etiquetas de "Tutti" (ej: `Orquesta - Tutti`) según la agrupación seleccionada, garantizando que el nuevo miembro vea el material general de su grupo desde el primer acceso.

### B. Gestión de Archivo (Admin/Master)
- **Ruta**: `/miembros/gestion`.
- **Partituras**: Subida de archivos con renombrado automático descriptivo (`Obra_Secciones.pdf`). Incluye previsualización del nombre en tiempo real.
- **Instrumentos (Diccionario)**: Panel para añadir o eliminar instrumentos y organizarlos por familias. Es la fuente de verdad para toda la web.
- **Personal**: Los administradores "Master" pueden asignar permisos de **Archivero** (gestión de archivos) o **Master** (control total), además de banear usuarios o editar sus etiquetas de acceso.
- **Invitaciones**: Generador de tokens 128-bit nominativos para nuevos integrantes.

### C. Repositorio Digital (Músico)
- **Ruta**: `/miembros/repositorio`.
- **Filtrado Inteligente**: El músico solo ve las partituras que coinciden con sus etiquetas (ej: si toca el Oboe, verá las partituras de "Oboe" y de "Orquesta - Tutti").
- **Categorización**: Las obras se organizan visualmente por programas/conciertos en una barra lateral.
- **Documentos**: Sección especial para reglamentos, estatutos o actas accesibles para todos los miembros.

### D. Tablón de Anuncios
- **Ruta**: `/miembros/tablon`.
- **Novedades**: Muestra un saludo personalizado y una lista rápida de las últimas 5 partituras añadidas que sean relevantes para la sección del músico.

---

## 4. Sistema de Control de Acceso (Tags)

El acceso no es jerárquico, sino por **intersección de etiquetas**:

1. **Usuario**: Tiene una lista de roles en su perfil de Clerk (ej: `["Violonchelo", "Orquesta - Tutti"]`).
2. **Partitura**: Tiene una lista de roles permitidos (ej: `["Violonchelo"]`).
3. **Lógica**: Si hay al menos una coincidencia, el PDF es visible y descargable.
4. **Excepciones**:
   - **Master/Archivero**: Ven absolutamente todo el catálogo.
   - **Dirección Musical**: Los usuarios con roles que comienzan por "Dirección" heredan automáticamente acceso a todo el material etiquetado como `Tutti` de su agrupación correspondiente (ej: Dirección de Coro ve todo lo de `Coro - Tutti`).
   - **Documentos Generales**: Si el archivo está marcado como `isDocument`, es visible para cualquier usuario logueado.

### E. Blindaje de Acceso (Invitaciones)
Para prevenir registros no autorizados, el portal implementa un "Paso 0" de validación:
1. **Generación**: Un Admin Master genera un token criptográfico asociado a un nombre y sección (ej: "Marta Gil - Clarinete").
2. **Validación**: El servidor comprueba que el token existe en la DB, no ha sido usado y no ha expirado (ventana de 7 días).
3. **Consumo**: Al finalizar el registro, el token se marca como `usedAt` en la base de datos, quedando invalidado permanentemente.

---

## 5. Mantenimiento y Despliegue

### Variables de Entorno (Vercel)
- `DATABASE_URL`: Conexión a Neon.
- `CLERK_SECRET_KEY` / `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`: Credenciales de Clerk.
- `BLOB_READ_WRITE_TOKEN`: Permiso para subir archivos a Vercel Blob.
- `NEXT_PUBLIC_CLERK_SIGN_IN_URL`: `/sign-in`
- `NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL`: `/miembros/tablon`

### Comandos Útiles
- `npx prisma db push`: Sincroniza cambios en el esquema sin migraciones pesadas.
- `npx prisma generate`: Regenera el cliente para reconocer nuevos campos (como `forWhom` o `familia`).

---

*Documentación generada para el equipo técnico de la Orquesta Comunitaria de Gran Canaria.*
