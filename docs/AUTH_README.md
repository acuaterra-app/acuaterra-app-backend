# Sistema de Autenticación y Manejo de Contraseñas Temporales

Este documento describe la implementación del sistema de autenticación de Acuaterra, incluyendo el flujo para manejo de contraseñas temporales.

## Descripción General

El sistema de autenticación de Acuaterra proporciona las siguientes funcionalidades:

- **Login**: Permite a los usuarios autenticarse con email y contraseña
- **Logout**: Permite cerrar sesión y invalidar el token
- **Cambio de Contraseña Temporal**: Obliga a los nuevos usuarios a cambiar su contraseña temporal antes de acceder al sistema

### Características Principales

- **Contraseñas Temporales**: Los usuarios nuevos reciben una contraseña temporal que deben cambiar en su primer inicio de sesión
- **Flag mustChangePassword**: Indica si el usuario debe cambiar su contraseña antes de acceder al sistema
- **Validaciones de Seguridad**: Se aplican validaciones para garantizar contraseñas seguras
- **Tokens JWT**: Se utiliza JWT para mantener las sesiones y proteger los endpoints

## Endpoints Disponibles

### 1. Login

```
POST /api/auth/login
```

**Request Body:**
```json
{
  "email": "usuario@ejemplo.com",
  "password": "contraseña123",
  "device_id": "optional-device-id"
}
```

**Respuesta Exitosa (200 OK):**
```json
{
  "msg": "Successful login",
  "error": false,
  "data": [
    {
      "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
      "user": {
        "id": 1,
        "dni": "12345678",
        "name": "Usuario Ejemplo",
        "email": "usuario@ejemplo.com",
        "id_rol": 2,
        "rol": "owner",
        "contact": "123456789",
        "mustChangePassword": false
      }
    }
  ],
  "errors": []
}
```

**Respuesta con Contraseña Temporal (200 OK):**
```json
{
  "msg": "Successful login",
  "error": false,
  "data": [
    {
      "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
      "user": {
        "id": 1,
        "dni": "12345678",
        "name": "Usuario Ejemplo",
        "email": "usuario@ejemplo.com",
        "id_rol": 2,
        "rol": "owner",
        "contact": "123456789",
        "mustChangePassword": true
      },
      "mustChangePassword": true
    }
  ],
  "errors": []
}
```

**Respuesta de Error (400 Bad Request):**
```json
{
  "msg": "Error de autenticación",
  "error": true,
  "data": [],
  "errors": [
    {
      "msg": "Las credenciales no coinciden"
    }
  ]
}
```

### 2. Logout

```
POST /api/auth/logout
```

**Headers:**
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Respuesta Exitosa (200 OK):**
```json
{
  "msg": "Session closed",
  "error": false,
  "data": [],
  "errors": []
}
```

**Respuesta de Error (401 Unauthorized):**
```json
{
  "msg": "No token provided",
  "error": true,
  "data": [],
  "errors": []
}
```

### 3. Cambio de Contraseña Temporal

```
POST /api/auth/change-password
```

**Request Body:**
```json
{
  "email": "usuario@ejemplo.com",
  "oldPassword": "contraseñaTemporal",
  "newPassword": "NuevaContraseña123"
}
```

**Respuesta Exitosa (200 OK):**
```json
{
  "msg": "Contraseña actualizada exitosamente",
  "error": false,
  "data": [
    {
      "user": {
        "id": 1,
        "dni": "12345678",
        "name": "Usuario Ejemplo",
        "email": "usuario@ejemplo.com",
        "id_rol": 2,
        "rol": "owner",
        "contact": "123456789",
        "mustChangePassword": false
      }
    }
  ],
  "errors": []
}
```

**Respuesta de Error (400 Bad Request):**
```json
{
  "msg": "Error al cambiar contraseña",
  "error": true,
  "data": [],
  "errors": [
    {
      "msg": "La contraseña actual es incorrecta"
    }
  ]
}
```

## Flujos de Autenticación

### 1. Flujo Normal (Usuario con Contraseña Definitiva)

1. El usuario envía sus credenciales al endpoint de login
2. El backend valida las credenciales y verifica que `mustChangePassword` sea `false`
3. El backend genera un token JWT y devuelve los datos del usuario
4. El frontend almacena el token y redirige al usuario al dashboard
5. El usuario accede normalmente al sistema

### 2. Flujo con Contraseña Temporal

1. El usuario envía sus credenciales al endpoint de login
2. El backend valida las credenciales y detecta que `mustChangePassword` es `true`
3. El backend genera un token JWT, incluye `mustChangePassword: true` en la respuesta y devuelve los datos del usuario
4. El frontend detecta `mustChangePassword: true` y redirige al usuario a la pantalla de cambio de contraseña
5. El usuario ingresa su contraseña actual y la nueva contraseña
6. El backend valida, actualiza la contraseña y cambia `mustChangePassword` a `false`
7. El usuario puede acceder normalmente al sistema

