import { useState } from 'react'
import { useAuth } from '../contexts/AuthContext'

export default function Login({ title = 'Acceso autorizado', subtitle = 'Ingresa con tu correo autorizado.' }) {
  const { login } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setIsLoading(true)
    try {
      await login(email, password)
    } catch (err) {
      const msg = err?.message || 'Error al iniciar sesión'
      setError(msg.includes('invalid-credential') ? 'Correo o contraseña incorrectos.' : msg)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="mx-auto w-full max-w-md rounded-3xl border border-beef-line bg-beef-card p-6">
      <h2 className="text-xl font-semibold">{title}</h2>
      <p className="mt-1 text-sm text-white/70">{subtitle}</p>

      <form onSubmit={handleSubmit} className="mt-5 space-y-4">
        <div>
          <label className="mb-1 block text-sm font-medium text-white/80">Correo</label>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-2xl border border-beef-line bg-black/20 px-4 py-3 text-sm text-white outline-none focus:border-beef-accent"
            placeholder="tu@correo.com"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-white/80">Contraseña</label>
          <input
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-2xl border border-beef-line bg-black/20 px-4 py-3 text-sm text-white outline-none focus:border-beef-accent"
            placeholder="••••••••"
          />
        </div>

        {error ? (
          <div className="rounded-2xl border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-200">
            {error}
          </div>
        ) : null}

        <button
          type="submit"
          disabled={isLoading}
          className="w-full rounded-2xl bg-beef-accent px-4 py-3 text-sm font-semibold text-black disabled:opacity-50"
        >
          {isLoading ? 'Ingresando...' : 'Ingresar'}
        </button>
      </form>
    </div>
  )
}
