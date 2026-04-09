import csv
from tkinter import messagebox
from tkinter.filedialog import askopenfilename
import psycopg2
import numpy as np
import pandas as pd

from models import User

def users_programas(user_dict, cursor, connection):
    programas = ["Play", "Novena Isla", "Nexo", "Play 2", "Zarzuela", "Tr3s", "Un Concierto de Cine", "B"]
    for item in programas:
        if user_dict.get(item):
            try:
                cursor.execute("SELECT user_id FROM users WHERE dni = %s;", (user_dict["DNI"].strip(),))
                user_id = cursor.fetchone()[0]
                cursor.execute("SELECT programa_id FROM programas WHERE nombre = %s;", (item,))
                programa_id = cursor.fetchone()[0]
                cursor.execute("INSERT INTO users_programas (user_id, programa_id) VALUES (%s, %s) ON CONFLICT (user_id, programa_id) DO NOTHING;", (user_id, programa_id))
                connection.commit()
            except psycopg2.Error as e:
                connection.rollback()
                print(f"Error inserting into users_programas: {e}")

def guardar_plantilla_programa(cursor, connection):
    programas = ("B", "B (Coro)", "Estreno metales")
    for programa in programas:
        cursor.execute("select agrupacion from programas where nombre = %s;", (programa,))
        agrupaciones = cursor.fetchone()[0].split(", ")
        cursor.execute("select agrupacion_id from agrupaciones where agrupacion in ('" + "', '".join(agrupaciones) + "')")
        agrupacion_id = cursor.fetchall()[0]
        cursor.execute("SELECT estructura_id from estructura where activo = 'true' and agrupacion_id = %s;", (agrupacion_id[0],))
        estructura_id = cursor.fetchall()
        cursor.execute("SELECT programa_id from programas where nombre = %s;", (programa,))
        programa_id = cursor.fetchall()[0]
        for estructura in estructura_id:
            cursor.execute("INSERT INTO estructura_programas (estructura_id, programa_id) VALUES (%s, %s) ON CONFLICT (estructura_id, programa_id) DO NOTHING;", 
                            (estructura[0], programa_id[0]))
            connection.commit()
    return

def add_users_from_excel(app=None):
    with open("config/new_sheet.cfg", "r") as sheet:
        sheet_id = sheet.readline().strip()
    df = pd.read_excel(f"https://docs.google.com/spreadsheets/d/{sheet_id}/export?format=xlsx", sheet_name="Registros completos")
    df = df.replace(np.nan, None)
    total_rows = len(df)
    step = 100 / total_rows if total_rows > 0 else 1
    for i in range(1, total_rows + 1):
        if getattr(app, 'cancel_flag', False):
            break
        user_dict = df.loc[i - 1].to_dict()
        try:
            user = User(
                name=dels_to_minus(user_dict["Nombre"].strip().title()),
                surname=dels_to_minus(user_dict["Apellidos"].strip().title()),
                dni=user_dict["DNI"].strip().upper(),
                email = user_dict["Dirección de correo electrónico"].strip(),
                phone = str(user_dict["Número de teléfono"]).strip().replace(" ", ""),
                birth_date = format_fecha(user_dict["Indique su fecha de nacimiento"]),
                papel=user_dict["papel"],
                agrupacion=user_dict["Indique su agrupación en la OCGC:"],
                seccion=user_dict["Indique su instrumento/voz:"],
                atril = int(user_dict["Atril"]) if pd.notna(user_dict["Atril"]) else None,
                activo=user_dict["Cuentos"],
                isla = user_dict["Isla de residencia"].strip().title(),
                municipio = user_dict["Indique el municipio en el que reside. "].strip().title(),
                empadronamiento = user_dict["Municipio de empadronamiento"].strip().title(),
                trabajo = user_dict["Trabajo"].strip(),
                estudios = user_dict["Estudios"].strip(),
                matricula_number=user_dict["Matrícula"]
            )
            app.supabase.table("all_data").insert(user.__dict__).execute()
            step_percent = step * i
            app.update_progress(i, step_percent, total_rows)
        except Exception as e:
            print("Error en la fila", i - 1, e)

