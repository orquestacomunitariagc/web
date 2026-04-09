all_data_columns_dict = {
    "users": ["user_id", "name", "surname", "dni", "email", "phone", "birth_date", "activo", "atril"],
    "agrupaciones": ["agrupaciones"],
    "secciones": ["secciones"],
    "activo_atril": ["activo", "atril"],
    "residencia": ["isla", "municipio", "empadronamiento"],
    "empleos": ["trabajo", "estudios"],
    "matriculas": ["matricula_number"]
}

all_data_columns_dictionary = {
    "user_id": "ID",
    "surname": "Apellidos",
    "name": "Nombre",
    "dni": "DNI",
    "email": "Correo",
    "phone": "Telefono",
    "birth_date": "Fecha de nacimiento",
    "papel": "Papel",
    "agrupacion": "Agrupación",
    "seccion": "Sección",
    "isla": "Isla",
    "municipio": "Municipio",
    "empadronamiento": "Empadronamiento",
    "trabajo": "Trabajo",
    "estudios": "Estudios",
    "matricula_number": "Matricula",
    "activo": "Activo",
    "atril": "Atril"
}

all_data_columns_dictionary_inv = {v: k for k, v in all_data_columns_dictionary.items()}

papeles_order = ["Músico", "Invitado", "Colaborador", "Empresa Externa"]

agrupaciones_order = ["Orquesta", "Coro", "Ensemble Flautas", "Ensemble Metales", "Ensemble Chelos", "Colaboradores", "Empresa Externa", "Público"]

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
    "Colaboradores", "Transportes", "Rider Service", "Brea Producciones", "Productora Pedro Ruiz", "Técnico Sonido", "Técnico Sala", "LF Sound", "Productora Las Hormigas Negras", 
    "Invitados"
]