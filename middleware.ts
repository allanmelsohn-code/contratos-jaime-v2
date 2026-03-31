import { createServerClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  let response = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return request.cookies.getAll() },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          response = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()

  // ── Rota pública: /login ──────────────────────────────
  if (pathname === '/login') {
    if (user) {
      // Já autenticado → redireciona para o destino certo
      const { data: papUser } = await supabase
        .from('papaia_users')
        .select('role, tenant:papaia_tenants(slug)')
        .eq('id', user.id)
        .single()

      if (papUser?.role === 'superadmin') {
        return NextResponse.redirect(new URL('/admin', request.url))
      }
      const slug = (papUser?.tenant as any)?.slug
      if (slug) {
        return NextResponse.redirect(new URL(`/${slug}`, request.url))
      }
    }
    return response
  }

  // ── Rota raiz → login ─────────────────────────────────
  if (pathname === '/') {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  // ── Todas as outras rotas exigem autenticação ─────────
  if (!user) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  // ── Rotas /admin → apenas superadmin ──────────────────
  if (pathname.startsWith('/admin')) {
    const { data: papUser } = await supabase
      .from('papaia_users')
      .select('role')
      .eq('id', user.id)
      .single()

    if (papUser?.role !== 'superadmin') {
      return NextResponse.redirect(new URL('/login', request.url))
    }
    return response
  }

  // ── Rotas /[tenant] → usuário deve pertencer ao tenant ─
  const tenantSlug = pathname.split('/')[1]
  if (tenantSlug && !['api', '_next', 'favicon.ico', 'logos', 'public'].includes(tenantSlug)) {
    const { data: papUser } = await supabase
      .from('papaia_users')
      .select('role, tenant:papaia_tenants(slug)')
      .eq('id', user.id)
      .single()

    const userSlug = (papUser?.tenant as any)?.slug
    // Superadmin pode ver qualquer tenant
    if (papUser?.role === 'superadmin') return response
    // Usuário não pertence a este tenant
    if (userSlug && userSlug !== tenantSlug) {
      return NextResponse.redirect(new URL(`/${userSlug}`, request.url))
    }
  }

  return response
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|logos).*)'],
}