def format_fecha(fecha):
    # Nueva lógica para convertir la fecha
    if fecha is None or fecha == "":
        fecha_str = None
    elif isinstance(fecha, pd.Timestamp):
        fecha_str = fecha.strftime("%Y-%m-%d")  # o el formato que necesites
    else:
        # Si es string, intenta convertirlo al formato deseado
        try:
            fecha_str = pd.to_datetime(fecha).strftime("%Y-%m-%d")
        except Exception:
            fecha_str = None
    return fecha_str

def dels_to_minus(dato):
    dato = dato.title()
    if dato.startswith("De "):
        dato = "d" + dato[1:]
    elif dato.startswith("Del "):
        dato = "d" + dato[1:]
    elif " De L" in dato:
        indice = dato.index(" De ")
        dato = dato[:indice] + " de l" + dato[indice + 5:]
    elif " De " in dato:
        indice = dato.index(" De ")
        dato = dato[:indice] + " de " + dato[indice + 4:]
    elif " Del " in dato:
        indice = dato.index(" Del ")
        dato = dato[:indice] + " del " + dato[indice + 5:]
    return dato

def read_excel(app):
    app.progress_bar(add_users_from_excel)
    return

def read_csv(app):
    filename = askopenfilename(filetypes=[("Archivos csv", "*.csv")])
    if filename:
        def process_csv(app):
            with open(filename, 'r', encoding='utf-8') as file:
                reader = csv.reader(file, delimiter=',')
                next(reader)
                datos = list(reader)
                total_rows = len(datos)
                step = 100 / total_rows if total_rows > 0 else 1
                data_string = "Registros encontrados:\n"
                for i, item in enumerate(datos):
                    data_string += f"\n{i + 1}. " + ",".join(item) + "\n"
                # Show confirmation dialog in main thread
                confirmed = [False]
                def ask():
                    confirmed[0] = messagebox.askokcancel("Datos", data_string)
                app.progress_window.after(0, ask)
                while not confirmed[0] and app.progress_window.winfo_exists():
                    app.progress_window.update()
                if confirmed[0]:
                    for i, item in enumerate(datos):
                        if getattr(app, 'cancel_flag', False):
                            break
                        user = User(
                            name=dels_to_minus(item[0].strip().title()),
                            surname=dels_to_minus(item[1].strip().title()),
                            dni=item[2].strip().upper(),
                            papel=item[3].strip(),
                            agrupacion=item[4].strip(),
                            seccion=item[5].strip(),
                            activo=item[6].strip(),
                            matricula_number=item[7].strip()
                        )
                        app.supabase.table("all_data").insert(user.__dict__).execute()
                        print(f"{user.name} {user.surname} agregado con éxito")
                        step_percent = step * (i + 1)
                        app.progress_window.after(0, app.update_progress, i + 1, step_percent, total_rows)
            app.progress_window.after(0, app.main_window)

        # Start the progress bar and thread
        app.progress_bar(process_csv)

def drop_all_tables(app):
    connection = app.connection
    cursor = app.cursor
    try:
        cursor.execute("SET session_replication_role = 'replica';")
        cursor.execute("""
            SELECT tablename FROM pg_tables
            WHERE schemaname = 'public';
        """)
        tables = cursor.fetchall()
        for table in tables:
            table_name = table[0]
            cursor.execute(f'TRUNCATE TABLE "{table_name}" RESTART IDENTITY CASCADE;')
            print(f"Cleared table: {table_name}")
        cursor.execute("SET session_replication_role = 'origin';")
        connection.commit()
        print("All table data deleted successfully.")
        app.main_window()
    except Exception as e:
        connection.rollback()
        print(f"Error deleting table data: {e}")


if __name__ == "__main__":
    pass
    ## funciones a llamar durante la creación de la base de datos
    #params = local()
    #connection = psycopg2.connect(host=params[0], port=params[1], database=params[2], user=params[3], password=params[4])
    #cursor = connection.cursor()
    #add_users_from_excel(cursor, connection)
    #cursor.close()
    #connection.close()
    #guardar_plantilla_programa(cursor, connection)
