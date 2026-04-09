import os
from tkinter import Entry, messagebox
from dotenv import load_dotenv
from supabase import create_client

from orders import all_data_columns_dictionary_inv

def on_write(event, column, app):
    columnas = [all_data_columns_dictionary_inv[app.col_datos.get(i)] for i in app.col_datos.curselection()]
    texto = event.widget.get()
    query = app.supabase.table("all_data").select(",".join(columnas))
    query = query.ilike(column, f"%{texto}%")
    response = query.execute()
    rows = response.data if hasattr(response, "data") else []
    data = [tuple(row[col] for col in columnas) for row in rows]
    app.create_table(data, columnas)
    return

def busqueda_avanzada(filtros, columnas, app):
    if not columnas:
        messagebox.showwarning("Ausencia de datos", "Se debe seleccionar al menos una columna para visualizar los resultados.")
        return

    # Construir la consulta usando el cliente Supabase
    query = app.supabase.table("all_data").select(",".join(columnas))
    
    for col, value in filtros.items():
        if value:
            # Para campos de selección exacta o booleanos, usamos eq
            if col in ["agrupacion", "seccion", "papel", "activo"]:
                if col == "activo":
                    query = query.eq(col, value.lower() == "true")
                else:
                    query = query.eq(col, value)
            else:
                # Para el resto (nombres, dni, etc.), usamos ilike para búsqueda parcial
                query = query.ilike(col, f"%{value}%")
    
    # Ordenar por apellidos por defecto si está en las columnas
    if "surname" in columnas:
        query = query.order("surname")
    elif "name" in columnas:
        query = query.order("name")

    response = query.execute()
    rows = response.data if hasattr(response, "data") else []
    
    # Formatear datos para la tabla
    data = [tuple(row.get(col, "") for col in columnas) for row in rows]
    
    app.create_table(data, columnas)
    return

def on_double_click(app, event):
    # Identificar la región seleccionada
    region_clicked = app.tabla.identify_region(event.x, event.y)
    # Solo interesan las celdas
    if region_clicked != "cell":
        return
    
    # Identificar la fila y columna seleccionada
    column = app.tabla.identify_column(event.x)
    column_index = int(column[1:]) - 1
    selected_iid = app.tabla.focus()
    selected_values = app.tabla.item(selected_iid)["values"]
    
    # Comprobar si es una casilla de tipo checkbox
    current_value = str(selected_values[column_index])
    if current_value in ["☑", "☐"]:
        new_bool = current_value == "☐"
        new_text = "☑" if new_bool else "☐"
        
        # actualización de la celda en la tabla y reescritura de la fila
        new_values = list(selected_values)
        new_values[column_index] = new_text
        app.tabla.item(selected_iid, values=new_values)
        
        # actualización en la base de datos
        app.actualizar_datos(selected_values, new_bool, column_index)
        return

    column_box = app.tabla.bbox(selected_iid, column)
    
    # creación del campo de texto sobre la celda de la tabla seleccionada
    entry_edit = Entry(app.tabla)
    entry_edit.editing_column_index = column_index
    entry_edit.editing_item_iid = selected_iid
    entry_edit.insert(0, selected_values[column_index])
    entry_edit.select_range(0, "end")
    entry_edit.focus()
    entry_edit.bind("<FocusOut>", lambda event: on_focus_out(event))
    entry_edit.bind("<Return>", lambda event: on_enter_pressed(app, event))
    entry_edit.place(x=column_box[0], y=column_box[1], w=column_box[2], h=column_box[3])
    return

def on_click(app, event):
    # Identificar la región seleccionada
    region_clicked = app.tabla.identify_region(event.x, event.y)
    # Solo interesan las celdas
    if region_clicked != "cell":
        return
    
    # Identificar la fila y columna seleccionada
    column = app.tabla.identify_column(event.x)
    column_index = int(column[1:]) - 1
    selected_iid = app.tabla.identify_row(event.y)
    if not selected_iid:
        return
    selected_values = app.tabla.item(selected_iid)["values"]
    
    # Comprobar si es una casilla de tipo checkbox
    current_value = str(selected_values[column_index])
    if current_value in ["☑", "☐"]:
        new_bool = current_value == "☐"
        new_text = "☑" if new_bool else "☐"
        
        # actualización de la celda en la tabla y reescritura de la fila
        new_values = list(selected_values)
        new_values[column_index] = new_text
        app.tabla.item(selected_iid, values=new_values)
        
        # actualización en la base de datos
        app.actualizar_datos(selected_values, new_bool, column_index)
        return
    return

def on_closing(app):
    # ventana para confirmar el cierre de la aplicación
    if messagebox.askokcancel("Quit", "¿Quiere salir del programa?"):
        #app.cursor.close()
        #app.connection.close()
        app.ventana_main.destroy()

def on_focus_out(event):
    # eliminación del widget cuando pierde el foco
    event.widget.destroy()
    return

def on_enter_pressed(app, event):
    # obtención del nuevo dato a guardar
    new_text = event.widget.get()
    # identificación de la celda modificada
    selected_iid = event.widget.editing_item_iid
    column_index = event.widget.editing_column_index
    # actualización de la celda en la tabla y reescritura de la fila
    old_values = app.tabla.item(selected_iid)["values"]
    new_values = old_values.copy()
    new_values[column_index] = new_text
    app.tabla.item(selected_iid, values=new_values)
    event.widget.destroy()
    # actualización en la base de datos en caso de introducir un dato diferente
    if old_values != new_values:
        app.actualizar_datos(old_values, new_text, column_index)
    return

def conectar(app, user, password):
    load_dotenv(override=True)
    app.supabase = create_client(
        os.getenv("SUPABASE_URL"),
        os.getenv("SUPABASE_KEY")
    )
    response = app.supabase.auth.sign_in_with_password(
        {
            "email": user,
            "password": password
        }
    )
    if not response:
        messagebox.showerror("Error de autenticación", "No se pudo autenticar al usuario. Por favor, verifique sus credenciales.")
        return
    else:
        messagebox.showinfo("Conexión exitosa", "Conexión exitosa a la base de datos")
        for widget in app.login_widgets:
            widget.destroy()
        app.main_window()
        return

def obtener_tabla(agrupaciones, secciones, columnas, activos, orden, app):
    # opción para filtar por la columna de activos
    if activos == "Solo activos":
        activos = ["true"]
    elif activos == "Solo inactivos":
        activos = ["false"]
    else:
        activos = ["true", "false"]
    orden = [all_data_columns_dictionary_inv[item] for item in orden.split(", ")]
    if columnas == [] or (secciones == [] and agrupaciones == []):
        messagebox.showwarning("Ausencia de datos", "Se debe seleccionar al menos una agrupación o sección y un dato para las columnas")
        return

    # Construir la consulta usando el cliente Supabase
    query = app.supabase.table("all_data").select(",".join(columnas))
    query = query.in_("activo", activos)
    if agrupaciones:
        query = query.in_("agrupacion", agrupaciones)
    if secciones:
        query = query.in_("seccion", secciones)
    if orden:
        for col in orden:
            query = query.order(col)
    response = query.execute()
    rows = response.data if hasattr(response, "data") else []
    data = [tuple(row[col] for col in columnas) for row in rows]
    app.create_table(data, columnas)
    return