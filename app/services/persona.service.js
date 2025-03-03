const { Persona, Rol, Usuario, AdministradorInstructor, Admin } = require('../../models');
const { Sequelize } = require('sequelize'); // Importar Sequelize
const bcrypt = require('bcrypt');
const MiddlewareCrearToken = require('../../middleware/CrearToken.Orm');
const ListaNegraService = require('../services/ListaNegra');
const ApiResponse = require('../utils/apiResponse');

class PersonaService {
    static async login(req, res) {
        try {
            const { email, password } = req.body;
            if (!email || !password) {
                return res.status(400).json({ error: 'Credenciales necesarias' });
            }
            const user = await Persona.findOne({ where: { email } });
            if (!user) {
                return res.status(404).json({ error: 'Usuario no encontrado' });
            }

            const isPasswordValid = await bcrypt.compare(password, user.password);
            if (!isPasswordValid) {
                return res.status(401).json({ error: 'Contraseña incorrecta' });
            }
            const token = await MiddlewareCrearToken.CrearToken(user);
            const results = ApiResponse.createApiResponse('Successful login', { 
                token,
                user: { id: user.id, identificacion: user.n_documento_identidad } 
            } )
            return res.status(200).json(results);
        } catch (error) {
            console.error(error);
            return res.status(500).json({ error: 'Error al iniciar sesión' });
        }
    }

    static async getAllPersonas() {
        try {
            const people = await Persona.findAll({
                attributes: [
                    'id',
                    'nombre',
                    'email',
                    'n_documento_identidad',
                    'sede',
                    [Sequelize.col('rol.nombre'), 'id_rol'],
                    [Sequelize.col('usuario.n_ficha'), 'usuario_ficha'],
                    [Sequelize.col('usuario.jornada'), 'jornada'],
                    [Sequelize.col('usuario.nombre_del_programa'), 'usuario_programa'],
                    [Sequelize.col('instructor.n_ficha'), 'instructor_ficha'],
                    [Sequelize.col('instructor.nombre_del_programa'), 'instructor_programa']
                ],
                include: [
                    {
                        model: Rol,
                        attributes: [],
                        //required: true,
                        as: 'rol' 
                    },
                    {
                        model: Usuario,
                        attributes: [],
                        //required: false,
                        as: 'usuario'
                    },
                    {
                        model: AdministradorInstructor,
                        attributes: [],
                        //required: false,
                        as: 'instructor'
                    }
                ],
                //raw: true
            });

            return people;
        } catch (error) {
            throw new Error(`Error al obtener personas: ${error.message}`);
        }
    }

    static async register(personData) {
        try {
            const { nombre, email, password, n_documento_identidad, sede, id_rol, n_ficha, jornada, nombre_del_programa } = personData;

            // Verificar si la persona ya existe
            const existingPerson = await Persona.findOne({ where: { email } });
            if (existingPerson) {
                throw new Error('La persona ya está registrada');
            }

            // Validar campos obligatorios
            if (!nombre || !email || !password || !n_documento_identidad || !sede || !id_rol) {
                throw new Error('Todos los campos obligatorios deben estar completos');
            }

            // Hashear contraseña
            const hashedPassword = await bcrypt.hash(password, 10);

            // Crear persona base
            const person = await Persona.create({
                nombre,
                email,
                password: hashedPassword,
                n_documento_identidad,
                sede,
                id_rol
            });

            // Obtener el id de la person
            const id_persona = person.id;

            // Insertar en tabla correspondiente según el id_rol
            if (id_rol === 3) {
                if (!n_ficha || !jornada || !nombre_del_programa) {
                    throw new Error('Datos adicionales necesarios para usuarios: n_ficha, jornada, nombre_del_programa');
                }
                const usuario = await Usuario.create({
                    n_ficha,
                    jornada,
                    nombre_del_programa,
                    id_persona
                });
            } else if (id_rol === 2) {
                if (!n_ficha || !nombre_del_programa) {
                    throw new Error('Datos adicionales necesarios para instructores: n_ficha, nombre_del_programa');
                }
                const instructor = await AdministradorInstructor.create({
                    id_persona,
                    n_ficha,
                    nombre_del_programa
                });
            } else if (id_rol === 1) {
                if (!nombre || !email || !password) {
                    throw new Error('Datos necesarios para el ADMIN');
                }
                await Admin.create({
                    nombre,
                    email,
                    password: hashedPassword
                });
            }else {
                throw new Error('Rol no válido');
            }

            return person ;
        } catch (error) {
            throw new Error(`Error al crear persona: ${error.message}`);
        }
    }

    static async findPersonById(id) {
        try {
            const person = await Persona.findOne({ where: { id } });
            if (!person) {
                throw new Error('No se encontró la persona.');
            }
            return person;
        } catch (error) {
            throw error;
        }
    }

    static async findAllPersons() {
        try {
            const persons = await Persona.findAll();
            return persons;
        } catch (error) {
            throw error;
        }
    }

    static async findAllUsuarios() {
        try {
            const users = await Usuario.findAll();
            return users;
        } catch (error) {
            throw error;
        }
    }

    static async findAllInstructores() {
        try {
            const owner = await AdministradorInstructor.findAll();
            return owner;
        } catch (error) {
            throw error;
        }
    }

    static async editPersona(id_persona, nuevaPersona) {
        try {
            const person = await Persona.findByPk(id_persona)
            if (!person) {
                throw new Error('No se encontró la persona.');
            }
            await person.update(nuevaPersona);
            return person;
        } catch (error) {
            throw error;
        }
    }

    static async deletePersona(id) {
        try {
            const person = await Persona.findByPk(id);
            if (!person) {
                throw new Error('No se encontró la persona.');
            }
            await Persona.destroy({ where: { id } });
            return person;
        } catch (error) {
            throw error;
        }
    }

    static async logout(token) {
        try {
            await ListaNegraService.agregarToken(token);
            const result =  { message: 'Session closed successfully' };
            return result;
        } catch (error) {
            throw error;
        }
    }
}

module.exports = PersonaService;

