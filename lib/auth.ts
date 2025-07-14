import NextAuth from "next-auth"
import Credentials from "next-auth/providers/credentials"

async function getUserFromEndpoint(credentials: Partial<Record<"email" | "password", unknown>>) {
  if (!credentials?.email || !credentials?.password) return null

  try {
    const res = await fetch('https://themis-100166227581.europe-west1.run.app/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: credentials.email,
        password: credentials.password,
      }),
    })

    if (!res.ok) return null

    const user = await res.json()

    return {
      id: user.id.toString(),
      name: `${user.firstName} ${user.lastName}`,
      email: user.email,
      role: user.role,
    }
  } catch (error) {
    console.error("Auth error:", error)
    return null
  }
}

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    Credentials({
      credentials: {
        email: {},
        password: {},
      },
      authorize: getUserFromEndpoint,
    }),
  ],
})
