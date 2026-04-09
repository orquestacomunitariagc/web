import threading
from tkinter import ttk
from tkinter import *

from aux_functions import resource_path
from export import export
from listados import listado_pdf, listado_word
from logic import conectar, obtener_tabla, on_closing, on_double_click, on_write, on_click, busqueda_avanzada
from migration import *
from orders import all_data_columns_dictionary, all_data_columns_dictionary_inv


class App:

    def __init__(self, root):
        self.root = root
        self.sesion_params = ["host", "port", "database", "user", "password"]
        self.ventana_login = root
        self.ventana_login.title("Inicio de sesión")
        screen_width = self.ventana_login.winfo_screenwidth()
        screen_height = self.ventana_login.winfo_screenheight()
        self.ventana_login.geometry(f"+{int(screen_width/2) - 100}+{int(screen_height/2) - 100}")
        self.ventana_login.iconbitmap(resource_path("images/logo_ocgc_ico.ico"))

        user_label = Label(self.ventana_login, text="Usuario:")
        user_label.pack(padx=10)
        self.user_entry = Entry(self.ventana_login, width=30)
        self.user_entry.bind("<Return>", lambda event: conectar(self, self.user_entry.get(), self.password_entry.get()))
        self.user_entry.pack(padx=10)
        password_label = Label(self.ventana_login, text="Contraseña:")
        password_label.pack(padx=10)
        self.password_entry = Entry(self.ventana_login, width=30, show="*")
        self.password_entry.bind("<Return>", lambda event: conectar(self, self.user_entry.get(), self.password_entry.get()))
        self.password_entry.pack(padx=10)
        button_remote = Button(self.ventana_login, text="Conectar", command=lambda: conectar(self, 
                                                                                        self.user_entry.get(), 
                                                                                        self.password_entry.get()))
        button_remote.bind("<Return>", lambda event: conectar(self, self.user_entry.get(), self.password_entry.get()))
        button_remote.pack(padx=10, pady=10)
        self.login_widgets = [user_label, self.user_entry, password_label, self.password_entry, button_remote]
        
        self.user_entry.focus_set()

    def main_window(self):
        # creación de la ventana principal
        if hasattr(self, 'ventana_main'):
            for widget in self.ventana_main.winfo_children():
                widget.destroy()
        else:
            self.ventana_main = self.root
            self.ventana_login.withdraw()
        self.ventana_main.title("OCGC DB")
        screen_width = self.ventana_main.winfo_screenwidth()
        screen_height = self.ventana_main.winfo_screenheight()
        window_width = int(screen_width)
        window_height = int(screen_height)
        self.ventana_main.geometry(f"{window_width}x{window_height}+{int((screen_width-window_width)/2)}+{int((screen_height-window_height)/2)}")
        self.ventana_main.state('zoomed')
        self.ventana_main.resizable(True, True)
        self.ventana_main.iconbitmap(resource_path("images/logo_ocgc_ico.ico"))
        self.ventana_main.protocol("WM_DELETE_WINDOW", lambda: on_closing(self))

        self.actualizar_columnas()

        # frame que contendrá las opciones para crear la tabla
        frame_options = Frame(self.ventana_main)

        frame_act_tabla = Frame(frame_options)
        frame_group = Frame(frame_act_tabla)        
        sections_label = Label(frame_group, text="Agrupaciones")
        sections_label.pack(anchor=W)
        col_agrupaciones_tabla = Listbox(frame_group, selectmode=MULTIPLE, width=30, height=len(self.agrupaciones), exportselection=0)
        for value in self.agrupaciones:
            col_agrupaciones_tabla.insert(END, value)
        col_agrupaciones_tabla.pack()
        frame_group.pack(padx=5, pady=5)

        # lista de secciones disponibles para seleccionar
        
        frame_sec = Frame(frame_act_tabla)        
        sections_label = Label(frame_sec, text="Secciones")
        sections_label.pack(anchor=W)
        col_secciones_tabla = Listbox(frame_sec, selectmode=MULTIPLE, width=30, height=10, exportselection=0)
        for value in self.secciones:
            col_secciones_tabla.insert(END, value)
        col_secciones_tabla.pack()
        frame_sec.pack(padx=5, pady=5)
        
        # lista de datos disponibles para selaccionar
        frame_datos = Frame(frame_act_tabla)
        datos_label = Label(frame_datos, text="Datos")
        datos_label.pack(anchor=W)
        self.col_datos = Listbox(frame_datos, selectmode=MULTIPLE, width=30, height=10, exportselection=0)
        for key in all_data_columns_dictionary_inv:
            self.col_datos.insert(END, key)
        self.col_datos.pack()
        frame_datos.pack(padx=5, pady=5)

        # elección de activos/inactivos
        activos_box = ttk.Combobox(frame_act_tabla, state="readonly", values=["Solo activos", "Solo inactivos", "Todos"])
        activos_box.set("Solo activos")
        activos_box.pack(padx=5, pady=5, fill=X)

        # opciones de orden
        orden_box = ttk.Combobox(frame_act_tabla, state="readonly", values=["Apellidos", "Agrupación", "Sección", "Atril", "Agrupación, Sección, Atril"])
        orden_box.set("Apellidos")
        orden_box.pack(padx=5, pady=5, fill=X)

        # botones para acciones
        frame_buttons = Frame(frame_act_tabla)
        # actualizar la tabla con las opciones seleccionadas
        button_actualizar = Button(frame_buttons, text="Actualizar tabla", 
                                        command=lambda: obtener_tabla(
                                            agrupaciones=[col_agrupaciones_tabla.get(i) for i in col_agrupaciones_tabla.curselection()],
                                            secciones=[col_secciones_tabla.get(i) for i in col_secciones_tabla.curselection()], 
                                            columnas=[all_data_columns_dictionary_inv[self.col_datos.get(i)] for i in self.col_datos.curselection()],
                                            activos=activos_box.get(),
                                            orden=orden_box.get(),
                                            app=self
                                        ))
        button_actualizar.grid(row=0, column=0, pady=5)

        # botón para crear un pdf
        button_pdf = Button(frame_buttons, text="Crear listado", command=self.crear_pdf)
        button_pdf.grid(row=0, column=1, pady=5)

        button_export = Button(frame_buttons, text="Exportar a CSV", command=lambda: export(self))
        button_export.grid(row=0, column=2, pady=5)

        # botón para añadir un nuevo miembro a la base de datos
        button_add_user = Button(frame_buttons, text="Añadir usuario", command=self.add_user)
        button_add_user.grid(row=1, column=0, pady=5)

        button_read_excel = Button(frame_buttons, text="Leer Excel", command=lambda: read_excel(self))
        button_read_excel.grid(row=1, column=1, pady=5)

        button_read_csv = Button(frame_buttons, text="Leer CSV", command=lambda: read_csv(self))
        button_read_csv.grid(row=1, column=2, pady=5)

        button_search_advanced = Button(frame_buttons, text="Búsqueda Avanzada", command=self.ventana_busqueda)
        button_search_advanced.grid(row=2, column=0, pady=5, columnspan=3)

        frame_buttons.pack()
        frame_act_tabla.pack(expand=True, fill=BOTH, anchor=NW)
        frame_options.grid(row=1, column=0, padx=5)

        # inicialización de una tabla vacía
        self.frame_tabla = Frame(self.ventana_main)
        self.frame_buscar = LabelFrame(self.frame_tabla)
        self.tabla = ttk.Treeview(self.frame_tabla, columns=[], show="headings")
        self.scrollbar_tabla = Scrollbar(self.frame_tabla)
        self.frame_tabla.grid(row=1, column=1, padx=5, pady=5)

    def create_table(self, rows, columnas):
        # eliminación de la tabla anterior
        self.frame_buscar.destroy()
        self.tabla.destroy()
        self.scrollbar_tabla.destroy()

        # botón búsqueda
        self.frame_buscar = LabelFrame(self.frame_tabla, text="Buscar")
        name_search_label = Label(self.frame_buscar, text="Nombre")
        name_search_label.grid(row=0, column=0)
        self.name_search_entry = Entry(self.frame_buscar, width=20)
        self.name_search_entry.bind("<Return>", lambda event: on_write(event, "name", self))
        self.name_search_entry.grid(row=0, column=1, padx=5)
        surname_search_label = Label(self.frame_buscar, text="Apellidos")
        surname_search_label.grid(row=0, column=2)
        self.surname_search_entry = Entry(self.frame_buscar, width=20)
        self.surname_search_entry.grid(row=0, column=3, padx=5)
        self.surname_search_entry.bind("<Return>", lambda event: on_write(event, "surname", self))
        self.frame_buscar.pack(padx=16, pady=5, anchor=E)

        # nueva tabla con su scrollbar con las filas obtenidas de la consulta
        self.scrollbar_tabla = Scrollbar(self.frame_tabla, orient="vertical")
        self.scrollbar_tabla.pack(side=RIGHT, fill=Y)
        self.tabla = ttk.Treeview(self.frame_tabla, columns=columnas, height=43, show="headings", yscrollcommand=self.scrollbar_tabla.set)
        self.scrollbar_tabla.config(command=self.tabla.yview)
        self.tabla.bind("<Double-1>", lambda event: on_double_click(self, event))
        self.tabla.bind("<Button-1>", lambda event: on_click(self, event))
        self.tabla.pack()
        for key in columnas:
            self.tabla.heading(key, text=all_data_columns_dictionary[key])
        
        for row in rows:
            formatted_row = []
            for item in row:
                if item is True or str(item).lower() == 'true':
                    formatted_row.append("☑")
                elif item is False or str(item).lower() == 'false':
                    formatted_row.append("☐")
                else:
                    formatted_row.append(item)
            self.tabla.insert("", "end", values=tuple(formatted_row))
        return

    def actualizar_datos(self, old_values, new_text, column_index):
        # modificación de los antiguos valores para introducirlos en la query
        old_values = [str(item) for item in old_values]

        # nombres de las columnas que se usarán para la query
        columnas = [all_data_columns_dictionary_inv[self.col_datos.get(i)] for i in self.col_datos.curselection()]

        # creación de la query para obtener el usuario que se ha modificado y realización de la consulta
        # Buscar el registro por los valores antiguos
        filters = {}
        for i in range(len(old_values)):
            value = old_values[i]
            col = columnas[i]
            if value == "None":
                filters[col] = None
            elif value == "☑":
                filters[col] = True
            elif value == "☐":
                filters[col] = False
            else:
                filters[col] = value

        # Obtener el registro usando Supabase ORM
        result = self.supabase.table("all_data").select("estructura_id").match(filters).execute()
        if result.data and len(result.data) > 0:
            estructura_id = result.data[0]["estructura_id"]
            
            # Convertir el nuevo valor a booleano si es necesario
            if str(new_text).lower() == 'true' or new_text == "☑":
                db_value = True
            elif str(new_text).lower() == 'false' or new_text == "☐":
                db_value = False
            else:
                db_value = new_text

            # Actualizar el campo usando Supabase ORM
            update_col = columnas[column_index]
            self.supabase.table("all_data").update({update_col: db_value}).eq("estructura_id", estructura_id).execute()
        return


    def add_user(self):
        self.ventana_add = Toplevel()
        self.ventana_add.title("Añadir nuevo usuario")
        screen_width = self.ventana_add.winfo_screenwidth()
        self.ventana_add.geometry(f"+{int(screen_width/2)}+50")
        self.ventana_add.iconbitmap(resource_path("images/logo_ocgc_ico.ico"))

        # creación de los campos de texto para la introducción de datos
        labels = []
        inputs = []
        for value in list(all_data_columns_dictionary.values())[1:]:
            label = Label(self.ventana_add, text=value)
            input = Entry(self.ventana_add, width=30)
            i = list(all_data_columns_dictionary.values()).index(value)
            label.grid(sticky="W", row=i, column=0, padx=5)
            input.grid(sticky="W", row=i, column=1, padx=5)
            labels.append(label)
            inputs.append(input)

        # botón para guardar el nuevo usuario
        add_button = Button(
            self.ventana_add,
            text="Añadir datos",
            command=lambda: self.add_user_manual_app(
                {all_data_columns_dictionary_inv[label.cget("text")]: input.get()
                for label, input in zip(labels, inputs)}
            )
        )
        add_button.grid(row=i+1, column=0, columnspan=2, pady=5)
        return
    
    def add_user_manual_app(self, data):
        if data["name"] == "" or data["surname"] == "" or data["dni"] == "" or data["agrupacion"] == "" or data["seccion"] == "" or data["papel"] == "":
            messagebox.showerror("Error", "Los campos Nombre, Apellidos, DNI, Agrupación, Sección y Papel son obligatorios")
            return
        else:
            for key in data:
                if data[key] == "":
                    data[key] = None
            self.supabase.table("all_data").insert(data).execute()
            messagebox.showinfo("Usuario añadido", "El usuario ha sido añadido con éxito")

    #def del_user(self):
    #    #comprobación de que se ha seleccionado un elemento de la tabla
    #    try:
    #        curItem = self.tabla.focus()
    #    except:
    #        messagebox.showerror("Error", "No se seleccionó ningún elemento")
    #        return
    #    data = self.tabla.item(curItem)["values"]
