from tkinter import messagebox
from fpdf import XPos, YPos
import psycopg2
from aux_functions import local, resource_path
from pdf import PDF


def listado(agrupaciones, secciones, papeles, datos, orden, separar, activos, union, numerar, separar_cabeza, ancho_columnas, cabecera, archivo):
    params = local()
    connection = psycopg2.connect(host=params[0], port=params[1], database=params[2], user=params[3], password=params[4])
    cursor = connection.cursor()
    cursor.execute("SELECT papel FROM papeles ORDER BY papel;")
    todos_papeles = [item[0] for item in cursor.fetchall()]
    cursor.execute("SELECT agrupacion FROM agrupaciones ORDER BY agrupacion;")
    todos_agrupaciones = [item[0] for item in cursor.fetchall()]
    cursor.execute("SELECT seccion FROM secciones ORDER BY seccion;")
    todos_secciones = [item[0] for item in cursor.fetchall()]
    
    if agrupaciones == []:
        agrupaciones = todos_agrupaciones
    if secciones == []:
        secciones = todos_secciones
    if papeles == []:
        papeles = todos_papeles
    papeles_order = ["Músico", "Invitado", "Colaborador", "Empresa Externa"]

    agrupaciones_order = ["Orquesta", "Coro", "Ensemble Flautas", "Ensemble Metales", "Ensemble Chelos", "Colaboradores", "Empresa Externa", "Público"]

        #secciones que se encuentran en la base de datos
    secciones_order = [
            "Dirección artística y musical (OCGC y Orquesta)",
            "Dirección musical (Ensemble Flautas)",
            "Dirección musical (Ensemble Metales)",
            "Dirección musical (Ensemble Violonchelos)",
            "Dirección musical (Coro)",
            "Violín primero", "Violín segundo", "Viola", "Violonchelo", "Contrabajo",
            "Flauta", "Oboe", "Clarinete", "Requinto", "Fagot", "Contrafagot", "Saxofón",
            "Trompeta", "Trompa", "Trombón", "Tuba", "Bombardino",
            "Arpa", "Piano", "Órgano", "Percusión",
            "Solista", 
            "Alto (coro)", "Soprano (coro)", "Bajo (coro)", "Tenor (coro)",  "Coach vocal",
            "Colaboradores", "Transportes", "Rider Service", "Brea Producciones", "Productora Pedro Ruiz", "Técnico Sonido", "Invitados"
        ]
    agrupaciones = sorted(agrupaciones, key=lambda x: agrupaciones_order.index(x) if x in agrupaciones_order else len(agrupaciones_order))
    secciones = sorted(secciones, key=lambda x: secciones_order.index(x) if x in secciones_order else len(secciones_order))
    papeles = sorted(papeles, key=lambda x: papeles_order.index(x) if x in papeles_order else len(papeles_order))
    # Tratado de los parámetros recibidos
    if activos == "Solo activos":
        activos = ["true"]
    elif activos == "Solo inactivos":
        activos = ["false"]
    else:
        activos = ["true", "false"]
    if separar_cabeza:
        datos.append("atril")
    orden_query = f'ORDER BY {orden};'
    # Inicialización del PDF
    pdf = PDF(cabecera)
    pdf.set_auto_page_break(auto=True, margin=15)
    pdf.add_page()
    pdf.set_fill_color(194, 194, 194)
    pdf.ln(1)
    pdf.set_y(30)
    if separar == "Agrupaciones":  # En caso de seleccionar separación por agrupación
        for agrup in agrupaciones:
            # Construcción de la query para cada agrupación
            query = "SELECT " + ", ".join(datos) + " FROM all_data WHERE activo IN ('True')"
            query += " AND papel IN ('" + "', '".join(papeles) + "')"
            query += " AND seccion IN ('" + "', '".join(secciones) + "')"
            query += " AND agrupacion = %s "
            query += " AND isla NOT IN ('Gran Canaria')"
            query += orden_query
            # Creación de la tabla
            tabla = obtener_tabla_para_pdf(query, datos, numerar, union, (agrup,))
            print(tabla)
            if tabla is None:
                continue
            else:
                # Si la tabla no está vacía, se añade al PDF
                pdf.set_font("Helvetica", "B", 15)
                agrup_w = pdf.get_string_width(agrup) + 6
                if pdf.get_y() + 22 > pdf.page_break_trigger:
                    pdf.add_page()
                pdf.cell(agrup_w, 8, agrup, new_x=XPos.LMARGIN, new_y=YPos.NEXT)
                insertar_tabla(tabla, pdf, ancho_columnas)
    else:
        # Construcción de la query para todas las secciones seleccionadas
        query = f"SELECT " + ", ".join(datos) + " FROM all_data WHERE activo IN ('" + "', '".join(activos) + "')"
        query += " AND agrupacion IN ('" + "', '".join(agrupaciones) + "')"
        query += " AND seccion IN ('" + "', '".join(secciones) + "')"
        query += " AND papel IN ('" + "', '".join(papeles) + "')"
        query += f'ORDER BY {orden};'
        # Creación de la tabla
        tabla = obtener_tabla_para_pdf(query, datos, numerar, union, tuple(secciones))            
        if tabla is not None:
            # Si la tabla no está vacía, se añade al PDF
            insertar_tabla(tabla, pdf, ancho_columnas)
    # Guardar el PDF
    output_path = resource_path(f"pdfs\{archivo}.pdf")
    pdf.output(output_path)
    messagebox.showinfo("PDF creado", f"Archivo creado en {output_path}")

