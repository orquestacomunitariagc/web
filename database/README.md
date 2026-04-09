# OCGC_DB
## Base de datos construida en servidor local PostgreSQL

- Preparación del entorno virtual:
    1. python -m venv venv
    2. .\venv\Scripts\activate
    3. pip install -r requirements.txt
 
- Crear archivo config.cfg completando el siguiente código
    ~~~
    '' # host
    '' # port
    '' # databse
    '' # user
    '' # password
    ~~~
    
- Creación de la base de datos PostgreSQL
    1. Ejecutar database_tables.sql en el servidor de base de datos
    2. Crear archivo sheet.cfg con el identificador de la hoja de excel en la que se encuentran los datos.
    3. Ejecución para importar los datos a las tablas.
       ~~~
       python migration.py
       ~~~

- Ejecutar aplicación principal de la base de datos:
  ~~~
  python main.py
  ~~~

- Visualización de la plantilla web con nombres:
  ~~~
  python web.py
  ~~~
 
