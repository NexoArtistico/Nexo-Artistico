# Nexo dinámico — puesta en marcha (Supabase)

1. Crea un proyecto en https://supabase.com (plan gratuito sirve).
2. SQL Editor → pega y ejecuta `supabase/01_esquema.sql` (tablas + seguridad RLS).
3. SQL Editor → pega y ejecuta `supabase/02_datos.sql` (carga tu contenido actual del Excel).
4. Authentication → Users → "Add user" → crea tu correo y contraseña (marca "Auto confirm").
5. Authentication → Providers → Email → desactiva "Allow new users to sign up" (nadie más podrá registrarse).
6. SQL Editor → hazte admin (cambia el correo por el tuyo):
   insert into public.admins (user_id) select id from auth.users where email = 'TU_CORREO';
7. Project Settings → API → copia "Project URL" y "anon public key" dentro de `js/supabase-config.js`.
8. Sube todo a Netlify. Edita en `/admin.html`. Los cambios se ven al recargar la página.

Mientras `js/supabase-config.js` esté vacío, `index.html` sigue leyendo Google Sheets (respaldo).
Nunca pongas la `service_role key` en ningún archivo del sitio.

## Subir imágenes desde el panel (Cloudinary)
1. Cloudinary → Settings → Upload → Upload presets → Add upload preset.
2. Signing mode: **Unsigned**. Asset folder: `nexo` (opcional). En "Upload control" limita formatos a jpg, png, webp, gif y el tamaño máximo.
3. Copia el nombre del preset a `js/supabase-config.js` → `cloudinary.uploadPreset`. El `cloudName` ya es `ojp6mrxi`.
4. En el panel, cada campo de imagen tiene el botón "Subir imagen": sube a Cloudinary y en la base de datos solo se guarda el enlace.
