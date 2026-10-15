/* =====================================================================================
   js/supabase-config.js — Conexión a Supabase (se carga ANTES de data.js).
   Pega aquí los dos valores de Supabase → Project Settings → API:
     · Project URL
     · anon public key  (es pública por diseño; la seguridad la dan las políticas RLS)
   Mientras SUPABASE_URL esté vacío, la página sigue leyendo los CSV de Google Sheets.
   ===================================================================================== */
window.NEXO_SUPABASE = {
  url: "https://ifuyowsgjwervcavzzyw.supabase.co",
  anonKey: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlmdXlvd3NnandlcnZjYXZ6enl3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTE4NDYwODcsImV4cCI6MjEwNzQyMjA4N30.MsfPOu21fZxTPGyVA1o269ceelJW_S_FQNUM1YaX9yc",
  /* Subida de imágenes desde admin.html (solo se usa en el panel). Usa un "upload preset" SIN FIRMAR
     (Cloudinary → Settings → Upload → Upload presets → Signing mode: Unsigned). NUNCA pongas el API secret aquí. */
  cloudinary: { cloudName: "ojp6mrxi", uploadPreset: "NexoArtistico" }   // uploadPreset ej: "nexo_admin"
};