Pre-entrega 2 — Registro seguro de usuarios
Objetivo

Implementar POST /api/sessions/register: validación, normalización de email, hash de contraseña con bcrypt y persistencia en MongoDB, respetando la arquitectura en capas.
Qué entregar

Repositorio público de GitHub con el registro de usuarios funcionando sobre la base de la entrega anterior.
Criterios de aceptación

Modelo User

    Campos: first_name, last_name, email, password, role
    role con valor por defecto user; valores posibles: user, organizer, admin
    El rol no puede manipularse desde el body del registro público

Endpoint POST /api/sessions/register

    Valida presencia de first_name, last_name, emaily password
    Valida formato de email y longitud mínima de contraseña
    Normaliza el email (trim + lowercase) antes de guardar
    Rechaza el registro si el email ya existe
    Hashea la contraseña con bcrypt(lógica en un helper dentro de utils/)
    Guarda el usuario en MongoDB con Mongoose
    La respuesta no incluye la contraseña (ni en texto plano ni hasheada)

Arquitectura

    La lógica está distribuida en: ruta → controller → service → repository/DAO → modelo
    El helper de bcrypt está en utils/y es reutilizable

Repositorio

    .env.example actualizado; .envno subido
    README explica cómo probar el endpoint y qué campos espera

Casos a probar antes de entregar

    Registro exitoso
    Campos faltantes
    Email con formato inválido
    Email ya registrado
    Confirmar que la contraseña no está en texto plano en la base de datos
    Confirmar que la respuesta no devuelve la contraseña

🎯 Así se ve el entregable (para que sepas a qué apuntar)

1. Estructura (se suma sobre la de M1):

src/
├── models/User.js                    # first_name, last_name, email, password, role
├── routes/sessions.router.js
├── controllers/sessions.controller.js
├── services/sessions.service.js
├── repositories/users.repository.js
├── dao/users.dao.js
└── utils/hash.js                     # bcrypt reutilizable

2. Request/response de POST /api/sessions/register:

Request:

json

{ "first_name": "Ana", "last_name": "Pérez", "email": "Ana@Mail.com ", "password": "Secreta123" }

Response 201 (email normalizado, SIN password):

json

{ "status": "success", "payload": { "id": "665f2a...", "first_name": "Ana", "last_name": "Pérez", "email": "ana@mail.com", "role": "user" } }

Response 400 (campos faltantes o email inválido):

json

{ "status": "error", "message": "Faltan campos obligatorios" }

Response 409 (email ya registrado):

json

{ "status": "error", "message": "El email ya está registrado" }

3. Qué evidencia adjuntar:

    README con los campos que espera el endpoint y cómo probarlo.
    Recomendado: captura de MongoDB mostrando el usuario con la contraseña hasheada (no en texto plano), y captura de la respuesta del endpoint sin el campo password.

Cómo entregar

Link a repositorio público de GitHub con package.json, .gitignore, .env.exampley README incluidos.
Qué evitar

    Guardar la contraseña en texto plano (punto crítico de la entrega)
    Devolver passworden la respuesta, incluso hasheada
    Escribir la lógica de validación o hash directamente en la ruta
    Subir .env, node_moduleso credenciales

Implementar el primer flujo real de usuarios para la Plataforma de Eventos e Inscripciones, creando un registro seguro que permita guardar usuarios en la base de datos sin exponer información sensible.

Entregable
Registro seguro de usuarios

En esta pre entrega vas a implementar el primer flujo seguro de usuarios dentro de la Plataforma de Eventos e Inscripciones. Vas a crear o completar el modelo User, implementar el endpoint de registro, validar los datos recibidos, normalizar el email, evitar usuarios duplicados y proteger las contraseñas usando bcrypt. El objetivo principal es que el sistema pueda registrar usuarios de forma segura, sin guardar contraseñas en texto plano ni exponer datos sensibles en las respuestas. Esta entrega deja preparada la base para los próximos módulos, donde se incorporarán login, JWT, cookies, ruta current, Passport, roles y autorización.