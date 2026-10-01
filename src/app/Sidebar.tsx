import { NavLink } from "react-router"
import {
  ArrowRight,
  BookOpen,
  CalendarDays,
  ChevronRight,
  CircleHelp,
  LayoutDashboard,
  Leaf,
  LogOut,
  Pill,
  Settings2,
} from "lucide-react"

type SidebarProps = {
  mobileMenu: boolean
  medicineCount: number
  userName?: string
  userEmail?: string
  onNavigate: () => void
  onHelp: () => void
  onProfile: () => void
  onSignOut?: () => void
}

const navItems = [
  { to: "/", label: "Overview", icon: LayoutDashboard },
  { to: "/medicines", label: "My medicines", icon: Pill },
  { to: "/schedule", label: "My schedule", icon: CalendarDays },
  { to: "/library", label: "Medicine library", icon: BookOpen },
]

function getInitials(name?: string, email?: string): string {
  if (name && name.trim()) {
    const parts = name.trim().split(/\s+/)
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase()
    }
    return name.slice(0, 2).toUpperCase()
  }
  if (email && email.trim()) {
    return email.slice(0, 2).toUpperCase()
  }
  return "DW"
}

export default function Sidebar({
  mobileMenu,
  medicineCount,
  userName,
  userEmail,
  onNavigate,
  onHelp,
  onProfile,
  onSignOut,
}: SidebarProps) {
  const displayName = userName || (userEmail ? userEmail.split("@")[0] : "Personal")
  const initials = getInitials(displayName, userEmail)

  return (
    <aside
      className={`${
        mobileMenu ? "flex" : "hidden"
      } fixed inset-y-0 left-0 z-40 w-[230px] flex-col bg-[#184936] text-white lg:flex`}
    >
      <NavLink to="/" className="flex items-center gap-2.5 px-7 pb-11 pt-9">
        <span className="flex h-9 w-9 rotate-[-15deg] items-center justify-center rounded-xl bg-[#d5e9d6] text-[#184936]">
          <Pill size={23} strokeWidth={2.4} />
        </span>
        <span className="font-display text-[25px] font-extrabold tracking-[-0.8px]">
          dosewell<span className="text-[#b6dcb6]">.</span>
        </span>
      </NavLink>
      <div className="px-7 pb-3 text-[14px] font-semibold tracking-[1.8px] text-[#aec8b9]">
        YOUR HEALTH, ORGANIZED
      </div>
      <nav className="space-y-2 px-4">
        {navItems.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            end={to === "/"}
            onClick={onNavigate}
            className={({ isActive }) =>
              `flex items-center gap-3 rounded-lg px-4 py-3.5 text-[16px] font-medium ${
                isActive
                  ? "bg-[#e4efdf] text-[#244b37]"
                  : "text-[#d4e2d9] hover:bg-white/10"
              }`
            }
          >
            <Icon size={19} strokeWidth={1.7} />
            {label}
            {to === "/medicines" && (
              <span className="ml-auto rounded-md bg-white/10 px-1.5 text-[14px]">
                {medicineCount}
              </span>
            )}
          </NavLink>
        ))}
      </nav>
      <div className="mx-5 mt-auto mb-6 rounded-xl border border-[#658673]/40 bg-[#24533f] p-4">
        <span className="mb-3 flex h-9 w-9 items-center justify-center rounded-full bg-[#3b6650]">
          <Leaf size={19} className="text-[#d1e7b6]" />
        </span>
        <p className="font-display text-sm font-semibold">
          Small steps. Better health.
        </p>
        <p className="mt-2 text-[15px] leading-[1.8] text-[#c2d5c8]">
          A little consistency today makes a difference tomorrow.
        </p>
      </div>
      <div className="space-y-1 border-t border-white/10 px-4 py-4">
        <NavLink
          to="/settings"
          className="flex items-center gap-3 rounded-lg px-4 py-3 text-[16px] text-[#d4e2d9] hover:bg-white/10"
        >
          <Settings2 size={18} />
          Settings
        </NavLink>
        <button
          onClick={onHelp}
          className="flex w-full items-center gap-3 rounded-lg px-4 py-3 text-[16px] text-[#d4e2d9] hover:bg-white/10"
        >
          <CircleHelp size={18} />
          Help & support
          <ArrowRight size={14} className="ml-auto" />
        </button>
      </div>
      <div className="border-t border-white/10 px-4 py-3">
        <div className="flex items-center gap-2.5">
          <button
            onClick={onProfile}
            className="flex-1 flex items-center gap-2.5 rounded-lg px-2 py-2 text-left hover:bg-white/5 transition-colors overflow-hidden"
          >
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#e8d5b9] text-xs font-bold text-[#594838]">
              {initials}
            </span>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-[14px] font-semibold text-white">
                {displayName}
              </span>
              <span className="block truncate text-[11px] text-[#bdcec3]">
                {userEmail || "Personal workspace"}
              </span>
            </span>
            <ChevronRight size={14} className="shrink-0 text-[#bdcec3]" />
          </button>
          {onSignOut && (
            <button
              onClick={onSignOut}
              title="Sign out"
              aria-label="Sign out"
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-[#bdcec3] hover:bg-white/10 hover:text-white transition-colors"
            >
              <LogOut size={16} />
            </button>
          )}
        </div>
      </div>
    </aside>
  )
}

