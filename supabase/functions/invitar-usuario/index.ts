import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY') ?? ''

    // 1. Validar autorización del usuario llamador
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Falta cabecera de autorización' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const clientWithAuth = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    })

    const { data: { user }, error: userError } = await clientWithAuth.auth.getUser()
    if (userError || !user) {
      return new Response(JSON.stringify({ error: 'No autorizado' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const { correo, nombre, vidrieria_id } = await req.json()

    if (!correo || !vidrieria_id) {
      return new Response(JSON.stringify({ error: 'Faltan parámetros requeridos (correo, vidrieria_id)' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // 2. Usar cliente admin con service_role
    const adminClient = createClient(supabaseUrl, supabaseServiceKey)

    // Validar que el llamador sea un usuario activo de esa vidriería
    const { data: usuarioLlamador, error: errorPerfil } = await adminClient
      .from('usuarios')
      .select('id, vidrieria_id, activo')
      .eq('auth_uid', user.id)
      .eq('vidrieria_id', vidrieria_id)
      .eq('activo', true)
      .maybeSingle()

    if (errorPerfil || !usuarioLlamador) {
      return new Response(JSON.stringify({ error: 'El usuario no tiene permisos para invitar en esta vidriería' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // 3. Enviar invitación por email mediante admin API
    const redirectUrl = `https://paulvenci.github.io/Ventanas/#/confirm?vidrieria_id=${vidrieria_id}`

    const { data: inviteData, error: inviteError } = await adminClient.auth.admin.inviteUserByEmail(correo, {
      redirectTo: redirectUrl,
      data: {
        vidrieria_id,
        nombre: nombre || correo,
      },
    })

    if (inviteError) {
      return new Response(JSON.stringify({ error: inviteError.message }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    return new Response(JSON.stringify({ ok: true, data: inviteData }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
