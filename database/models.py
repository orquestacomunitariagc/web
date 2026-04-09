class User:
    def __init__(self, name, surname, dni, agrupacion, seccion, papel, activo=True,
                phone=None, email=None, birth_date=None, isla=None, municipio=None, empadronamiento=None, 
                trabajo=None, estudios=None, matricula_number=None, atril=None):
        
        self.name = name
        self.surname = surname
        self.dni = dni
        self.agrupacion = agrupacion
        self.seccion = seccion
        self.papel = papel
        self.activo = activo

        self.phone = phone
        self.email = email
        self.birth_date = birth_date
        self.isla = isla
        self.municipio = municipio
        self.empadronamiento = empadronamiento
        self.trabajo = trabajo
        self.estudios = estudios
        self.matricula_number = matricula_number
        self.atril = atril