### Diagrama de Flujo

```
┌─────────────┐    Login     ┌─────────────┐
│             ├─────────────►│             │
│   Frontend  │              │   Backend   │
│             │◄─────────────┤             │
└──────┬──────┘  Respuesta   └─────────────┘
       │
       │ ¿mustChangePassword?
       │
  ┌────▼─────┐
  │          │
  │    Sí    │      No     ┌─────────────┐
  │          ├────────────►│  Dashboard   │
  └────┬─────┘             └─────────────┘
       │
┌──────▼──────┐  Cambio de    ┌─────────────┐
│             │  Contraseña   │             │
│  Pantalla   ├──────────────►│   Backend   │
│  Cambio     │               │             │
│  Contraseña │◄──────────────┤             │
└──────┬──────┘  Actualizado  └─────────────┘
       │
       │
┌──────▼──────┐
│             │
│  Dashboard  │
│             │
└─────────────┘
```

## Manejo de Errores

### Errores de Autenticación

| Código | Mensaje                      | Descripción                           |
|--------|------------------------------|---------------------------------------|
| 400    | Las credenciales no coinciden| Email no existe o contraseña inválida |
| 401    | No token provided            | No se proporcionó token de autorización|
| 500    | Error de autenticación       | Error interno del servidor            |

### Errores de Cambio de Contraseña

| Código | Mensaje                            | Descripción                            |
|--------|------------------------------------|-----------------------------------------|
| 400    | Usuario no encontrado              | El email no existe en la base de datos  |
| 400    | La contraseña actual es incorrecta | La contraseña proporcionada no coincide |
| 400    | El usuario está inactivo           | La cuenta de usuario está desactivada   |
| 400    | La nueva contraseña debe contener al menos un número | Validación de seguridad |
| 400    | La nueva contraseña debe contener al menos una letra mayúscula | Validación de seguridad |
| 400    | La nueva contraseña debe tener al menos 6 caracteres | Validación de longitud |
| 400    | La nueva contraseña no puede ser igual a la contraseña actual | Validación de seguridad |
| 500    | Error al cambiar contraseña        | Error interno del servidor             |

## Consideraciones de Seguridad

1. **Almacenamiento de Contraseñas**: Las contraseñas se almacenan utilizando bcrypt con un factor de trabajo de 10.
2. **Tokens JWT**: Los tokens tienen un tiempo de expiración.
3. **Blacklisted Tokens**: Los tokens utilizados para logout se agregan a una lista negra.
4. **Validaciones**: Se aplican validaciones estrictas para las contraseñas nuevas:
   - Mínimo 6 caracteres
   - Al menos 1 número
   - Al menos 1 letra mayúscula
5. **Protección contra Ataques**: Las respuestas de error no revelan si el email existe o no.

## Implementación en Frontend

### Ejemplo de Login (React + Fetch)

```javascript
const handleLogin = async (email, password, deviceId = null) => {
  try {
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ 
        email, 
        password,
        device_id: deviceId 
      })
    });
    
    const result = await response.json();
    
    if (response.ok) {
      const loginData = result.data[0];
      
      // Guardar token en localStorage
      localStorage.setItem('token', loginData.token);
      
      // Guardar información del usuario
      localStorage.setItem('user', JSON.stringify(loginData.user));
      
      // Verificar si debe cambiar la contraseña
      if (loginData.mustChangePassword || loginData.user.mustChangePassword) {
        // Redirigir a la página de cambio de contraseña
        navigate('/change-password', { 
          state: { email: loginData.user.email } 
        });
      } else {
        // Login normal, redirigir al dashboard
        navigate('/dashboard');
      }
    } else {
      // Manejo de errores
      setError(result.errors[0]?.msg || 'Error de autenticación');
    }
  } catch (error) {
    console.error('Error en login:', error);
    setError('Error de conexión');
  }
};
```

### Ejemplo de Cambio de Contraseña (React + Fetch)

```javascript
const ChangePasswordPage = () => {
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  const location = useLocation();
  const navigate = useNavigate();
  
  // Obtener el email del estado o del localStorage
  const email = location.state?.email || JSON.parse(localStorage.getItem('user'))?.email;
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    try {
      const response = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ email, oldPassword, newPassword })
      });
      
      const data = await response.json();
      
      if (response.ok) {
        setSuccess('¡Contraseña actualizada correctamente!');
        
        // Actualizar la información del usuario en localStorage
        const updatedUser = data.data[0].user;
        localStorage.setItem('user', JSON.stringify(updatedUser));
        
        // Redirigir después de 2 segundos
        setTimeout(() => navigate('/dashboard'), 2000);
      } else {
        setError(data.errors[0]?.msg || 'Error al cambiar la contraseña');
      }
    } catch (err) {
      setError('Error de conexión');
    }
  };
  
  // Renderizar formulario...
};
```

