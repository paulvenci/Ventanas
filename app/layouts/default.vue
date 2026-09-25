<template>
  <div class="layout-wrapper">
    <!-- Navbar Header -->
    <header v-if="user" class="app-header">
      <div class="navbar">
        <!-- Logo / Marca -->
        <NuxtLink to="/" class="nav-brand" @click="menuMovilAbierto = false">
          <img v-if="vidrieria?.logo_url" :src="vidrieria.logo_url" alt="Logo" class="nav-logo" />
          <div v-else class="nav-logo" style="display:flex; align-items:center; justify-content:center; font-size:13px; font-weight:bold; color:#94a3b8;">
            V
          </div>
          <span class="nav-brand-text">{{ vidrieria?.nombre || 'Ventanas SaaS' }}</span>
        </NuxtLink>

        <!-- Navegación de Escritorio (Desktop) -->
        <nav class="nav-links desktop-nav">
          <NuxtLink to="/" class="nav-link">Inicio</NuxtLink>
          <NuxtLink to="/presupuestos" class="nav-link">Presupuestos</NuxtLink>
          <NuxtLink to="/ordenes-trabajo" class="nav-link">Órdenes de Trabajo</NuxtLink>
          <NuxtLink to="/catalogos" class="nav-link">Catálogos</NuxtLink>
          <NuxtLink to="/configuracion" class="nav-link">Configuración</NuxtLink>
          <NuxtLink to="/usuarios" class="nav-link">Usuarios</NuxtLink>
        </nav>

        <!-- Usuario de Escritorio -->
        <div class="nav-user desktop-nav">
          <span class="user-email-text">{{ user.email }}</span>
          <button @click="cerrarSesion" class="btn btn-secondary btn-sm">Salir</button>
        </div>

        <!-- Botón Menú Hamburguesa (Mobile) -->
        <button
          type="button"
          class="mobile-menu-btn"
          @click="menuMovilAbierto = !menuMovilAbierto"
          :aria-expanded="menuMovilAbierto"
          aria-label="Menú principal"
        >
          <span v-if="!menuMovilAbierto" style="font-size: 1.35rem; line-height: 1;">☰</span>
          <span v-else style="font-size: 1.35rem; line-height: 1;">✕</span>
        </button>
      </div>

      <!-- Menú Desplegable Móvil -->
      <transition name="slide-fade">
        <div v-if="menuMovilAbierto" class="mobile-drawer">
          <div class="mobile-drawer-user">
            <div style="font-weight: 600; color: #f8fafc; font-size: 0.95rem;">{{ vidrieria?.nombre || 'Mi Taller' }}</div>
            <div style="font-size: 0.8rem; color: var(--text-muted); word-break: break-all;">{{ user.email }}</div>
          </div>

          <nav class="mobile-nav-links">
            <NuxtLink to="/" class="mobile-nav-link" @click="menuMovilAbierto = false">
              <span class="mobile-icon">🏠</span> Inicio
            </NuxtLink>
            <NuxtLink to="/presupuestos" class="mobile-nav-link" @click="menuMovilAbierto = false">
              <span class="mobile-icon">📋</span> Presupuestos Comerciales
            </NuxtLink>
            <NuxtLink to="/ordenes-trabajo" class="mobile-nav-link" @click="menuMovilAbierto = false">
              <span class="mobile-icon">🪚</span> Órdenes de Trabajo y Cortes
            </NuxtLink>
            <NuxtLink to="/catalogos" class="mobile-nav-link" @click="menuMovilAbierto = false">
              <span class="mobile-icon">📐</span> Catálogos y Fórmulas
            </NuxtLink>
            <NuxtLink to="/configuracion" class="mobile-nav-link" @click="menuMovilAbierto = false">
              <span class="mobile-icon">⚙️</span> Configuración del Taller
            </NuxtLink>
            <NuxtLink to="/usuarios" class="mobile-nav-link" @click="menuMovilAbierto = false">
              <span class="mobile-icon">👥</span> Usuarios del Equipo
            </NuxtLink>
          </nav>

          <div class="mobile-drawer-footer">
            <button @click="cerrarSesion" class="btn btn-secondary btn-block" style="justify-content: center;">
              Cerrar sesión
            </button>
          </div>
        </div>
      </transition>
    </header>

    <main class="main-content">
      <slot />
    </main>

    <!-- Barra de Navegación Inferior Móvil (Bottom Navigation Bar) -->
    <nav v-if="user" class="mobile-bottom-nav">
      <NuxtLink to="/" class="bottom-nav-item" @click="menuMovilAbierto = false">
        <span class="bottom-nav-icon">🏠</span>
        <span class="bottom-nav-label">Inicio</span>
      </NuxtLink>
      <NuxtLink to="/presupuestos" class="bottom-nav-item" @click="menuMovilAbierto = false">
        <span class="bottom-nav-icon">📋</span>
        <span class="bottom-nav-label">Presupuestos</span>
      </NuxtLink>
      <NuxtLink to="/ordenes-trabajo" class="bottom-nav-item" @click="menuMovilAbierto = false">
        <span class="bottom-nav-icon">🪚</span>
        <span class="bottom-nav-label">Taller</span>
      </NuxtLink>
      <NuxtLink to="/catalogos" class="bottom-nav-item" @click="menuMovilAbierto = false">
        <span class="bottom-nav-icon">📐</span>
        <span class="bottom-nav-label">Catálogos</span>
      </NuxtLink>
      <button type="button" class="bottom-nav-item bottom-nav-btn" @click="menuMovilAbierto = !menuMovilAbierto">
        <span class="bottom-nav-icon">{{ menuMovilAbierto ? '✕' : '☰' }}</span>
        <span class="bottom-nav-label">Menú</span>
      </button>
    </nav>
  </div>
