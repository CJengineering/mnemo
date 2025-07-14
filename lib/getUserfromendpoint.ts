

type User = {
  id: number
  firstName: string
  lastName: string
  email: string
  role: string
}

export async function getUserFromEndpoint(email:string, passwd:string): Promise<User | null> {
  if (!email || !passwd) return null

  try {
    const res = await fetch('https://themis-100166227581.europe-west1.run.app/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: email,
        password: passwd,
      }),
    })

    if (!res.ok) return null

    const user = await res.json()
    return user
  } catch (err) {
    console.error('Login failed:', err)
    return null
  }
}