#
    #    # nombres de las columnas que se usarán para la query
    #    columnas = [self.all_data_columns_dictionary_inv[self.col_datos.get(i)] for i in self.col_datos.curselection()]
#
    #    # obtención del usuario a eliminar
    #    query = "SELECT user_id, name, surname FROM all_data WHERE "
    #    for i in range(len(data)):
    #        if data[i] == "None":
    #            query += f"{columnas[i]} IS NULL AND "
    #        else:
    #            query += f"{columnas[i]} = '{data[i]}' AND "
    #    query = query[:-5] + ";"
    #    self.cursor.execute(query)
    #    user = self.cursor.fetchone()
#
    #    if messagebox.askokcancel("Eliminar", f"¿Quiere eliminar a {user[1]} {user[2]} de la base de datos?"):
    #        # querys para eliminar el usuario por id en todas las tablas
    #        self.cursor.execute("DELETE FROM estructura WHERE user_id = %s;", (user[0],))
    #        self.cursor.execute("DELETE FROM users_programas WHERE user_id = %s;", (user[0],))
    #        self.cursor.execute("DELETE FROM matriculas WHERE user_id = %s;", (user[0],))
    #        self.cursor.execute("DELETE FROM users WHERE user_id = %s;", (user[0],))
    #        # estas lineas se pueden hacer con un procedure en la base de datos (del_user)
    #        # self.cursor.execute("CALL del_user(%s)", (user_id,))
    #        messagebox.showinfo("Usuario eliminado", "El usuario ha sido eliminado con éxito")
    #        return
    #    else:
    #        return


    def crear_pdf(self):
        self.ventana_listado = Toplevel()
        self.ventana_listado.title("Crear PDF")
        screen_width = self.ventana_listado.winfo_screenwidth()
        screen_height = self.ventana_listado.winfo_screenheight()
        window_width = int(screen_width * 0.25)
        window_height = int(screen_height * 0.8)
        self.ventana_listado.geometry(f"{window_width}x{window_height}+{int((screen_width-window_width)/2)}+{int((screen_height-window_height)/2)}")
        self.ventana_listado.iconbitmap(resource_path("images/logo_ocgc_ico.ico"))

        frame_pdf_agroup_sec = Frame(self.ventana_listado)
        # poner las agrupaciones igual que en la tabla
        col_agrupaciones_pdf = Listbox(frame_pdf_agroup_sec, selectmode=MULTIPLE, width=30, height=4, exportselection=0)
        for value in self.agrupaciones:
            col_agrupaciones_pdf.insert(END, value)
        col_agrupaciones_pdf.pack(pady=5)

        # lista de secciones en scroleable
        scrollbar_pdf_2 = Scrollbar(frame_pdf_agroup_sec, orient="vertical")
        scrollbar_pdf_2.pack(side=RIGHT, fill=Y)
        col_secciones_pdf = Listbox(frame_pdf_agroup_sec, selectmode=MULTIPLE, width=30, height=20, yscrollcommand=scrollbar_pdf_2.set, exportselection=0)
        scrollbar_pdf_2.config(command=col_secciones_pdf.yview)
        for value in self.secciones:
            col_secciones_pdf.insert(END, value)
        col_secciones_pdf.pack(pady=5)

        frame_pdf_agroup_sec.grid(row=1, column=0, pady=5)


        frame_pdf_papeles_datos = Frame(self.ventana_listado)

        col_papeles_pdf = Listbox(frame_pdf_papeles_datos, selectmode=MULTIPLE, width=30, height=4, exportselection=0)
        for value in self.papeles:
            col_papeles_pdf.insert(END, value)
        col_papeles_pdf.pack(pady=5)

        # lista de datos en lista scroleable
        scrollbar_pdf_3 = Scrollbar(frame_pdf_papeles_datos, orient="vertical")
        scrollbar_pdf_3.pack(side=RIGHT, fill=Y)
        col_datos_pdf = Listbox(frame_pdf_papeles_datos, selectmode=MULTIPLE, width=30, height=20, yscrollcommand=scrollbar_pdf_3.set, exportselection=0)
        scrollbar_pdf_3.config(command=col_datos_pdf.yview)
        for value in all_data_columns_dictionary.values():
            col_datos_pdf.insert(END, value)
        col_datos_pdf.pack(pady=5)
        frame_pdf_papeles_datos.grid(row=1, column=1, pady=5)

        # selección del criterio para ordenar los resultados
        orden = LabelFrame(self.ventana_listado, text="Ordenar por")
        orden_box = ttk.Combobox(orden, state="readonly", values=["Apellidos", "Sección", "Atril", "Cabeza-Alfabético"])
        orden_box.set("Apellidos")
        orden.grid(sticky="W", row=25, column=0, padx=5)
        orden_box.grid(sticky="W",row=26, column=0, padx=5)

        # separación de las tablas
        separar = LabelFrame(self.ventana_listado, text="Separar por")
        separar_box = ttk.Combobox(separar, state="readonly", values=["Secciones", "Agrupaciones", "Papeles", "No separar"])
        separar_box.set("Secciones")
        separar.grid(sticky="W", row=25, column=1, padx=5)
        separar_box.grid(sticky="W",row=26, column=1, padx=5)

        # opción para quienes seleccionar
        activos = LabelFrame(self.ventana_listado, text="Seleccionar")
        activos_box_pdf = ttk.Combobox(activos, state="readonly", values=["Solo activos", "Solo inactivos", "Todos"])
        activos_box_pdf.set("Solo activos")
        activos.grid(sticky="W", row=27, column=0, padx=5)
        activos_box_pdf.grid(sticky="W",row=28, column=0, padx=5)

        # opción para unir nombre y apellidos
        union = LabelFrame(self.ventana_listado, text="Unir nombre y apellidos")
        union_box = ttk.Combobox(union, state="readonly", values=["Nombre,Apellidos", "Apellidos,Nombre"])
        union_box.set("")
        union.grid(sticky="W", row=27, column=1, padx=5)
        union_box.grid(sticky="W",row=28, column=1, padx=5)

        # opción de numerar o no las filas
        ajustes = LabelFrame(self.ventana_listado, text="Ajustes")
        self.numerar_var = BooleanVar()
        numerar_box = Checkbutton(ajustes, text="Filas numeradas", variable=self.numerar_var, command=lambda: self.clicked(value=self.numerar_var.get()))
        numerar_box.grid(sticky="W", row=29, column=0, padx=5)
        self.destacados_secc = BooleanVar()
        destacados_secc = Checkbutton(ajustes, text="Separar cabeza y destacados de sección", variable=self.destacados_secc, command=lambda: self.clicked(value=self.destacados_secc.get()))
        destacados_secc.grid(sticky="W", row=30, column=0, padx=5)
        ajustes.grid(sticky="W", row=30, column=0, padx=5)

        # ancho de las columnas de la tabla
        ancho_columnas = LabelFrame(self.ventana_listado, text="Ancho de columnas")
        ancho_columnas_entry = Entry(ancho_columnas)
        ancho_columnas_entry.insert(0, "10, 60, 60, 30, 30")
        ancho_columnas_entry.grid(sticky="W", row=29, column=1, padx=5)
        ancho_columnas.grid(sticky="W", row=30, column=1, padx=5)

        # texto a añadir en la cabecera del pdf
        cabecera = LabelFrame(self.ventana_listado, text="Texto de cabecera")
        cabecera_pdf_box = Text(cabecera, height=5, width=50)
        cabecera_pdf_box.grid(sticky="W", row=32, column=0, columnspan=2, padx=5, pady=5)
        cabecera.grid(sticky="W", row=33, column=0, columnspan=2, padx=5, pady=5)

        # nombre del archivo pdf
        nombre_pdf = LabelFrame(self.ventana_listado, text="Nombre del archivo pdf")
        nombre_pdf_box = Entry(nombre_pdf)
        nombre_pdf_box.insert(0, "prueba")
        nombre_pdf.grid(sticky="W", row=34, column=0, columnspan=2, padx=5, pady=5)
        nombre_pdf_box.grid(sticky="W", row=35, column=0, columnspan=2, padx=5, pady=5)

        # botón para enviar las selecciones realizadas a las funciones encargadas de crear el pdf
        pdf_button = Button(self.ventana_listado, text="Crear PDF", command=lambda: listado_pdf(
                                                                                                    self,
                                                                                                    [col_agrupaciones_pdf.get(i) for i in col_agrupaciones_pdf.curselection()],
                                                                                                    [col_secciones_pdf.get(i) for i in col_secciones_pdf.curselection()], 
                                                                                                    [col_papeles_pdf.get(i) for i in col_papeles_pdf.curselection()],
                                                                                                    [all_data_columns_dictionary_inv[col_datos_pdf.get(i)] for i in col_datos_pdf.curselection()],
                                                                                                    all_data_columns_dictionary_inv[orden_box.get()],
                                                                                                    separar_box.get(),
                                                                                                    activos_box_pdf.get(),
                                                                                                    union_box.get(),
                                                                                                    self.numerar_var.get(),
                                                                                                    self.destacados_secc.get(),
                                                                                                    ancho_columnas_entry.get(),
                                                                                                    cabecera_pdf_box.get("1.0", "end"),
                                                                                                    nombre_pdf_box.get())
                                                                                                    )
        pdf_button.grid(sticky="W", row=35, column=0, padx=20, pady=5, columnspan=2)
        word_button = Button(self.ventana_listado, text="Crear word", command=lambda: listado_word(
                                                                                                    self,
                                                                                                    [col_agrupaciones_pdf.get(i) for i in col_agrupaciones_pdf.curselection()],
                                                                                                    [col_secciones_pdf.get(i) for i in col_secciones_pdf.curselection()], 
                                                                                                    [col_papeles_pdf.get(i) for i in col_papeles_pdf.curselection()],
                                                                                                    [all_data_columns_dictionary_inv[col_datos_pdf.get(i)] for i in col_datos_pdf.curselection()],
                                                                                                    all_data_columns_dictionary_inv[orden_box.get()],
                                                                                                    separar_box.get(),
                                                                                                    activos_box_pdf.get(),
                                                                                                    union_box.get(),
                                                                                                    self.numerar_var.get(),
                                                                                                    self.destacados_secc.get(),
                                                                                                    ancho_columnas_entry.get(),
                                                                                                    cabecera_pdf_box.get("1.0", "end"),
                                                                                                    nombre_pdf_box.get())
                                                                                                    )
        word_button.grid(sticky="W", row=35, column=1, padx=20, pady=5, columnspan=2)
        return

    # cambiar el valor de una checkbox
    def clicked(self, value):
        value.set(not value.get())
        return

    def ventana_busqueda(self):
        self.ventana_search = Toplevel()
        self.ventana_search.title("Búsqueda Avanzada")
        screen_width = self.ventana_search.winfo_screenwidth()
        screen_height = self.ventana_search.winfo_screenheight()
        window_width = int(screen_width * 0.4)
        window_height = int(screen_height * 0.7)
        self.ventana_search.geometry(f"{window_width}x{window_height}+{int((screen_width-window_width)/2)}+{int((screen_height-window_height)/2)}")
        self.ventana_search.iconbitmap(resource_path("images/logo_ocgc_ico.ico"))

        # Frame para selección de columnas
        frame_cols = LabelFrame(self.ventana_search, text="Seleccionar Columnas a Visualizar")
        frame_cols.pack(fill=X, padx=10, pady=5)
        
        # Scrollbar para la lista de columnas
        scrollbar_cols = Scrollbar(frame_cols, orient="vertical")
        scrollbar_cols.pack(side=RIGHT, fill=Y)
        
        self.listbox_cols_search = Listbox(frame_cols, selectmode=MULTIPLE, height=8, yscrollcommand=scrollbar_cols.set, exportselection=0)
        for key in all_data_columns_dictionary:
            self.listbox_cols_search.insert(END, all_data_columns_dictionary[key])
        self.listbox_cols_search.pack(fill=X, padx=5, pady=5)
        scrollbar_cols.config(command=self.listbox_cols_search.yview)

        # Preseleccionar algunas columnas comunes
        common_cols = ["ID", "Apellidos", "Nombre", "DNI", "Agrupación", "Sección"]
        for i, key in enumerate(all_data_columns_dictionary):
            if all_data_columns_dictionary[key] in common_cols:
                self.listbox_cols_search.select_set(i)

        # Frame para criterios de búsqueda
        frame_criteria = LabelFrame(self.ventana_search, text="Criterios de Búsqueda (Búsqueda parcial)")
        frame_criteria.pack(fill=BOTH, expand=True, padx=10, pady=5)

        # Usar un canvas para que los criterios sean scroleables
        canvas = Canvas(frame_criteria)
        scrollbar_v = Scrollbar(frame_criteria, orient="vertical", command=canvas.yview)
        scrollable_frame = Frame(canvas)

        scrollable_frame.bind(
            "<Configure>",
            lambda e: canvas.configure(
                scrollregion=canvas.bbox("all")
            )
        )

        canvas.create_window((0, 0), window=scrollable_frame, anchor="nw")
        canvas.configure(yscrollcommand=scrollbar_v.set)

        canvas.pack(side="left", fill="both", expand=True)
        scrollbar_v.pack(side="right", fill="y")

        # Añadir todos los campos disponibles para búsqueda
        self.search_entries = {}
        
        row_idx = 0
        for key, field in all_data_columns_dictionary.items():
            if key == "user_id": continue # ID usualmente no se busca parcialmente
            
            Label(scrollable_frame, text=field).grid(row=row_idx, column=0, padx=5, pady=2, sticky=W)
            
            if key == "agrupacion":
                entry = ttk.Combobox(scrollable_frame, values=[""] + self.agrupaciones, state="readonly", width=27)
            elif key == "seccion":
                entry = ttk.Combobox(scrollable_frame, values=[""] + self.secciones, state="readonly", width=27)
            elif key == "papel":
                entry = ttk.Combobox(scrollable_frame, values=[""] + self.papeles, state="readonly", width=27)
            elif key == "activo":
                entry = ttk.Combobox(scrollable_frame, values=["", "true", "false"], state="readonly", width=27)
            else:
                entry = Entry(scrollable_frame, width=30)
                entry.bind("<Return>", lambda event: busqueda_avanzada(
                    filtros={k: v.get() for k, v in self.search_entries.items() if v.get()},
                    columnas=[all_data_columns_dictionary_inv[self.listbox_cols_search.get(i)] for i in self.listbox_cols_search.curselection()],
                    app=self
                ))
                
            entry.grid(row=row_idx, column=1, padx=5, pady=2, sticky=EW)
            self.search_entries[key] = entry
            row_idx += 1

        # Botón para buscar
        button_search = Button(self.ventana_search, text="Realizar Búsqueda", 
                              command=lambda: busqueda_avanzada(
                                  filtros={k: v.get() for k, v in self.search_entries.items() if v.get()},
                                  columnas=[all_data_columns_dictionary_inv[self.listbox_cols_search.get(i)] for i in self.listbox_cols_search.curselection()],
                                  app=self
                              ))
        button_search.pack(pady=10)

    def actualizar_columnas(self):
        result_papeles = self.supabase.table("papeles").select("papel").order("papel").execute()
        self.papeles = [item["papel"] for item in result_papeles.data] if result_papeles.data else []

        result_agrupaciones = self.supabase.table("agrupaciones").select("agrupacion").order("agrupacion").execute()
        self.agrupaciones = [item["agrupacion"] for item in result_agrupaciones.data] if result_agrupaciones.data else []

        result_secciones = self.supabase.table("secciones").select("seccion").order("seccion").execute()
        self.secciones = [item["seccion"] for item in result_secciones.data] if result_secciones.data else []

    def progress_bar(self, function):
        self.cancel_flag = False
        self.progress_window = Toplevel()
        self.progress_window.title("Progreso")
        screen_width = self.progress_window.winfo_screenwidth()
        screen_height = self.progress_window.winfo_screenheight()
        self.progress_window.geometry(f"+{int(screen_width/2) - 100}+{int(screen_height/2) - 100}")
        self.progress_window.iconbitmap(resource_path("images/logo_ocgc_ico.ico"))
        self.progress_window.resizable(False, False)
        text_progress = Label(self.progress_window, text="Cargando datos...")
        text_progress.pack()
        self.progressbar_widget = ttk.Progressbar(self.progress_window, orient="horizontal", length=200, mode="determinate", maximum=100)
        self.progressbar_widget.pack(padx=20, pady=20)
        self.percent_label = Label(self.progress_window, text="0%")
        self.percent_label.pack()
        cancel_button = Button(self.progress_window, text="Cancelar", command=self.cancel_progress)
        cancel_button.pack(pady=5)
        # Start the thread
        threading.Thread(target=function, args=(self,), daemon=True).start()

    def cancel_progress(self):
        self.cancel_flag = True
        self.progress_window.destroy()
        messagebox.showinfo("Cancelado", "La operación ha sido cancelada.")

    def update_progress(self, step, step_percent, total_steps):
        if getattr(self, 'cancel_flag', False):
            return
        self.progressbar_widget["value"] = step_percent
        self.percent_label.config(text=f"{self.progressbar_widget['value']:.1f}% ({step}/{total_steps})")
        self.progress_window.update_idletasks()
        if self.progressbar_widget['value'] >= 100:
            self.progressbar_widget.stop()
            self.progress_window.destroy()
            messagebox.showinfo("Carga completa", "Los datos se han cargado correctamente.")
            self.main_window()