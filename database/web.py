from aux_functions import resource_path, sesion
import psycopg2
from flask import Flask, render_template

app = Flask(__name__)

@app.route("/")
def home():
    return render_template("web.html", all_data=all_data)

def get_dict_data(data, list):
    dict_data = {}
    for item in list:
        dict_data[item] = [f"{row[0]} {row[1]}" for row in data if row[2] == item]

    delete_keys = [key for key in dict_data if len(dict_data[key]) == 0]
    for key in delete_keys:
        del dict_data[key]
    
    return dict_data


if __name__ == "__main__":

    instrumentos_orq = ["Violines I", "Violines II", "Violas", "Violonchelos", "Contrabajos", 
                        "Flautas", "Oboes", "Clarinetes", "Fagotes", "Saxofones", 
                        "Trompetas", "Trompas", "Trombones", "Tubas", 
                        "Órgano", "Piano", "Arpa", "Percusión"]
    
    cuerda = ["Violines I", "Violines II", "Violas", "Violonchelos", "Contrabajos"]
    maderas = ["Flautas", "Oboes", "Clarinetes", "Fagotes", "Saxofones"]
    metales = ["Trompetas", "Trompas", "Trombones", "Tubas"]
    otros = ["Órgano", "Piano", "Arpa", "Percusión"]
    
    config = sesion(resource_path("config/config.cfg"))
    connection = psycopg2.connect(**config)
    cursor = connection.cursor()
    cursor.execute("SELECT name, surname, instrumento FROM all_data WHERE activo = true AND instrumento IN ('" + "', '".join(instrumentos_orq) + "')")
    result = cursor.fetchall()
    cursor.close()
    connection.close()

    dict_cuerda = get_dict_data(result, cuerda)
    dict_maderas = get_dict_data(result, maderas)
    dict_metales = get_dict_data(result, metales)
    dict_otros = get_dict_data(result, otros)

    all_data = [dict_cuerda, dict_maderas, dict_metales, dict_otros]

    app.run(debug=True)
