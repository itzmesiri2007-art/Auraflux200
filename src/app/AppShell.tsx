import type { ReactNode } from "react"

export default function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen border border-solid border-[#e8d9b8] bg-[#123f36] shadow-[0_4px_4px_0_rgba(0,0,0,0.25)] [--figma-make-local-effect-type:DROP_SHADOW] lg:grid lg:grid-cols-[230px_minmax(0,1fr)] [&_button]:min-h-11 [&_input]:min-h-11 [&_select]:min-h-11">
      {children}
    </div>
  )
}