def obtener_tabla_para_pdf(query, datos, numerar, union, secciones=None, separar_cabeza=False):
    params = local()
    connection = psycopg2.connect(host=params[0], port=params[1], database=params[2], user=params[3], password=params[4])
    cursor = connection.cursor()
    try:
        if secciones:
            cursor.execute(query, secciones)  # para muchas secciones
        else:
            cursor.execute(query)  # para una única sección
        rows = cursor.fetchall()
    except psycopg2.Error as e:
        print(f"Error executing query: {e}")
        return None
    # en caso de que no se encuentren resultados
    if len(rows) == 0:
        return None
    # llamada a la creación de la tabla con las columnas deseadas y los datos obtenidos en la consulta
    tabla = crear_tabla(datos, rows, numerar, union)
    if separar_cabeza:
        aux_tabla = [tabla[0][:-1]]
        for item in tabla[1:]:
            if item[-1] == 1:
                aux_tabla.insert(1, item[:-1])
            else:
                aux_tabla.append(item[:-1])
        tabla = aux_tabla
    return tabla

def crear_tabla(columns, rows, numerar, union):
    all_data_columns_dictionary = {
            "user_id": "ID",
            "surname": "Apellidos",
            "dni": "DNI",
            "email": "Email",
            "name": "Nombre",
            "papel": "Papel",
            "agrupacion": "Agrupación",
            "seccion": "Sección",
            "isla": "Isla",
            "activo": "Activo",
            "programa_anterior": "Programa anterior",
        }
    datos = [all_data_columns_dictionary[item].upper() for item in columns]
    cabeceras = ["Nº", *datos]
    j = 1
    tabla = [cabeceras]
    for row in rows:
        tabla.append([j, *row])
        j += 1
    if not numerar:
        tabla = [fila[1:] for fila in tabla]
    if union == "Apellidos,Nombre":
        tabla = unir_apellidos_nombre(numerar, tabla)
    elif union == "Nombre,Apellidos":
        tabla = unir_nombre_apellidos(numerar, tabla)
    return tabla

def unir_nombre_apellidos(numerar, tabla = None):
    if tabla is None:
        return None
    if numerar:
        for fila in tabla:
            fila[1:3] = [" ".join(fila[2:0:-1])]
    elif not numerar:
        for fila in tabla:
            fila[0:2] = [", ".join(fila[1::-1])] # sin numeración
    return tabla

def unir_apellidos_nombre(numerar, tabla = None):
    if tabla is None:
        return None
    if numerar:
        for fila in tabla:
            fila[1:3] = [", ".join(fila[1:3])]
    elif not numerar:
        for fila in tabla:
            fila[0:2] = [", ".join(fila[0:2])] # sin numeración
    return tabla

def insertar_tabla(tabla, pdf, anchos):
    
    longitudes = [int(item) for item in anchos.split(", ")]
    pdf.set_font("Helvetica", "", 12)
    elemento(tabla[0], pdf, longitudes, altura=9, fill=True)
    for miembro in tabla[1:]:
        elemento(miembro, pdf, longitudes)
    pdf.ln()
    pdf.set_text_color(0, 0, 0)
    return

def elemento(miembro, pdf, longitudes, altura=7, fill=None):
    for i, dato in enumerate(miembro):
        pdf.set_font('DejaVu', '', 12)
        new_x = XPos.RIGHT
        new_y = YPos.TOP
        if dato == miembro[-1]:
            new_x = XPos.LMARGIN
            new_y = YPos.NEXT
        if miembro[i] == None:
            pdf.cell(longitudes[i], altura, "".format(), border=True, new_x=new_x, new_y=new_y, fill=fill)
        else:
            pdf.cell(longitudes[i], altura, "{}".format(miembro[i]), border=True, new_x=new_x, new_y=new_y, fill=fill)
    return

if __name__ == "__main__":
    listado([], [], [], ["surname", "name", "seccion", "isla"],
            "seccion", "Agrupaciones", "", "Apellidos,Nombre", False, False, "80, 30, 80", 
            "Miembros que vienen de otras islas\n\n\n", "otras_islas")