### Validaciones en Frontend

Es recomendable implementar las mismas validaciones en el frontend para mejorar la experiencia de usuario:

```javascript
const validatePassword = (password) => {
  const errors = [];
  
  if (password.length < 6) {
    errors.push('La contraseña debe tener al menos 6 caracteres');
  }
  
  if (!/[A-Z]/.test(password)) {
    errors.push('La contraseña debe contener al menos una letra mayúscula');
  }
  
  if (!/[0-9]/.test(password)) {
    errors.push('La contraseña debe contener al menos un número');
  }
  
  return errors;
};

// Uso en el formulario
const handlePasswordChange = (e) => {
  const newPwd = e.target.value;
  setNewPassword(newPwd);
  
  const errors = validatePassword(newPwd);
  if (errors.length > 0) {
    setPasswordErrors(errors);
  } else {
    setPasswordErrors([]);
  }
};
```

### Protección de Rutas

Es importante implementar un sistema de protección de rutas para evitar que los usuarios accedan a páginas restringidas:

```javascript
const ProtectedRoute = ({ children }) => {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('user'));
  const token = localStorage.getItem('token');
  
  useEffect(() => {
    // Si no hay token o usuario, redirigir a login
    if (!token || !user) {
      navigate('/login');
      return;
    }
    
    // Si debe cambiar contraseña, redirigir a esa página
    if (user.mustChangePassword) {
      navigate('/change-password', { state: { email: user.email } });
    }
  }, [navigate, user, token]);
  
  // Si tiene token y no debe cambiar contraseña, mostrar contenido
  if (token && user && !user.mustChangePassword) {
    return children;
  }
  
  // Mientras verifica, muestra un spinner o pantalla de carga
  return <LoadingSpinner />;
};

// Uso en rutas
function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/change-password" element={<ChangePasswordPage />} />
      <Route 
        path="/dashboard" 
        element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        } 
      />
      <Route path="*" element={<Navigate to="/login" />} />
    </Routes>
  );
}
```

## Casos de Prueba Recomendados

Para garantizar que la implementación funcione correctamente, se recomienda probar los siguientes escenarios:

### Flujo de Login Normal

1. Usuario con `mustChangePassword: false`
2. Credenciales correctas
3. **Resultado esperado**: Login exitoso, redirige al dashboard

### Flujo de Contraseña Temporal

1. Usuario con `mustChangePassword: true`
2. Credenciales correctas
3. **Resultado esperado**: Login exitoso, redirige a pantalla de cambio de contraseña

### Validaciones de Contraseña

1. Intentar cambiar a una contraseña sin números
2. Intentar cambiar a una contraseña sin mayúsculas
3. Intentar cambiar a una contraseña muy corta
4. Intentar cambiar a la misma contraseña actual
5. **Resultado esperado**: Errores de validación específicos

### Cambio de Contraseña Exitoso

1. Usuario con contraseña temporal
2. Envío de contraseña actual correcta
3. Nueva contraseña cumple requisitos
4. **Resultado esperado**: Cambio exitoso, `mustChangePassword` cambia a `false`

### Manejo de Errores

1. Credenciales incorrectas en login
2. Contraseña actual incorrecta al cambiar
3. Usuario no encontrado
4. **Resultado esperado**: Mensajes de error apropiados

## Troubleshooting

### Problema: El frontend no detecta `mustChangePassword`

**Solución**: Verificar que se está accediendo correctamente a la propiedad. La bandera puede estar tanto en el objeto principal de respuesta como dentro del objeto `user`:

```javascript
// Forma correcta de verificar
if (loginData.mustChangePassword || loginData.user.mustChangePassword) {
  // Redirigir a cambio de contraseña
}
```

### Problema: Error "La contraseña actual es incorrecta" aunque sea correcta

**Solución**: Verificar que no haya espacios adicionales en el campo de contraseña. El backend compara exactamente los valores sin recortar espacios.

### Problema: No se aplican las validaciones de contraseña

**Solución**: Las validaciones se ejecutan en el backend. Para una mejor experiencia, implementar las mismas validaciones en el frontend antes de enviar la solicitud.

### Problema: El token JWT es rechazado

**Solución**: Verificar que el token no haya expirado y que se esté enviando correctamente en el header:
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### Problema: Después de cambiar la contraseña, sigue apareciendo `mustChangePassword: true`

**Solución**: Asegurarse de actualizar la información del usuario en el almacenamiento local después de un cambio exitoso:

```javascript
const updatedUser = data.data[0].user;
localStorage.setItem('user', JSON.stringify(updatedUser));
```
---

Documento elaborado el 10 de abril de 2025 - Versión 1.0

