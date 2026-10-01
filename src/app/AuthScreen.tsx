import { useState, type FormEvent } from "react"
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Eye,
  EyeOff,
  Heart,
  KeyRound,
  Leaf,
  Loader2,
  Lock,
  Mail,
  Pill,
  RefreshCw,
  ShieldCheck,
  Sparkles,
  User as UserIcon,
} from "lucide-react"
import { useAuth } from "../lib/AuthContext"

type AuthMode = "signin" | "signup" | "forgot" | "verify" | "reset"

export default function AuthScreen({
  initialMode = "signin",
}: {
  initialMode?: AuthMode
}) {
  const {
    signInWithPassword,
    signUp,
    resetPasswordForEmail,
    updatePassword,
    resendVerificationEmail,
    isPasswordRecovery,
    clearPasswordRecovery,
  } = useAuth()

  const [mode, setMode] = useState<AuthMode>(
    isPasswordRecovery ? "reset" : initialMode,
  )

  // Form states
  const [fullName, setFullName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  // Feedback states
  const [loading, setLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState("")
  const [successMessage, setSuccessMessage] = useState("")
  const [resendCooldown, setResendCooldown] = useState(0)

  // Cooldown helper for resending verification
  const startResendCooldown = () => {
    setResendCooldown(60)
    const interval = setInterval(() => {
      setResendCooldown((prev) => {
        if (prev <= 1) {
          clearInterval(interval)
          return 0
        }
        return prev - 1
      })
    }, 1000)
  }

  // Handle Sign In
  const handleSignIn = async (e: FormEvent) => {
    e.preventDefault()
    setErrorMessage("")
    setSuccessMessage("")

    if (!email.trim() || !password) {
      setErrorMessage("Please enter both your email and password.")
      return
    }

    setLoading(true)
    const { error } = await signInWithPassword(email, password)
    setLoading(false)

    if (error) {
      // Format friendly error messages
      if (
        error.message.toLowerCase().includes("invalid login credentials") ||
        error.message.toLowerCase().includes("invalid_grant")
      ) {
        setErrorMessage("Invalid email or password. Please double check and try again.")
      } else if (error.message.toLowerCase().includes("email not confirmed")) {
        setErrorMessage("Your email address has not been confirmed yet.")
        setMode("verify")
      } else {
        setErrorMessage(error.message)
      }
    }
  }

  // Handle Sign Up
  const handleSignUp = async (e: FormEvent) => {
    e.preventDefault()
    setErrorMessage("")
    setSuccessMessage("")

    if (!email.trim() || !password) {
      setErrorMessage("Please fill in all required fields.")
      return
    }

    if (password.length < 6) {
      setErrorMessage("Password must be at least 6 characters long.")
      return
    }

    if (password !== confirmPassword) {
      setErrorMessage("Passwords do not match. Please re-enter them.")
      return
    }

    setLoading(true)
    const { data, error } = await signUp(email, password, fullName)
    setLoading(false)

    if (error) {
      if (error.message.toLowerCase().includes("user already registered")) {
        setErrorMessage("An account with this email already exists. Try signing in instead.")
      } else {
        setErrorMessage(error.message)
      }
    } else if (data?.user && !data.session) {
      // Email confirmation is required by Supabase
      setMode("verify")
      setSuccessMessage(
        "Account created! We have sent a confirmation link to your email.",
      )
      startResendCooldown()
    } else if (data?.session) {
      // Auto logged in
      setSuccessMessage("Account created successfully! Welcome to Dosewell.")
    }
  }

  // Handle Forgot Password
  const handleForgotPassword = async (e: FormEvent) => {
    e.preventDefault()
    setErrorMessage("")
    setSuccessMessage("")

    if (!email.trim()) {
      setErrorMessage("Please enter your registered email address.")
      return
    }

    setLoading(true)
    const { error } = await resetPasswordForEmail(email)
    setLoading(false)

    if (error) {
      setErrorMessage(error.message)
    } else {
      setSuccessMessage(
        "Password reset instructions have been sent to your email address.",
      )
    }
  }

  // Handle Password Update (Reset flow)
  const handleUpdatePassword = async (e: FormEvent) => {
    e.preventDefault()
    setErrorMessage("")
    setSuccessMessage("")

    if (password.length < 6) {
      setErrorMessage("New password must be at least 6 characters long.")
      return
    }

    if (password !== confirmPassword) {
      setErrorMessage("Passwords do not match. Please re-enter them.")
      return
    }

    setLoading(true)
    const { error } = await updatePassword(password)
    setLoading(false)

    if (error) {
      setErrorMessage(error.message)
    } else {
      setSuccessMessage("Your password has been updated successfully!")
      setTimeout(() => {
        clearPasswordRecovery()
        setMode("signin")
      }, 1500)
    }
  }

  // Handle Resend Verification Email
  const handleResendVerification = async () => {
    if (resendCooldown > 0 || !email.trim()) return
    setErrorMessage("")
    setSuccessMessage("")
    setLoading(true)

    const { error } = await resendVerificationEmail(email)
    setLoading(false)

    if (error) {
      setErrorMessage(error.message)
    } else {
      setSuccessMessage("A fresh verification email has been sent.")
      startResendCooldown()
    }
  }

  return (
    <div className="min-h-screen bg-[#f4f7f5] text-[#223830] flex flex-col justify-between selection:bg-[#d5e9d6] selection:text-[#184936]">
      {/* Decorative background blur accents */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden -z-10">
        <div className="absolute -top-32 -left-32 w-96 h-96 rounded-full bg-[#d5e9d6]/50 blur-3xl" />
        <div className="absolute top-1/3 -right-32 w-96 h-96 rounded-full bg-[#edf3ef]/80 blur-3xl" />
        <div className="absolute -bottom-32 left-1/3 w-96 h-96 rounded-full bg-[#e5efe8]/60 blur-3xl" />
      </div>

      {/* Top Header */}
      <header className="px-6 py-6 sm:px-12 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <span className="flex h-10 w-10 rotate-[-15deg] items-center justify-center rounded-xl bg-[#184936] text-[#d5e9d6] shadow-md shadow-[#184936]/10">
            <Pill size={24} strokeWidth={2.4} />
          </span>
          <span className="font-display text-[26px] font-extrabold tracking-[-0.8px] text-[#184936]">
            dosewell<span className="text-[#3b8260]">.</span>
          </span>
        </div>
        <div className="hidden sm:flex items-center gap-2 text-xs font-semibold tracking-wider text-[#527964] uppercase bg-[#e9f2eb] px-3 py-1.5 rounded-full border border-[#d2e3d6]">
          <ShieldCheck size={14} className="text-[#2a6d4d]" />
          Secure Supabase Auth
        </div>
      </header>

      {/* Main Content Card Container */}
      <main className="flex-1 flex items-center justify-center px-4 py-8 sm:px-6">
        <div className="w-full max-w-[460px]">
          {/* Card */}
          <div className="rounded-3xl border border-[#dbe6df] bg-white/95 p-7 sm:p-9 shadow-xl shadow-[#184936]/5 backdrop-blur-sm transition-all duration-200">
            {/* Header inside card */}
            <div className="text-center mb-8">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#edf5ef] text-[#24533f] text-xs font-semibold tracking-widest uppercase mb-3">
                <Leaf size={13} className="text-[#458b66]" />
                Your Health, Organized
              </span>
              <h1 className="font-display text-2xl sm:text-[28px] font-bold text-[#184936] tracking-tight">
                {mode === "signin" && "Welcome back"}
                {mode === "signup" && "Create your workspace"}
                {mode === "forgot" && "Reset your password"}
                {mode === "verify" && "Verify your email"}
                {mode === "reset" && "Set new password"}
              </h1>
              <p className="mt-2 text-sm text-[#62756a] leading-relaxed">
                {mode === "signin" &&
                  "Sign in to manage your prescriptions, routines, and voice companion."}
                {mode === "signup" &&
                  "Set up your private prescription schedule and daily dose tracker."}
                {mode === "forgot" &&
                  "Enter your email and we'll send you instructions to reset your password."}
                {mode === "verify" &&
                  "Check your inbox to complete your account activation."}
                {mode === "reset" &&
                  "Choose a secure new password for your Dosewell account."}
              </p>
            </div>

            {/* Error Message Box */}
            {errorMessage && (
              <div
                role="alert"
                className="mb-6 flex items-start gap-3 rounded-xl border border-rose-200 bg-rose-50/90 p-4 text-xs font-medium leading-5 text-rose-900 animate-in fade-in duration-150"
              >
                <AlertCircle size={17} className="mt-0.5 shrink-0 text-rose-600" />
                <div className="flex-1">{errorMessage}</div>
              </div>
            )}

            {/* Success Message Box */}
            {successMessage && (
              <div
                role="status"
                className="mb-6 flex items-start gap-3 rounded-xl border border-emerald-200 bg-emerald-50/90 p-4 text-xs font-medium leading-5 text-emerald-900 animate-in fade-in duration-150"
              >
                <CheckCircle2 size={17} className="mt-0.5 shrink-0 text-emerald-600" />
                <div className="flex-1">{successMessage}</div>
              </div>
            )}

            {/* Mode Switcher Tabs for Sign In / Sign Up */}
            {(mode === "signin" || mode === "signup") && (
              <div className="mb-7 grid grid-cols-2 gap-1 rounded-xl bg-[#edf3ef] p-1 text-xs font-semibold">
                <button
                  type="button"
                  onClick={() => {
                    setMode("signin")
                    setErrorMessage("")
                    setSuccessMessage("")
                  }}
                  className={`rounded-lg py-2.5 transition-all duration-150 ${
                    mode === "signin"
                      ? "bg-white text-[#184936] shadow-sm font-bold"
                      : "text-[#586e62] hover:text-[#184936]"
                  }`}
                >
                  Sign in
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setMode("signup")
                    setErrorMessage("")
                    setSuccessMessage("")
                  }}
                  className={`rounded-lg py-2.5 transition-all duration-150 ${
                    mode === "signup"
                      ? "bg-white text-[#184936] shadow-sm font-bold"
                      : "text-[#586e62] hover:text-[#184936]"
                  }`}
                >
                  Create account
                </button>
              </div>
            )}

            {/* 1. SIGN IN FORM */}
            {mode === "signin" && (
              <form onSubmit={handleSignIn} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-[#244837] mb-1.5">
                    Email address
                  </label>
                  <div className="relative">
                    <Mail
                      size={17}
                      className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#7f9488]"
                    />
                    <input
                      type="email"
                      required
                      autoComplete="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="name@example.com"
                      className="w-full rounded-xl border border-[#d6e0d9] bg-[#fafcfb] pl-10 pr-4 py-3 text-sm text-[#18392a] placeholder:text-[#9bb0a4] focus:border-[#276a4d] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#276a4d]/20 transition-all"
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-xs font-semibold text-[#244837]">
                      Password
                    </label>
                    <button
                      type="button"
                      onClick={() => {
                        setMode("forgot")
                        setErrorMessage("")
                        setSuccessMessage("")
                      }}
                      className="text-xs font-semibold text-[#2a6d4e] hover:underline"
                    >
                      Forgot password?
                    </button>
                  </div>
                  <div className="relative">
                    <Lock
                      size={17}
                      className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#7f9488]"
                    />
                    <input
                      type={showPassword ? "text" : "password"}
                      required
                      autoComplete="current-password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full rounded-xl border border-[#d6e0d9] bg-[#fafcfb] pl-10 pr-11 py-3 text-sm text-[#18392a] placeholder:text-[#9bb0a4] focus:border-[#276a4d] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#276a4d]/20 transition-all"
                    />
                    <button
                      type="button"
                      aria-label={showPassword ? "Hide password" : "Show password"}
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#7f9488] hover:text-[#244837]"
                    >
                      {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full mt-2 inline-flex items-center justify-center gap-2 rounded-xl bg-[#184936] py-3.5 px-4 text-sm font-semibold text-white shadow-md shadow-[#184936]/15 hover:bg-[#235c46] active:scale-[0.99] disabled:opacity-70 disabled:cursor-not-allowed transition-all"
                >
                  {loading ? (
                    <>
                      <Loader2 size={18} className="animate-spin" />
                      <span>Signing in...</span>
                    </>
                  ) : (
                    <>
                      <span>Sign in to Dosewell</span>
                      <ArrowRight size={17} />
                    </>
                  )}
                </button>
              </form>
            )}

            {/* 2. SIGN UP FORM */}
            {mode === "signup" && (
              <form onSubmit={handleSignUp} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-[#244837] mb-1.5">
                    Your full name
                  </label>
                  <div className="relative">
                    <UserIcon
                      size={17}
                      className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#7f9488]"
                    />
                    <input
                      type="text"
                      required
                      autoComplete="name"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="e.g. Jamie Davis"
                      className="w-full rounded-xl border border-[#d6e0d9] bg-[#fafcfb] pl-10 pr-4 py-3 text-sm text-[#18392a] placeholder:text-[#9bb0a4] focus:border-[#276a4d] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#276a4d]/20 transition-all"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#244837] mb-1.5">
                    Email address
                  </label>
                  <div className="relative">
                    <Mail
                      size={17}
                      className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#7f9488]"
                    />
                    <input
                      type="email"
                      required
                      autoComplete="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="name@example.com"
                      className="w-full rounded-xl border border-[#d6e0d9] bg-[#fafcfb] pl-10 pr-4 py-3 text-sm text-[#18392a] placeholder:text-[#9bb0a4] focus:border-[#276a4d] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#276a4d]/20 transition-all"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#244837] mb-1.5">
                    Password (at least 6 characters)
                  </label>
                  <div className="relative">
                    <Lock
                      size={17}
                      className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#7f9488]"
                    />
                    <input
                      type={showPassword ? "text" : "password"}
                      required
                      minLength={6}
                      autoComplete="new-password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Create password"
                      className="w-full rounded-xl border border-[#d6e0d9] bg-[#fafcfb] pl-10 pr-11 py-3 text-sm text-[#18392a] placeholder:text-[#9bb0a4] focus:border-[#276a4d] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#276a4d]/20 transition-all"
                    />
                    <button
                      type="button"
                      aria-label={showPassword ? "Hide password" : "Show password"}
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#7f9488] hover:text-[#244837]"
                    >
                      {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#244837] mb-1.5">
                    Confirm password
                  </label>
                  <div className="relative">
                    <Lock
                      size={17}
                      className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#7f9488]"
                    />
                    <input
                      type={showConfirmPassword ? "text" : "password"}
                      required
                      minLength={6}
                      autoComplete="new-password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Repeat password"
                      className="w-full rounded-xl border border-[#d6e0d9] bg-[#fafcfb] pl-10 pr-11 py-3 text-sm text-[#18392a] placeholder:text-[#9bb0a4] focus:border-[#276a4d] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#276a4d]/20 transition-all"
                    />
                    <button
                      type="button"
                      aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#7f9488] hover:text-[#244837]"
                    >
                      {showConfirmPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full mt-2 inline-flex items-center justify-center gap-2 rounded-xl bg-[#184936] py-3.5 px-4 text-sm font-semibold text-white shadow-md shadow-[#184936]/15 hover:bg-[#235c46] active:scale-[0.99] disabled:opacity-70 disabled:cursor-not-allowed transition-all"
                >
                  {loading ? (
                    <>
                      <Loader2 size={18} className="animate-spin" />
                      <span>Creating account...</span>
                    </>
                  ) : (
                    <>
                      <span>Create Dosewell account</span>
                      <ArrowRight size={17} />
                    </>
                  )}
                </button>
              </form>
            )}

            {/* 3. FORGOT PASSWORD FORM */}
            {mode === "forgot" && (
              <form onSubmit={handleForgotPassword} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-[#244837] mb-1.5">
                    Account email address
                  </label>
                  <div className="relative">
                    <Mail
                      size={17}
                      className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#7f9488]"
                    />
                    <input
                      type="email"
                      required
                      autoComplete="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="name@example.com"
                      className="w-full rounded-xl border border-[#d6e0d9] bg-[#fafcfb] pl-10 pr-4 py-3 text-sm text-[#18392a] placeholder:text-[#9bb0a4] focus:border-[#276a4d] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#276a4d]/20 transition-all"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full mt-2 inline-flex items-center justify-center gap-2 rounded-xl bg-[#184936] py-3.5 px-4 text-sm font-semibold text-white shadow-md shadow-[#184936]/15 hover:bg-[#235c46] active:scale-[0.99] disabled:opacity-70 disabled:cursor-not-allowed transition-all"
                >
                  {loading ? (
                    <>
                      <Loader2 size={18} className="animate-spin" />
                      <span>Sending reset email...</span>
                    </>
                  ) : (
                    <>
                      <span>Send reset link</span>
                      <ArrowRight size={17} />
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setMode("signin")
                    setErrorMessage("")
                    setSuccessMessage("")
                  }}
                  className="w-full flex items-center justify-center gap-2 text-xs font-semibold text-[#446554] hover:text-[#184936] pt-2"
                >
                  <ArrowLeft size={14} />
                  Back to Sign In
                </button>
              </form>
            )}

            {/* 4. EMAIL VERIFICATION NOTICE SCREEN */}
            {mode === "verify" && (
              <div className="space-y-5 text-center">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-[#edf5ef] text-[#184936] border border-[#cfe2d4]">
                  <Mail size={32} />
                </div>
                <div className="space-y-2">
                  <p className="text-sm font-semibold text-[#184936]">
                    Confirmation link sent to:
                  </p>
                  <p className="text-sm font-mono bg-[#f2f7f3] py-2 px-3 rounded-lg text-[#25523d] border border-[#d8e7dc] break-all">
                    {email || "your email address"}
                  </p>
                  <p className="text-xs leading-relaxed text-[#62756a] pt-1">
                    Please open your email client, click the verification link,
                    and then return here to sign in to your workspace.
                  </p>
                </div>

                <div className="pt-2 space-y-3">
                  <button
                    type="button"
                    onClick={handleResendVerification}
                    disabled={loading || resendCooldown > 0}
                    className="w-full inline-flex items-center justify-center gap-2 rounded-xl border border-[#c8d9cc] bg-white py-3 px-4 text-xs font-semibold text-[#1f4e3b] hover:bg-[#f5f8f6] disabled:opacity-60 disabled:cursor-not-allowed transition-all"
                  >
                    {loading ? (
                      <Loader2 size={15} className="animate-spin" />
                    ) : (
                      <RefreshCw size={15} />
                    )}
                    {resendCooldown > 0
                      ? `Resend available in ${resendCooldown}s`
                      : "Resend confirmation email"}
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setMode("signin")
                      setErrorMessage("")
                      setSuccessMessage("")
                    }}
                    className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-[#184936] py-3 px-4 text-xs font-semibold text-white hover:bg-[#235c46] transition-all"
                  >
                    <ArrowLeft size={14} />
                    Proceed to Sign in
                  </button>
                </div>
              </div>
            )}

            {/* 5. RESET PASSWORD FORM (Recovery mode) */}
            {mode === "reset" && (
              <form onSubmit={handleUpdatePassword} className="space-y-4">
                <div className="rounded-xl bg-[#edf5ef] p-3.5 text-xs text-[#24533f] flex items-center gap-2.5 border border-[#d2e3d6]">
                  <KeyRound size={16} className="shrink-0 text-[#2a6d4d]" />
                  <span>Choose a new password for your Dosewell account.</span>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#244837] mb-1.5">
                    New password (min 6 characters)
                  </label>
                  <div className="relative">
                    <Lock
                      size={17}
                      className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#7f9488]"
                    />
                    <input
                      type={showPassword ? "text" : "password"}
                      required
                      minLength={6}
                      autoComplete="new-password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="New password"
                      className="w-full rounded-xl border border-[#d6e0d9] bg-[#fafcfb] pl-10 pr-11 py-3 text-sm text-[#18392a] placeholder:text-[#9bb0a4] focus:border-[#276a4d] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#276a4d]/20 transition-all"
                    />
                    <button
                      type="button"
                      aria-label={showPassword ? "Hide password" : "Show password"}
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#7f9488] hover:text-[#244837]"
                    >
                      {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#244837] mb-1.5">
                    Confirm new password
                  </label>
                  <div className="relative">
                    <Lock
                      size={17}
                      className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#7f9488]"
                    />
                    <input
                      type={showConfirmPassword ? "text" : "password"}
                      required
                      minLength={6}
                      autoComplete="new-password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Repeat new password"
                      className="w-full rounded-xl border border-[#d6e0d9] bg-[#fafcfb] pl-10 pr-11 py-3 text-sm text-[#18392a] placeholder:text-[#9bb0a4] focus:border-[#276a4d] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#276a4d]/20 transition-all"
                    />
                    <button
                      type="button"
                      aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#7f9488] hover:text-[#244837]"
                    >
                      {showConfirmPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full mt-2 inline-flex items-center justify-center gap-2 rounded-xl bg-[#184936] py-3.5 px-4 text-sm font-semibold text-white shadow-md shadow-[#184936]/15 hover:bg-[#235c46] active:scale-[0.99] disabled:opacity-70 disabled:cursor-not-allowed transition-all"
                >
                  {loading ? (
                    <>
                      <Loader2 size={18} className="animate-spin" />
                      <span>Updating password...</span>
                    </>
                  ) : (
                    <>
                      <span>Save new password</span>
                      <ArrowRight size={17} />
                    </>
                  )}
                </button>
              </form>
            )}
          </div>

          {/* Privacy & Security note below card */}
          <div className="mt-6 flex items-center justify-center gap-2 text-xs text-[#6e8276]">
            <ShieldCheck size={14} className="text-[#3b7e5c]" />
            <span>End-to-end encrypted session persistence</span>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="py-6 text-center text-xs text-[#809488]">
        <span>
          Dosewell · Health routine & prescription organizer
          <Heart size={11} className="inline ml-1 text-[#437d5d]" />
        </span>
      </footer>
    </div>
  )
}
