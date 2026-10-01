import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react"
import type { Session, User } from "@supabase/supabase-js"
import { supabase } from "./supabase"

export interface AuthContextType {
  user: User | null
  session: Session | null
  loading: boolean
  isPasswordRecovery: boolean
  clearPasswordRecovery: () => void
  signInWithPassword: (
    email: string,
    password: string,
  ) => Promise<{ error: Error | null }>
  signUp: (
    email: string,
    password: string,
    fullName?: string,
  ) => Promise<{ error: Error | null; data: { user: User | null; session: Session | null } | null }>
  signOut: () => Promise<{ error: Error | null }>
  resetPasswordForEmail: (email: string) => Promise<{ error: Error | null }>
  updatePassword: (newPassword: string) => Promise<{ error: Error | null }>
  resendVerificationEmail: (email: string) => Promise<{ error: Error | null }>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)
  const [isPasswordRecovery, setIsPasswordRecovery] = useState(false)

  useEffect(() => {
    // Check active session on mount
    supabase.auth
      .getSession()
      .then(({ data: { session }, error }) => {
        if (!error && session) {
          setSession(session)
          setUser(session.user)
        }
      })
      .catch((err) => {
        console.error("Error getting Supabase session:", err)
      })
      .finally(() => {
        setLoading(false)
      })

    // Listen for auth state changes (sign in, sign out, password recovery, token refresh)
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      setSession(session)
      setUser(session?.user ?? null)
      setLoading(false)

      if (event === "PASSWORD_RECOVERY") {
        setIsPasswordRecovery(true)
      } else if (event === "SIGNED_IN") {
        // Clear password recovery flag on normal sign in
        if (!window.location.hash.includes("type=recovery")) {
          setIsPasswordRecovery(false)
        }
      } else if (event === "SIGNED_OUT") {
        setIsPasswordRecovery(false)
      }
    })

    // Check if URL hash indicates recovery
    if (
      typeof window !== "undefined" &&
      window.location.hash.includes("type=recovery")
    ) {
      setIsPasswordRecovery(true)
    }

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  const signInWithPassword = async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      })
      return { error: error ? new Error(error.message) : null }
    } catch (err: any) {
      return { error: new Error(err.message || "Failed to sign in") }
    }
  }

  const signUp = async (email: string, password: string, fullName?: string) => {
    try {
      const trimmedEmail = email.trim()
      const trimmedName = fullName?.trim() || ""
      const { data, error } = await supabase.auth.signUp({
        email: trimmedEmail,
        password,
        options: {
          data: {
            full_name: trimmedName,
            display_name: trimmedName,
          },
          emailRedirectTo: typeof window !== "undefined" ? window.location.origin : undefined,
        },
      })
      return {
        data: data ? { user: data.user, session: data.session } : null,
        error: error ? new Error(error.message) : null,
      }
    } catch (err: any) {
      return { data: null, error: new Error(err.message || "Failed to sign up") }
    }
  }

  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut()
      return { error: error ? new Error(error.message) : null }
    } catch (err: any) {
      return { error: new Error(err.message || "Failed to sign out") }
    }
  }

  const resetPasswordForEmail = async (email: string) => {
    try {
      const trimmedEmail = email.trim()
      const redirectTo =
        typeof window !== "undefined"
          ? `${window.location.origin}`
          : undefined
      const { error } = await supabase.auth.resetPasswordForEmail(trimmedEmail, {
        redirectTo,
      })
      return { error: error ? new Error(error.message) : null }
    } catch (err: any) {
      return {
        error: new Error(err.message || "Failed to send password reset email"),
      }
    }
  }

  const updatePassword = async (newPassword: string) => {
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      })
      if (!error) {
        setIsPasswordRecovery(false)
        if (typeof window !== "undefined" && window.location.hash) {
          window.history.replaceState(null, "", window.location.pathname)
        }
      }
      return { error: error ? new Error(error.message) : null }
    } catch (err: any) {
      return { error: new Error(err.message || "Failed to update password") }
    }
  }

  const resendVerificationEmail = async (email: string) => {
    try {
      const trimmedEmail = email.trim()
      const { error } = await supabase.auth.resend({
        type: "signup",
        email: trimmedEmail,
        options: {
          emailRedirectTo: typeof window !== "undefined" ? window.location.origin : undefined,
        },
      })
      return { error: error ? new Error(error.message) : null }
    } catch (err: any) {
      return {
        error: new Error(err.message || "Failed to resend verification email"),
      }
    }
  }

  const clearPasswordRecovery = () => {
    setIsPasswordRecovery(false)
    if (typeof window !== "undefined" && window.location.hash) {
      window.history.replaceState(null, "", window.location.pathname)
    }
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        loading,
        isPasswordRecovery,
        clearPasswordRecovery,
        signInWithPassword,
        signUp,
        signOut,
        resetPasswordForEmail,
        updatePassword,
        resendVerificationEmail,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
