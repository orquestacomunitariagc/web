import pandas as pd
import os
from tkinter import messagebox

def export(app):
    try:
        # Use .schema() to specify information_schema, otherwise it defaults to public
        res = app.supabase.schema("information_schema").table("tables").select("table_name").eq("table_schema", "public").eq("table_type", "BASE TABLE").execute()
        tablas = [row["table_name"] for row in res.data]
    except Exception as e:
        print(f"Error accessing information_schema: {e}")
        # Fallback to known common tables if information_schema is not exposed
        tablas = ["all_data", "papeles", "agrupaciones", "secciones"]

    # Ensure tables directory exists
    if not os.path.exists("tables"):
        os.makedirs("tables")

    export_count = 0
    for t in tablas:
        try:
            data = app.supabase.table(t).select("*").execute()
            if data.data:
                df = pd.DataFrame(data.data)
                df.to_csv(f"tables/tabla_{t}.csv", index=False)
                print(f"Exported {t} successfully.")
                export_count += 1
            else:
                print(f"Table {t} is empty.")
        except Exception as e:
            print(f"Error exporting table {t}: {e}")
    
    if export_count > 0:
        messagebox.showinfo("Exportación completada", f"Se han exportado {export_count} tablas a la carpeta 'tables'.")
    else:
        messagebox.showwarning("Exportación fallida", "No se pudo exportar ninguna tabla. Verifique la conexión y los permisos.")
