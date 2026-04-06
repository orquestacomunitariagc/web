# 📥 Guía Paso a Paso: Importación Masiva de Partituras

Esta guía explica cómo utilizar el sistema de carga batch para subir decenas de partituras desde tu equipo local al servidor en un solo proceso.

---

## Paso 1: Preparación de tus Archivos PDF
Asegúrate de que todos los archivos `.pdf` que quieres subir estén en la misma carpeta en tu ordenador.
*   **Recomendación:** Los nombres de archivo no deben tener caracteres raros (tildes, eñes) para evitar errores. Ejemplo: `Sinfonia9_Oboe.pdf`.

## Paso 2: Creación del Archivo de Datos (CSV)
Debes crear un archivo Excel y guardarlo como **CSV (delimitado por comas)**. El archivo debe tener exactamente estos encabezados en la primera fila:

| titulo | programa_id | archivo_pdf | instrumentos | es_documento |
| :--- | :--- | :--- | :--- | :--- |
| Sinfonía No. 9 - I | 12 | `S9_Oboe.pdf` | Oboe | false |
| Sinfonía No. 9 - I | 12 | `S9_Viola.pdf` | Viola | false |
| Normas de Sala 2024 | | `Normas.pdf` | | true |

*   **`programa_id`**: Es el número que aparece junto al nombre del programa en la pestaña "Programas". Si es un documento general, dejar vacío.
*   **`archivo_pdf`**: El nombre EXACTO del archivo en tu PC (incluyendo el `.pdf`).
*   **`instrumentos`**: Los nombres de los instrumentos tal como aparecen en el panel (ej: `Violín primero, Viola`). Separados por comas si hay varios.

## Paso 3: Proceso de Carga en el Panel
Ve a `/miembros/gestion` -> Pestaña **Partituras** y baja hasta el cuadro azul de **"Importación Masiva"**.

1.  **Seleccionar Datos:** Haz clic en el primer botón y selecciona tu archivo `.csv`. El sistema te dirá cuántas filas ha detectado.
2.  **Seleccionar PDFs:** Haz clic en el segundo botón. En la ventana que se abre, selecciona TODOS los archivos PDF de tu carpeta (puedes usar `Ctrl + A` para elegirlos todos de golpe).
3.  **Verificación:** El cuadro azul se actualizará mostrando el recuento de filas vs recuento de archivos.

## Paso 4: Ejecución
Haz clic en el botón azul **"🚀 Iniciar Carga Masiva"**.

*   El sistema procesará las filas una a una.
*   Buscará el nombre indicado en `archivo_pdf` entre los documentos que has seleccionado.
*   Lo subirá a la nube (Vercel Blob) y creará el registro en la base de datos automáticamente.
*   Al terminar, verás un resumen con el número total de éxitos.

---

> [!IMPORTANT]
> Si el sistema detecta que un nombre de archivo en el CSV no está incluido en la selección de PDFs, saltará a la siguiente fila y te avisará al final. Asegúrate de que los nombres coinciden letra por letra.