</template>

<script setup lang="ts">
const user = useSupabaseUser()
const supabase = useSupabaseClient()
const { vidrieria, cargar } = useVidrieria()
const menuMovilAbierto = ref(false)

onMounted(async () => {
  if (user.value && !vidrieria.value) {
    await cargar()
  }
})

watch(user, async (nuevoUsuario) => {
  if (nuevoUsuario) {
    await cargar()
  } else {
    vidrieria.value = null
  }
})

async function cerrarSesion() {
  menuMovilAbierto.value = false
  await supabase.auth.signOut()
  await navigateTo('/login')
}
</script>

<style scoped>
.layout-wrapper {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  overflow-x: clip;
}

.main-content {
  flex: 1;
  min-width: 0;
}

/* Header & Navbar */
.app-header {
  background: #172033;
  border-bottom: 1px solid var(--border-color);
  padding: 0.65rem 1rem;
  position: sticky;
  top: 0;
  z-index: 100;
}

.navbar {
  max-width: 1200px;
  margin: 0 auto;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.nav-brand {
  display: flex;
  align-items: center;
  gap: 0.65rem;
  font-weight: 700;
  color: var(--text-main);
  font-size: 1.05rem;
  text-decoration: none;
  min-width: 0;
}

.nav-brand-text {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 200px;
}

.nav-logo {
  width: 34px;
  height: 34px;
  border-radius: var(--radius-sm);
  object-fit: cover;
  background: #334155;
  border: 1px solid var(--border-color);
  flex-shrink: 0;
}

/* Mobile First Navigation */
.desktop-nav {
  display: none !important;
}

.nav-links {
  align-items: center;
  gap: 0.75rem;
}

.nav-link {
  color: var(--text-muted);
  font-size: 0.9rem;
  font-weight: 500;
  padding: 0.4rem 0.65rem;
  border-radius: var(--radius-sm);
  transition: all 0.15s ease;
}

.nav-link:hover, .nav-link.router-link-active {
  color: #f8fafc;
  background-color: var(--bg-surface-hover);
}

.nav-user {
  align-items: center;
  gap: 0.75rem;
}

.user-email-text {
  font-size: 0.825rem;
  color: var(--text-muted);
  max-width: 160px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* Mobile Button */
.mobile-menu-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  background: transparent;
  border: 1px solid var(--border-color);
  color: var(--text-main);
  padding: 0.4rem 0.6rem;
  border-radius: var(--radius-sm);
  cursor: pointer;
}

.mobile-menu-btn:hover {
  background: rgba(255, 255, 255, 0.05);
}

/* Mobile Drawer */
.mobile-drawer {
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  background: #111827;
  border-bottom: 2px solid var(--border-color);
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.6);
  padding: 1rem 1.25rem 1.25rem 1.25rem;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.mobile-drawer-user {
  padding-bottom: 0.75rem;
  border-bottom: 1px solid var(--border-color);
}

.mobile-nav-links {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
}

.mobile-nav-link {
  display: flex;
  align-items: center;
  gap: 0.65rem;
  padding: 0.75rem 0.85rem;
  border-radius: var(--radius-sm);
  color: var(--text-main);
  font-size: 0.95rem;
  font-weight: 500;
  text-decoration: none;
  background: rgba(255, 255, 255, 0.02);
}

.mobile-nav-link:hover, .mobile-nav-link.router-link-active {
  background: var(--bg-surface-hover);
  color: #38bdf8;
}

.mobile-icon {
  font-size: 1.1rem;
}

.mobile-drawer-footer {
  padding-top: 0.5rem;
}

/* Slide animation */
.slide-fade-enter-active,
.slide-fade-leave-active {
  transition: all 0.2s ease-out;
}

.slide-fade-enter-from,
.slide-fade-leave-to {
  transform: translateY(-10px);
  opacity: 0;
}

/* Mobile Bottom Navigation Bar */
.mobile-bottom-nav {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  height: 58px;
  background: rgba(17, 24, 39, 0.94);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border-top: 1px solid var(--border-color);
  display: flex;
  align-items: stretch;
  justify-content: space-around;
  z-index: 99;
  padding-bottom: env(safe-area-inset-bottom, 0px);
}

.bottom-nav-item {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 2px;
  color: var(--text-muted);
  text-decoration: none;
  font-size: 0.7rem;
  font-weight: 500;
  transition: color 0.15s ease;
  user-select: none;
}

.bottom-nav-btn {
  background: transparent;
  border: none;
  cursor: pointer;
  padding: 0;
}

.bottom-nav-icon {
  font-size: 1.2rem;
  line-height: 1;
}

.bottom-nav-item:hover,
.bottom-nav-item.router-link-active {
  color: #38bdf8;
}

/* Espacio en el contenedor para la barra móvil */
@media (max-width: 899px) {
  .main-content {
    padding-bottom: 4.5rem;
  }
}

/* Breakpoint Desktop */
@media (min-width: 900px) {
  .app-header {
    padding: 0.75rem 1.5rem;
  }

  .desktop-nav {
    display: flex !important;
  }

  .mobile-menu-btn {
    display: none !important;
  }

  .mobile-bottom-nav {
    display: none !important;
  }

  .nav-brand-text {
    max-width: 280px;
  }
}
</style>
