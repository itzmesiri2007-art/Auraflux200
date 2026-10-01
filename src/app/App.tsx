import {
  useEffect,
  useRef,
  useState,
  type FormEvent,
  type ReactNode,
} from "react"
import {
  createBrowserRouter,
  RouterProvider,
  useLocation,
  useNavigate,
} from "react-router"
import {
  AlertTriangle,
  ArrowRight,
  Bell,
  BookOpen,
  CalendarDays,
  Check,
  CheckCheck,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Heart,
  KeyRound,
  Leaf,
  LogOut,
  Menu,
  Pencil,
  Pill,
  Plus,
  RotateCcw,
  Search,
  ShieldCheck,
  Sparkles,
  Sun,
  Trash2,
  X,
} from "lucide-react"
import VoiceCompanion from "./VoiceCompanion"
import AppShell from "./AppShell"
import Sidebar from "./Sidebar"
import AuthScreen from "./AuthScreen"
import { AuthProvider, useAuth } from "../lib/AuthContext"
import {
  type DoseRecord,
  type FoodInstruction,
  type FrequencyType,
  type Medicine,
  type MedicineType,
  type SavedState,
  dateKey,
  getDefaultTimesForFrequency,
  getDosesForDate,
  samplePrescriptions,
  timeLabel,
} from "./prescription"

const colors = [
  "bg-[#f5eddc] text-[#9c7838]",
  "bg-[#e8e9f7] text-[#7774a9]",
  "bg-[#e5efe8] text-[#548365]",
  "bg-[#f7e9e1] text-[#b47f62]",
]

const medicineTypes: MedicineType[] = [
  "Tablet",
  "Capsule",
  "Syrup",
  "Injection",
  "Drops",
  "Cream",
  "Other",
]

const foodInstructionOptions: FoodInstruction[] = [
  "Before food",
  "After food",
  "With food",
  "On an empty stomach",
  "Any time",
]

const frequencyOptions: FrequencyType[] = [
  "Once a day",
  "Twice a day",
  "Three times a day",
  "Four times a day",
  "Every X hours",
  "Specific times",
  "Certain days of the week",
  "Custom schedule",
]

const daysOfWeekList = [
  { label: "Sun", value: 0 },
  { label: "Mon", value: 1 },
  { label: "Tue", value: 2 },
  { label: "Wed", value: 3 },
  { label: "Thu", value: 4 },
  { label: "Fri", value: 5 },
  { label: "Sat", value: 6 },
]

const quickInstructions = [
  "Take with plenty of water",
  "Take after breakfast",
  "Take after meals",
  "Do not crush",
  "Take at bedtime",
]

const library = [
  {
    name: "Metformin",
    category: "Type 2 diabetes",
    description:
      "A medicine used alongside diet and exercise to help manage blood sugar in people with type 2 diabetes.",
    url: "https://medlineplus.gov/druginfo/meds/a696005.html",
    color: 2,
  },
  {
    name: "Lisinopril",
    category: "Blood pressure",
    description:
      "An ACE inhibitor used to treat high blood pressure and certain heart conditions.",
    url: "https://medlineplus.gov/druginfo/meds/a692051.html",
    color: 1,
  },
  {
    name: "Atorvastatin",
    category: "Cholesterol",
    description:
      "A statin used to help lower cholesterol and reduce the risk of certain cardiovascular problems.",
    url: "https://medlineplus.gov/druginfo/meds/a600045.html",
    color: 3,
  },
  {
    name: "Vitamin D",
    category: "Vitamins & supplements",
    description:
      "A nutrient that supports calcium absorption and bone health. Supplement needs vary by person.",
    url: "https://ods.od.nih.gov/factsheets/VitaminD-Consumer/",
    color: 0,
  },
]

function readSaved(): SavedState {
  try {
    const raw = localStorage.getItem("dosewell-v1")
    if (raw) {
      const stored = JSON.parse(raw)
      if (stored && Array.isArray(stored.medicines)) {
        const migratedMeds: Medicine[] = stored.medicines.map(
          (m: any, idx: number) => ({
            id: String(m.id || crypto.randomUUID()),
            name: String(m.name || "Medicine"),
            type: m.type as MedicineType || "Tablet",
            dosage: String(m.dosage || m.dose || "1 tablet"),
            doseAmount: String(m.doseAmount || "1"),
            dosageUnit: String(m.dosageUnit || "tablet"),
            strength: String(m.strength || ""),
            frequency: m.frequency as FrequencyType || "Once a day",
            times:
              Array.isArray(m.times) && m.times.length > 0
                ? m.times
                : [m.time || "08:00"],
            daysOfWeek: Array.isArray(m.daysOfWeek)
              ? m.daysOfWeek
              : [0, 1, 2, 3, 4, 5, 6],
            startDate: String(m.startDate || "2026-01-01"),
            endDate: String(m.endDate || ""),
            foodInstruction:
              m.foodInstruction as FoodInstruction ||
              (m.note?.includes("breakfast")
                ? "With food"
                : m.note?.includes("lunch")
                  ? "With food"
                  : "After food"),
            instructions: String(m.instructions || m.note || ""),
            notes: String(m.notes || ""),
            active: m.active !== false,
            color: typeof m.color === "number" ? m.color : idx % 4,
          }),
        )

        const doseRecords: Record<string, DoseRecord> = stored.doseRecords || {}

        // Migrate legacy taken array if present
        if (
          (!stored.doseRecords ||
            Object.keys(stored.doseRecords).length === 0) &&
          Array.isArray(stored.taken)
        ) {
          const todayK = dateKey()
          stored.taken.forEach((id: string) => {
            const med = migratedMeds.find((x) => x.id === id)
            if (med) {
              const time = med.times[0] || "08:00"
              doseRecords[`${todayK}_${id}_${time}`] = {
                status: "taken",
                timestamp: new Date().toISOString(),
              }
            }
          })
        }

        return {
          medicines: migratedMeds,
          doseRecords,
          date: dateKey(),
          reminders: Boolean(stored.reminders),
          demo: Boolean(stored.demo),
          userName: stored.userName || "Jamie",
        }
      }
    }
  } catch {}

  const initialRecords: Record<string, DoseRecord> = {}
  const todayK = dateKey()
  initialRecords[`${todayK}_1_08:00`] = {
    status: "taken",
    timestamp: new Date().toISOString(),
  }
  initialRecords[`${todayK}_2_08:00`] = {
    status: "taken",
    timestamp: new Date().toISOString(),
  }

  return {
    medicines: samplePrescriptions,
    doseRecords: initialRecords,
    date: todayK,
    reminders: false,
    demo: true,
    userName: "Jamie",
  }
}

function Modal({
  title,
  children,
  close,
  maxWidth = "max-w-lg",
}: {
  title: string
  children: ReactNode
  close: () => void
  maxWidth?: string
}) {
  const dialog = useRef<HTMLDialogElement>(null)
  useEffect(() => {
    dialog.current?.showModal()
  }, [])
  return (
    <dialog
      ref={dialog}
      onCancel={close}
      onClick={(event) => {
        if (event.target === event.currentTarget) close()
      }}
      className={`fixed m-auto w-[calc(100%-32px)] ${maxWidth} max-h-[92vh] overflow-y-auto rounded-2xl border border-border bg-white p-0 text-foreground shadow-2xl backdrop:bg-[#123b2b]/40`}
    >
      <div className="sticky top-0 z-20 flex items-center justify-between border-b border-border bg-white/95 px-6 py-4 backdrop-blur-sm">
        <h2 className="font-display text-xl font-bold">{title}</h2>
        <button
          onClick={close}
          aria-label="Close dialog"
          className="!min-h-0 rounded-full p-2 text-muted-foreground hover:bg-muted hover:text-foreground"
        >
          <X size={19} />
        </button>
      </div>
      <div className="p-6">{children}</div>
    </dialog>
  )
}

function Dashboard() {
  const { user, loading, isPasswordRecovery, signOut } = useAuth()
  const [saved, setSaved] = useState<SavedState>(readSaved)

  const [modal, setModal] =
    useState<"add" | "edit" | "delete" | "reminders" | "help" | "profile" | null>(
      null,
    )
  const [editingMedicine, setEditingMedicine] = useState<Medicine | null>(null)
  const [deletingMedicine, setDeletingMedicine] = useState<Medicine | null>(
    null,
  )
  const [deletePastRecords, setDeletePastRecords] = useState(false)
  const [detail, setDetail] = useState<typeof library[number] | null>(null)
  const [query, setQuery] = useState("")
  const [toast, setToast] = useState("")
  const [mobileMenu, setMobileMenu] = useState(false)
  const [filter, setFilter] = useState("All doses")
  const [dayOffset, setDayOffset] = useState(0)
  const [notificationError, setNotificationError] = useState("")
  const notified = useRef(new Set<string>())
  const location = useLocation()
  const navigate = useNavigate()

  // Sync user name from Supabase user metadata if available
  useEffect(() => {
    if (user?.user_metadata?.full_name) {
      setSaved((prev) => {
        if (prev.userName === "Jamie" || !prev.userName) {
          return { ...prev, userName: user.user_metadata.full_name }
        }
        return prev
      })
    }
  }, [user])

  // Persist state to local storage
  useEffect(() => {
    try {
      localStorage.setItem("dosewell-v1", JSON.stringify(saved))
    } catch {}
  }, [saved])

  // Toast auto-dismiss
  useEffect(() => {
    if (!toast) return
    const timeout = setTimeout(() => setToast(""), 4500)
    return () => clearTimeout(timeout)
  }, [toast])

  // Browser reminders check (triggered every 15s)
  useEffect(() => {
    if (!user) return
    const interval = setInterval(() => {
      if (
        !saved.reminders ||
        !("Notification" in window) ||
        Notification.permission !== "granted"
      )
        return

      const now = new Date()
      const currentTime = `${String(now.getHours()).padStart(2, "0")}:${String(
        now.getMinutes(),
      ).padStart(2, "0")}`

      const todayDosesForNotif = getDosesForDate(saved.medicines, new Date(), saved.doseRecords)
      todayDosesForNotif.forEach((dose) => {
        if (
          dose.scheduledTime === currentTime &&
          dose.status !== "taken" &&
          dose.status !== "skipped" &&
          !notified.current.has(dose.doseId)
        ) {
          const food =
            dose.medicine.foodInstruction &&
            dose.medicine.foodInstruction !== "Any time"
              ? ` (${dose.medicine.foodInstruction})`
              : ""
          const inst = dose.medicine.instructions
            ? ` ${dose.medicine.instructions}.`
            : ""
          new Notification("Dosewell Prescription Reminder", {
            body: `Hello ${saved.userName}, it is time to take ${dose.medicine.dosage} of ${dose.medicine.name}${food}.${inst}`,
          })
          notified.current.add(dose.doseId)
        }
      })
    }, 15000)
    return () => clearInterval(interval)
  }, [user, saved.reminders, saved.userName, saved.medicines, saved.doseRecords])

  // ── Early returns AFTER all hooks ──
  if (loading) {
    return (
      <div className="min-h-screen bg-[#f4f7f5] flex flex-col items-center justify-center">
        <div className="flex h-14 w-14 rotate-[-15deg] items-center justify-center rounded-2xl bg-[#184936] text-[#d5e9d6] animate-pulse shadow-lg shadow-[#184936]/15">
          <Pill size={30} strokeWidth={2.4} />
        </div>
        <p className="mt-4 font-display text-sm font-semibold text-[#184936] tracking-wide">
          Loading Dosewell...
        </p>
      </div>
    )
  }

  if (!user || isPasswordRecovery) {
    return <AuthScreen initialMode={isPasswordRecovery ? "reset" : "signin"} />
  }

  const route = location.pathname
  const isHome = route === "/"
  const page =
    route === "/medicines"
      ? "My medicines"
      : route === "/schedule"
        ? "My schedule"
        : route === "/library"
          ? "Medicine library"
          : route === "/settings"
            ? "Settings"
            : "Overview"

  const userDisplayName =
    saved.userName ||
    user.user_metadata?.full_name ||
    user.user_metadata?.display_name ||
    (user.email ? user.email.split("@")[0] : "Personal")

  const userInitials = (() => {
    const name = userDisplayName.trim()
    const parts = name.split(/\s+/)
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase()
    }
    if (name.length > 0) {
      return name.slice(0, 2).toUpperCase()
    }
    return "DW"
  })()

  const today = new Date()
  const selectedDate = new Date()
  selectedDate.setDate(selectedDate.getDate() + dayOffset)

  // Doses for selected date
  const selectedDateDoses = getDosesForDate(
    saved.medicines,
    selectedDate,
    saved.doseRecords,
  )

  // Doses for today (used for voice companion, browser notification, and overview stats)
  const todayDoses = getDosesForDate(saved.medicines, today, saved.doseRecords)

  const activeMedicinesCount = saved.medicines.filter((m) => m.active).length
  const takenCount = todayDoses.filter((d) => d.status === "taken").length
  const remainingCount = todayDoses.filter(
    (d) => d.status !== "taken" && d.status !== "skipped",
  ).length

  // Next upcoming dose for today
  const nextDose = todayDoses.find(
    (d) => d.status !== "taken" && d.status !== "skipped",
  )

  // Filtered visible doses for the selected day view
  const matches = (name: string) =>
    name.toLowerCase().includes(query.toLowerCase())

  const visibleDoses = selectedDateDoses.filter((dose) => {
    if (!matches(dose.medicine.name)) return false
    if (filter === "All doses") return true
    if (filter === "Taken") return dose.status === "taken"
    if (filter === "Skipped") return dose.status === "skipped"
    if (filter === "Upcoming")
      return dose.status !== "taken" && dose.status !== "skipped"
    return true
  })

  // Toggle dose taken status
  function toggleDoseTaken(doseId: string) {
    setSaved((current) => {
      const records = { ...current.doseRecords }
      const isCurrentlyTaken = records[doseId]?.status === "taken"

      if (isCurrentlyTaken) {
        delete records[doseId]
      } else {
        records[doseId] = {
          status: "taken",
          timestamp: new Date().toISOString(),
        }
      }
      return {
        ...current,
        doseRecords: records,
      }
    })

    const wasTaken = saved.doseRecords[doseId]?.status === "taken"
    setToast(
      wasTaken
        ? "Dose returned to your schedule."
        : "Dose recorded as taken. One less thing to remember.",
    )
  }

  // Toggle dose skipped status
  function toggleDoseSkipped(doseId: string) {
    setSaved((current) => {
      const records = { ...current.doseRecords }
      const isCurrentlySkipped = records[doseId]?.status === "skipped"

      if (isCurrentlySkipped) {
        delete records[doseId]
      } else {
        records[doseId] = {
          status: "skipped",
          timestamp: new Date().toISOString(),
        }
      }
      return {
        ...current,
        doseRecords: records,
      }
    })

    const wasSkipped = saved.doseRecords[doseId]?.status === "skipped"
    setToast(
      wasSkipped
        ? "Dose returned to your schedule."
        : "Dose marked as skipped.",
    )
  }

  async function enableReminders() {
    if (!("Notification" in window)) {
      setNotificationError(
        "This browser does not support notifications. Try a supported desktop browser.",
      )
      return
    }
    try {
      const permission = await Notification.requestPermission()
      if (permission !== "granted") {
        setNotificationError(
          "Notifications are blocked. Allow them in your browser’s site settings, then try again.",
        )
        return
      }
      setSaved((current) => ({ ...current, reminders: true }))
      setModal(null)
      setToast("Browser reminders enabled while Dosewell is open.")
    } catch {
      setNotificationError(
        "Notifications could not be enabled in this preview. Open the app in a supported browser.",
      )
    }
  }

  // Save medicine (add or update)
  function handleSaveMedicine(medicineData: Medicine) {
    setSaved((current) => {
      const exists = current.medicines.some((m) => m.id === medicineData.id)
      if (exists) {
        // Edit medicine: preserve past dose records, update future schedule
        return {
          ...current,
          medicines: current.medicines.map((m) =>
            m.id === medicineData.id ? medicineData : m,
          ),
        }
      } else {
        // Add new medicine
        return {
          ...current,
          medicines: [...current.medicines, medicineData],
        }
      }
    })
    setModal(null)
    setEditingMedicine(null)
    setToast(`${medicineData.name} saved to your prescription schedule.`)
  }

  // Confirm delete medicine
  function handleConfirmDelete() {
    if (!deletingMedicine) return
    const id = deletingMedicine.id
    setSaved((current) => {
      const nextRecords = { ...current.doseRecords }
      if (deletePastRecords) {
        // Delete historical records for this medicine
        Object.keys(nextRecords).forEach((key) => {
          if (key.includes(`_${id}_`)) {
            delete nextRecords[key]
          }
        })
      }
      return {
        ...current,
        medicines: current.medicines.filter((m) => m.id !== id),
        doseRecords: nextRecords,
      }
    })
    setToast(`${deletingMedicine.name} removed from your routine.`)
    setModal(null)
    setDeletingMedicine(null)
    setDeletePastRecords(false)
  }

  const titleClass = "font-display text-[17px] font-bold"
  const cardClass = "rounded-2xl border border-border bg-card"
  const primaryButton =
    "inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-3 text-[16px] font-semibold text-white hover:bg-[#286b54]"

  return (
    <AppShell>
      {mobileMenu && (
        <button
          className="fixed inset-0 z-30 bg-black/30 lg:hidden"
          aria-label="Close navigation"
          onClick={() => setMobileMenu(false)}
        />
      )}
      <Sidebar
        mobileMenu={mobileMenu}
        medicineCount={saved.medicines.length}
        userName={userDisplayName}
        userEmail={user.email}
        onNavigate={() => {
          setMobileMenu(false)
          setQuery("")
        }}
        onHelp={() => setModal("help")}
        onProfile={() => setModal("profile")}
        onSignOut={async () => {
          await signOut()
          setToast("You have been signed out.")
        }}
      />
      <div className="min-w-0 bg-background lg:col-start-2">
        <header className="flex h-[83px] items-center justify-between gap-4 border-b border-border bg-white px-5 sm:px-8 xl:px-10">
          <div className="flex items-center gap-3">
            <button
              className="!min-h-0 rounded-lg p-1 lg:hidden"
              onClick={() => setMobileMenu(true)}
              aria-label="Open navigation"
            >
              <Menu size={23} />
            </button>
            <span className="text-[16px] font-medium">{page}</span>
          </div>
          <div className="flex items-center gap-5">
            <div className="hidden items-center gap-2 text-[16px] text-muted-foreground sm:flex">
              <CalendarDays size={15} />
              {today.toLocaleDateString("en-US", {
                weekday: "short",
                month: "short",
                day: "numeric",
                year: "numeric",
              })}
            </div>
            <div className="hidden h-5 w-px bg-border sm:block" />
            <button
              onClick={() => setModal("reminders")}
              aria-label="Reminder settings"
              className="!min-h-0 relative rounded-full p-2 text-[#56685d] hover:bg-muted"
            >
              <Bell size={20} />
              <span
                className={`absolute right-2 top-1.5 h-1.5 w-1.5 rounded-full ${
                  saved.reminders ? "bg-primary" : "bg-[#c29b61]"
                }`}
              />
            </button>
            <button
              onClick={() => setModal("profile")}
              aria-label="Open profile"
              className="!min-h-0 flex h-9 w-9 items-center justify-center rounded-full border-2 border-white bg-[#e8d9c1] text-xs font-bold text-[#594838] ring-1 ring-border"
            >
              {userInitials}
            </button>
          </div>
        </header>
        <main className="mx-auto max-w-[1500px] px-5 pb-6 pt-8 sm:px-8 xl:px-10">
          <div className="mb-7 flex flex-wrap items-center justify-between gap-4">
            <div>
              <div className="mb-2 flex items-center gap-2 text-[15px] font-medium text-muted-foreground">
                <span className="h-1.5 w-1.5 rounded-full bg-[#6d957a]" />
                YOUR EVERYDAY HEALTH COMPANION
              </div>
              <h1 className="font-display text-[29px] font-bold leading-tight tracking-[-0.6px] sm:text-[32px]">
                {isHome ? "A little care, every day." : page}
              </h1>
              <p className="mt-2 text-[16px] text-muted-foreground">
                {isHome
                  ? `Welcome back, ${saved.userName}. Let’s make today a healthy one.`
                  : route === "/library"
                    ? "Understand your medicines with information from trusted sources."
                    : route === "/medicines"
                      ? "All your prescribed medicines, flexibly configured according to your prescription."
                      : route === "/schedule"
                        ? "A clear view of your daily prescription routine and exact scheduled doses."
                        : "Make Dosewell work for your routine."}
              </p>
            </div>
            <button
              onClick={() => {
                setEditingMedicine(null)
                setModal("add")
              }}
              className={primaryButton}
            >
              <Plus size={17} />
              Add medicine
            </button>
          </div>

          {/* Voice Companion (Veena) */}
          <VoiceCompanion
            userName={saved.userName}
            scheduledDoses={todayDoses}
            onRecordDose={(doseId) => {
              const rec = saved.doseRecords[doseId]
              if (rec?.status !== "taken") {
                toggleDoseTaken(doseId)
              }
            }}
          />

          {isHome && (
            <>
              <section className="relative mb-6 flex min-h-[174px] overflow-hidden rounded-2xl bg-[#e6eee1] px-6 py-7 sm:px-8">
                <div className="relative z-10 max-w-full sm:max-w-[65%]">
                  <span className="mb-3 inline-flex items-center gap-1.5 rounded-full bg-white/65 px-2.5 py-1 text-[14px] font-semibold text-[#527047]">
                    <Sun size={12} />A FRESH START, EVERY DAY
                  </span>
                  <h2 className="font-display text-[24px] font-bold tracking-[-0.3px] text-[#2d4934]">
                    Your prescription routine. Simplified.
                  </h2>
                  <p className="mt-2 max-w-md text-[16px] leading-6 text-[#5f735b]">
                    Configured for your exact dosage, frequency, and reminder
                    times. Leave the remembering to us.
                  </p>
                </div>
                <div
                  aria-hidden="true"
                  className="absolute -right-4 bottom-[-76px] hidden h-[280px] w-[310px] rounded-full border border-[#b7c8ac]/50 sm:right-5 sm:block"
                >
                  <div className="absolute inset-7 rounded-full border border-[#b7c8ac]/50" />
                  <div className="absolute inset-14 rounded-full border border-[#b7c8ac]/50" />
                  <div className="absolute left-12 top-12 h-[115px] w-[50px] rotate-[-34deg] overflow-hidden rounded-full border-[5px] border-white bg-[#fafbf6] shadow-[0_12px_22px_#54704520]">
                    <div className="h-1/2 bg-[#79a38a]" />
                  </div>
                  <div className="absolute left-[149px] top-[56px] flex h-[92px] w-[92px] rotate-12 items-center justify-center rounded-[25px] border-[5px] border-white bg-[#f4f6ec] shadow-[0_12px_22px_#54704515]">
                    <Leaf
                      size={49}
                      strokeWidth={1.1}
                      className="text-[#77946c]"
                    />
                  </div>
                  <span className="absolute left-[120px] top-6 text-[#729164]">
                    <Sparkles size={20} strokeWidth={1.2} />
                  </span>
                  <span className="absolute left-[244px] top-[145px] h-3 w-3 rounded-full bg-[#a5ba8e]" />
                </div>
              </section>

              {/* Progress and Stats Cards */}
              <section className="mb-7 grid grid-cols-2 gap-3 xl:grid-cols-4 xl:gap-4">
                {[
                  {
                    label: "Active medicines",
                    value: String(activeMedicinesCount).padStart(2, "0"),
                    subtitle: "In your active prescription",
                    icon: Pill,
                    color: "bg-[#eaf0e9] text-[#61856a]",
                  },
                  {
                    label: "Doses taken today",
                    value: String(takenCount).padStart(2, "0"),
                    subtitle: `of ${todayDoses.length} scheduled doses`,
                    icon: CheckCheck,
                    color: "bg-[#e7efef] text-[#578581]",
                  },
                  {
                    label: "Doses remaining",
                    value: String(remainingCount).padStart(2, "0"),
                    subtitle: remainingCount
                      ? "A little care still to come"
                      : "You’re all set for today",
                    icon: Clock3,
                    color: "bg-[#f7efdf] text-[#a28a50]",
                  },
                  {
                    label: "Today’s progress",
                    value: `${
                      todayDoses.length
                        ? Math.round((takenCount / todayDoses.length) * 100)
                        : 0
                    }%`,
                    subtitle: "One dose at a time",
                    icon: Heart,
                    color: "bg-[#f2e8e4] text-[#aa7f6c]",
                  },
                ].map(({ label, value, subtitle, icon: Icon, color }) => (
                  <div key={label} className={`${cardClass} p-4 xl:p-5`}>
                    <div className="flex items-center justify-between gap-1">
                      <span className="text-[15px] font-medium text-[#68766e]">
                        {label}
                      </span>
                      <span
                        className={`flex h-8 w-8 items-center justify-center rounded-lg ${color}`}
                      >
                        <Icon size={16} strokeWidth={1.6} />
                      </span>
                    </div>
                    <div className="mt-2 font-display text-[28px] font-bold leading-9">
                      {value}
                    </div>
                    <p className="mt-1 text-[14px] text-muted-foreground">
                      {subtitle}
                    </p>
                  </div>
                ))}
              </section>
            </>
          )}

          {/* Schedule View (Dashboard & /schedule) */}
          {(isHome || route === "/schedule") && (
            <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,1fr)_300px]">
              <section className={`${cardClass} overflow-hidden`}>
                <div className="flex flex-wrap items-center justify-between gap-3 px-5 pb-4 pt-5">
                  <div className="flex items-center gap-2.5">
                    <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-secondary text-primary">
                      <CalendarDays size={17} />
                    </span>
                    <h2 className={titleClass}>
                      {isHome
                        ? "Today’s schedule"
                        : "Daily prescription schedule"}
                    </h2>
                  </div>
                  {isHome && (
                    <button
                      onClick={() => {
                        navigate("/schedule")
                        setDayOffset(0)
                      }}
                      className="!min-h-0 flex items-center gap-1 text-[15px] font-semibold text-primary"
                    >
                      View schedule
                      <ArrowRight size={13} />
                    </button>
                  )}
                </div>

                <div className="mx-5 mb-4 flex flex-wrap items-center justify-between gap-2 rounded-lg bg-[#f6f8f6] px-3 py-2.5">
                  <div className="flex items-center gap-2 text-[15px] text-[#6c796f]">
                    {route === "/schedule" && (
                      <button
                        aria-label="Previous day"
                        onClick={() => setDayOffset(dayOffset - 1)}
                        className="!min-h-0 rounded p-1 hover:bg-[#e8efe9]"
                      >
                        <ChevronLeft size={16} />
                      </button>
                    )}
                    <CalendarDays size={14} />
                    <span className="font-medium text-foreground">
                      {dayOffset === 0
                        ? "Today"
                        : selectedDate.toLocaleDateString("en-US", {
                            weekday: "short",
                          })}
                      ,
                    </span>
                    {selectedDate.toLocaleDateString("en-US", {
                      month: "long",
                      day: "numeric",
                    })}
                    {route === "/schedule" && (
                      <button
                        aria-label="Next day"
                        onClick={() => setDayOffset(dayOffset + 1)}
                        className="!min-h-0 rounded p-1 hover:bg-[#e8efe9]"
                      >
                        <ChevronRight size={16} />
                      </button>
                    )}
                  </div>
                  <label className="flex items-center gap-1 text-[14px] text-muted-foreground">
                    <span className="sr-only">Filter doses</span>
                    <select
                      className="!min-h-0 max-w-[120px] rounded border border-border bg-white px-2 py-1 text-[14px]"
                      value={filter}
                      onChange={(event) => setFilter(event.target.value)}
                    >
                      <option>All doses</option>
                      <option>Upcoming</option>
                      <option>Taken</option>
                      <option>Skipped</option>
                    </select>
                  </label>
                </div>

                {/* Doses List */}
                <div className="px-5">
                  {visibleDoses.map((dose) => {
                    const isTaken = dose.status === "taken"
                    const isSkipped = dose.status === "skipped"
                    const isUpcoming =
                      dayOffset === 0 && nextDose?.doseId === dose.doseId

                    return (
                      <div
                        key={dose.doseId}
                        className="flex flex-col gap-3 border-t border-border py-4 first:border-t-0 sm:flex-row sm:items-center sm:gap-4"
                      >
                        {/* Time display */}
                        <div className="hidden w-[72px] shrink-0 sm:block">
                          <p className="text-[16px] font-semibold text-foreground">
                            {timeLabel(dose.scheduledTime).split(" ")[0]}
                          </p>
                          <p className="mt-0.5 text-[13px] font-medium text-muted-foreground">
                            {timeLabel(dose.scheduledTime).split(" ")[1]}
                          </p>
                        </div>

                        {/* Medicine icon */}
                        <div
                          className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${
                            colors[dose.medicine.color]
                          }`}
                        >
                          <Pill
                            size={22}
                            strokeWidth={1.6}
                            className="rotate-[-12deg]"
                          />
                        </div>

                        {/* Medicine info */}
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <h3 className="text-[16px] font-semibold">
                              {dose.medicine.name}
                            </h3>
                            {dose.medicine.strength && (
                              <span className="text-[14px] text-muted-foreground">
                                {dose.medicine.strength}
                              </span>
                            )}
                            <span className="rounded-full bg-[#eef3ee] px-2 py-0.5 text-[12px] font-medium text-[#497053]">
                              {dose.medicine.type}
                            </span>
                          </div>

                          <div className="mt-1 flex flex-wrap items-center gap-1.5 text-[14px] text-muted-foreground">
                            <span className="font-semibold text-foreground">
                              {dose.medicine.dosage}
                            </span>
                            {dose.medicine.foodInstruction &&
                              dose.medicine.foodInstruction !== "Any time" && (
                                <>
                                  <span className="text-[#bbc6be]">·</span>
                                  <span className="rounded bg-amber-50 px-1.5 py-0.5 text-[12px] font-medium text-amber-800">
                                    {dose.medicine.foodInstruction}
                                  </span>
                                </>
                              )}
                            {dose.medicine.instructions && (
                              <>
                                <span className="text-[#bbc6be]">·</span>
                                <span className="italic text-[#5e7163]">
                                  {dose.medicine.instructions}
                                </span>
                              </>
                            )}
                          </div>

                          <span className="mt-1 block text-[13px] font-medium text-muted-foreground sm:hidden">
                            {timeLabel(dose.scheduledTime)}
                          </span>
                        </div>

                        {/* Dose Actions */}
                        <div className="flex shrink-0 items-center justify-end gap-2">
                          {isTaken ? (
                            <button
                              onClick={() => toggleDoseTaken(dose.doseId)}
                              title="Click to undo taken status"
                              className="!min-h-0 group flex items-center gap-1.5 rounded-full bg-[#ecf3eb] px-3.5 py-1.5 text-[14px] font-medium text-[#4f7854] hover:bg-[#dceade]"
                            >
                              <Check size={14} className="stroke-[2.5]" />
                              <span>Taken</span>
                              <RotateCcw
                                size={12}
                                className="hidden group-hover:inline ml-1 text-muted-foreground"
                              />
                            </button>
                          ) : isSkipped ? (
                            <button
                              onClick={() => toggleDoseSkipped(dose.doseId)}
                              title="Click to undo skipped status"
                              className="!min-h-0 group flex items-center gap-1.5 rounded-full bg-stone-100 px-3 py-1.5 text-[14px] font-medium text-stone-600 hover:bg-stone-200"
                            >
                              <span>Skipped</span>
                              <RotateCcw
                                size={12}
                                className="hidden group-hover:inline ml-1 text-muted-foreground"
                              />
                            </button>
                          ) : (
                            <div className="flex items-center gap-2">
                              {isUpcoming && (
                                <span className="hidden items-center gap-1 text-[13px] font-medium text-[#aa8953] md:flex">
                                  <span className="h-1.5 w-1.5 rounded-full bg-[#b29661] animate-pulse" />
                                  Up next
                                </span>
                              )}
                              <button
                                onClick={() => toggleDoseSkipped(dose.doseId)}
                                className="!min-h-0 rounded-lg border border-border px-2.5 py-1.5 text-[13px] font-medium text-[#65766a] hover:bg-muted"
                                title="Mark this dose as skipped"
                              >
                                Skip
                              </button>
                              <button
                                onClick={() => toggleDoseTaken(dose.doseId)}
                                className={`!min-h-0 rounded-lg px-3 py-1.5 text-[14px] font-semibold transition-colors ${
                                  isUpcoming
                                    ? "bg-primary text-white hover:bg-[#286b54]"
                                    : "border border-border bg-white text-[#41624b] hover:bg-secondary"
                                }`}
                              >
                                Mark as taken
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    )
                  })}

                  {visibleDoses.length === 0 && (
                    <div className="py-12 text-center text-sm text-muted-foreground">
                      No doses scheduled for this day.{" "}
                      {saved.medicines.length === 0
                        ? "Add a medicine above according to your prescription."
                        : "Prescriptions may start on another date or have already concluded."}
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-2 border-t border-border bg-[#fcfdfb] px-5 py-3 text-[14px] text-muted-foreground">
                  <ShieldCheck size={14} className="shrink-0 text-[#75937b]" />
                  Prescriptions are configured by you. Always follow clinician
                  directions.
                </div>
              </section>

              {/* Next Dose and Weekly Habit Tracker */}
              <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-1">
                <section className="rounded-2xl border border-[#dce6d7] bg-[#eff4ea] p-5">
                  <div className="mb-4 flex items-center justify-between">
                    <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/80 text-[#5a7e4f]">
                      <Bell size={19} strokeWidth={1.6} />
                    </span>
                    <span className="rounded-full border border-[#dce6d7] bg-white/55 px-2 py-1 text-[13px] font-medium text-[#657958]">
                      {saved.reminders ? "REMINDERS ON" : "YOUR NEXT DOSE"}
                    </span>
                  </div>
                  <div className="font-display text-[17px] font-bold text-[#3c5436]">
                    {nextDose
                      ? "A gentle reminder, right on time."
                      : "All done for today."}
                  </div>
                  <div className="mt-2 text-[15px] leading-5 text-[#65785e]">
                    {nextDose ? (
                      <>
                        <strong className="text-foreground">
                          {nextDose.medicine.name}
                        </strong>{" "}
                        · {nextDose.medicine.dosage}
                        {nextDose.medicine.foodInstruction &&
                        nextDose.medicine.foodInstruction !== "Any time" ? (
                          <span className="block mt-0.5 text-xs text-[#5e7753]">
                            {nextDose.medicine.foodInstruction}
                          </span>
                        ) : null}
                      </>
                    ) : (
                      "You’ve recorded all your doses for today."
                    )}
                  </div>
                  {nextDose && (
                    <p className="mt-2 flex items-center gap-1.5 text-[15px] font-semibold text-[#5e7951]">
                      <Clock3 size={13} />
                      Today at {timeLabel(nextDose.scheduledTime)}
                    </p>
                  )}
                  <button
                    onClick={() => setModal("reminders")}
                    className="!min-h-0 mt-5 flex w-full items-center justify-center gap-2 rounded-lg border border-[#cbd8c3] bg-white/60 py-2.5 text-[15px] font-semibold text-[#48673e] hover:bg-white"
                  >
                    <Bell size={13} />
                    {saved.reminders ? "Manage reminders" : "Set up reminders"}
                    <ArrowRight size={13} />
                  </button>
                </section>

                <section className={`${cardClass} p-5`}>
                  <div className="flex items-center justify-between">
                    <h2 className="font-display text-[14px] font-bold">
                      One day at a time
                    </h2>
                    <Heart size={16} className="text-[#709377]" />
                  </div>
                  <p className="mt-2 text-[14px] text-muted-foreground">
                    Your progress starts with today.
                  </p>
                  <div className="my-5 flex justify-between gap-1">
                    {Array.from({ length: 7 }, (_, index) => {
                      const day = new Date(today)
                      day.setDate(day.getDate() - today.getDay() + index)
                      const current =
                        day.toDateString() === today.toDateString()
                      return (
                        <div
                          key={index}
                          className="flex flex-col items-center gap-2"
                        >
                          <span
                            className={`flex h-7 w-7 items-center justify-center rounded-full ${
                              current
                                ? "bg-primary text-white ring-4 ring-[#edf2e9]"
                                : "border border-border bg-[#f8faf7] text-[#bcc6bd]"
                            }`}
                          >
                            {current ? (
                              <span className="text-[13px] font-bold">
                                {takenCount}
                              </span>
                            ) : (
                              <span className="text-[14px]">–</span>
                            )}
                          </span>
                          <span
                            className={`text-[13px] ${
                              current
                                ? "font-bold text-primary"
                                : "text-muted-foreground"
                            }`}
                          >
                            {["S", "M", "T", "W", "T", "F", "S"][index]}
                          </span>
                        </div>
                      )
                    })}
                  </div>
                  <div className="flex items-center gap-2 border-t border-border pt-3 text-[14px] text-muted-foreground">
                    <span className="h-1.5 w-1.5 rounded-full bg-[#6d957a]" />
                    {takenCount} of {todayDoses.length} doses recorded today
                    {saved.demo && (
                      <span className="ml-auto text-[13px]">Sample data</span>
                    )}
                  </div>
                </section>
              </div>
            </div>
          )}

          {/* Medicines List Page (/medicines) */}
          {route === "/medicines" && (
            <section className={`${cardClass} p-5`}>
              <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h2 className={titleClass}>
                    Your prescription medicines{" "}
                    <span className="ml-2 text-sm font-normal text-muted-foreground">
                      ({saved.medicines.length})
                    </span>
                  </h2>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Configured with flexible dosage, frequency, and reminder
                    times.
                  </p>
                </div>
                <button
                  onClick={() => {
                    setEditingMedicine(null)
                    setModal("add")
                  }}
                  className={primaryButton}
                >
                  <Plus size={16} />
                  Add prescription
                </button>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                {saved.medicines
                  .filter((medicine) => matches(medicine.name))
                  .map((medicine) => (
                    <div
                      className="rounded-xl border border-border p-5 bg-white shadow-sm flex flex-col justify-between"
                      key={medicine.id}
                    >
                      <div>
                        <div className="flex items-start gap-3">
                          <span
                            className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${
                              colors[medicine.color]
                            }`}
                          >
                            <Pill size={23} />
                          </span>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <h3 className="text-base font-semibold text-foreground truncate">
                                {medicine.name}
                              </h3>
                              <span className="rounded-full bg-secondary px-2 py-0.5 text-xs font-medium text-primary">
                                {medicine.type}
                              </span>
                            </div>
                            <p className="mt-0.5 text-sm text-muted-foreground">
                              {medicine.strength
                                ? `${medicine.strength} · `
                                : ""}
                              <span className="font-semibold text-foreground">
                                {medicine.dosage}
                              </span>
                            </p>
                          </div>

                          {/* Action Buttons: Edit and Delete */}
                          <div className="flex items-center gap-1">
                            <button
                              aria-label={`Edit ${medicine.name}`}
                              title="Edit prescription"
                              onClick={() => {
                                setEditingMedicine(medicine)
                                setModal("edit")
                              }}
                              className="!min-h-0 rounded-lg p-2 text-muted-foreground hover:bg-[#edf4ee] hover:text-primary transition-colors"
                            >
                              <Pencil size={16} />
                            </button>
                            <button
                              aria-label={`Delete ${medicine.name}`}
                              title="Remove medicine"
                              onClick={() => {
                                setDeletingMedicine(medicine)
                                setModal("delete")
                              }}
                              className="!min-h-0 rounded-lg p-2 text-muted-foreground hover:bg-red-50 hover:text-red-700 transition-colors"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </div>

                        {/* Frequency & Times */}
                        <div className="mt-4 flex flex-wrap items-center gap-2 text-xs">
                          <span className="inline-flex items-center gap-1 font-medium text-muted-foreground">
                            <Clock3 size={13} />
                            {medicine.frequency}:
                          </span>
                          {medicine.times.map((t) => (
                            <span
                              key={t}
                              className="rounded-md bg-[#f4f7f4] px-2 py-1 font-semibold text-[#285038]"
                            >
                              {timeLabel(t)}
                            </span>
                          ))}
                        </div>

                        {/* Instructions and Food details */}
                        <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                          {medicine.foodInstruction && (
                            <span className="rounded bg-amber-50 px-2 py-0.5 font-medium text-amber-800">
                              {medicine.foodInstruction}
                            </span>
                          )}
                          {medicine.instructions && (
                            <span className="rounded bg-[#f0f4f0] px-2 py-0.5 text-[#3a5843]">
                              {medicine.instructions}
                            </span>
                          )}
                        </div>

                        {/* Schedule duration */}
                        <div className="mt-3 text-xs text-muted-foreground border-t border-border/60 pt-2 flex items-center justify-between">
                          <span>
                            {medicine.endDate
                              ? `Schedule: ${medicine.startDate} to ${medicine.endDate}`
                              : `Schedule: Ongoing from ${medicine.startDate}`}
                          </span>
                          {medicine.notes && (
                            <span className="truncate max-w-[150px] italic">
                              {medicine.notes}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
              </div>

              {saved.medicines.length === 0 && (
                <div className="py-12 text-center text-muted-foreground">
                  <p className="text-base font-semibold text-foreground">
                    Your fresh start.
                  </p>
                  <p className="mt-1 text-sm">
                    No prescription medicines configured yet. Add your first
                    medicine above.
                  </p>
                </div>
              )}
            </section>
          )}

          {/* Library Section */}
          {(isHome || route === "/library") && (
            <section className={`${cardClass} mt-6 p-5`}>
              <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-secondary text-primary">
                    <BookOpen size={17} />
                  </span>
                  <div>
                    <h2 className={titleClass}>Know your medicines</h2>
                    {route === "/library" && (
                      <p className="mt-1 text-xs text-muted-foreground">
                        Educational summaries with links to official reference
                        pages.
                      </p>
                    )}
                  </div>
                </div>
                {isHome ? (
                  <button
                    onClick={() => navigate("/library")}
                    className="!min-h-0 flex items-center gap-1 text-[15px] font-semibold text-primary"
                  >
                    Explore library
                    <ArrowRight size={13} />
                  </button>
                ) : (
                  <label className="flex items-center gap-2 rounded-lg border border-border px-3 py-2">
                    <Search size={16} className="text-muted-foreground" />
                    <input
                      aria-label="Search medicine library"
                      placeholder="Search medicines…"
                      className="w-40 bg-transparent text-xs"
                      value={query}
                      onChange={(event) => setQuery(event.target.value)}
                    />
                  </label>
                )}
              </div>
              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                {library
                  .filter((item) => matches(item.name))
                  .slice(0, isHome ? 3 : 4)
                  .map((item) => (
                    <button
                      key={item.name}
                      onClick={() => setDetail(item)}
                      className="!min-h-0 group flex items-center gap-3 rounded-xl border border-border p-4 text-left hover:border-[#9eb5a2] hover:bg-[#f9fbf8]"
                    >
                      <span
                        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${
                          colors[item.color]
                        }`}
                      >
                        <Pill size={21} strokeWidth={1.5} />
                      </span>
                      <div className="min-w-0 flex-1">
                        <h3 className="text-[16px] font-semibold">
                          {item.name}
                        </h3>
                        <p className="mt-1 text-[14px] text-muted-foreground">
                          {item.category}
                        </p>
                        <span className="mt-2 inline-flex items-center gap-1 text-[13px] text-[#69836b]">
                          <ShieldCheck size={11} />
                          {item.name === "Vitamin D"
                            ? "NIH reference"
                            : "MedlinePlus reference"}
                        </span>
                      </div>
                      <ChevronRight
                        size={15}
                        className="text-[#8d9c90] group-hover:text-primary"
                      />
                    </button>
                  ))}
              </div>
              {library.filter((item) => matches(item.name)).length === 0 && (
                <p className="py-8 text-center text-sm text-muted-foreground">
                  No matching medicines in this starter library.
                </p>
              )}
            </section>
          )}

          {/* Settings Page */}
          {route === "/settings" && (
            <div className={`${cardClass} max-w-3xl p-6`}>
              <h2 className={titleClass}>Reminders & workspace settings</h2>
              <div className="mt-6 flex items-center justify-between gap-4 border-b border-border pb-5">
                <div>
                  <h3 className="text-sm font-semibold">Browser reminders</h3>
                  <p className="mt-2 text-xs text-muted-foreground">
                    Active notifications while Dosewell is open in your browser.
                  </p>
                </div>
                <button
                  onClick={() =>
                    saved.reminders
                      ? setSaved((current) => ({
                          ...current,
                          reminders: false,
                        }))
                      : setModal("reminders")
                  }
                  className={primaryButton}
                >
                  {saved.reminders ? "Turn off" : "Enable"}
                </button>
              </div>

              <div className="mt-5 border-b border-border pb-5">
                <h3 className="text-sm font-semibold">User profile name</h3>
                <p className="mt-1 text-xs text-muted-foreground">
                  Veena uses this name when addressing you during reminders.
                </p>
                <div className="mt-3 flex gap-2">
                  <input
                    value={saved.userName}
                    maxLength={40}
                    onChange={(e) =>
                      setSaved((c) => ({ ...c, userName: e.target.value }))
                    }
                    className="max-w-xs rounded-lg border border-border px-3 py-2 text-sm"
                    placeholder="e.g. Jamie"
                  />
                </div>
              </div>

              <div className="mt-5 border-b border-border pb-5">
                <h3 className="text-sm font-semibold">Supabase Account</h3>
                <p className="mt-1 text-xs text-muted-foreground">
                  Logged in as <strong className="text-foreground">{user?.email}</strong>
                </p>
                <div className="mt-3 flex items-center gap-3">
                  <button
                    onClick={async () => {
                      await signOut()
                      setToast("You have been signed out.")
                    }}
                    className="!min-h-0 inline-flex items-center gap-1.5 rounded-lg border border-red-200 px-3.5 py-2 text-xs font-semibold text-red-600 hover:bg-red-50 hover:text-red-700 transition-colors"
                  >
                    <LogOut size={14} />
                    Sign out
                  </button>
                </div>
              </div>

              <div className="mt-5">
                <h3 className="text-sm font-semibold">
                  Your data stays on this device
                </h3>
                <p className="mt-2 text-xs leading-6 text-muted-foreground">
                  Prescription schedules and dose records are stored safely in
                  your local browser storage. No external server syncing.
                </p>
              </div>

              <div className="mt-6 flex flex-wrap items-center justify-between gap-4 border-t border-border pt-5">
                <div>
                  <h3 className="text-sm font-semibold">
                    Start with an empty workspace
                  </h3>
                  <p className="mt-2 text-xs text-muted-foreground">
                    Delete sample medicines and all locally saved records to
                    enter your own prescription.
                  </p>
                </div>
                <button
                  onClick={() => {
                    if (
                      window.confirm(
                        "Clear all medicines and dose records? This cannot be undone.",
                      )
                    ) {
                      setSaved({
                        medicines: [],
                        doseRecords: {},
                        date: dateKey(),
                        reminders: false,
                        demo: false,
                        userName: "Jamie",
                      })
                      setToast(
                        "Workspace cleared. Ready for your own prescription.",
                      )
                    }
                  }}
                  className="!min-h-0 rounded-lg border border-red-200 px-4 py-2.5 text-xs font-semibold text-red-700 hover:bg-red-50"
                >
                  Clear workspace
                </button>
              </div>
            </div>
          )}

          {/* Safety Disclaimer Banner */}
          <div className="mt-6 flex items-start gap-2.5 rounded-xl border border-[#e9e8db] bg-[#f7f7ef] px-4 py-3.5">
            <ShieldCheck size={17} className="mt-0.5 shrink-0 text-[#858d62]" />
            <p className="text-[14px] leading-[1.9] text-[#777c63]">
              <strong className="font-semibold text-[#626b50]">
                A companion, not a clinician.
              </strong>{" "}
              Dosewell is a reminder tool to help you stay on track with your
              prescribed schedule. It does not recommend, evaluate, or
              substitute medical advice. Always consult your doctor or
              pharmacist regarding your prescription.
            </p>
          </div>

          <footer className="mt-5 flex flex-wrap items-center justify-between gap-2 text-[13px] text-[#849087]">
            <span>
              Made for a little more peace of mind.
              <Heart size={10} className="ml-1.5 inline text-[#7b9480]" />
            </span>
            <span>
              {saved.demo
                ? "Demo workspace · Prescription schedules entered by user"
                : "Personal workspace · Stored on this device"}
            </span>
          </footer>
        </main>
      </div>

      {/* Toast Notification */}
      {toast && (
        <div
          role="status"
          className="fixed bottom-6 left-1/2 z-50 flex max-w-[90vw] -translate-x-1/2 items-center gap-3 rounded-xl bg-[#184936] px-5 py-4 text-xs font-medium text-white shadow-xl"
        >
          <Check size={17} className="shrink-0 text-[#87deae]" />
          <span>{toast}</span>
          <button
            onClick={() => setToast("")}
            aria-label="Dismiss notification"
            className="!min-h-0 ml-2 text-white/70 hover:text-white"
          >
            <X size={15} />
          </button>
        </div>
      )}

      {/* Add / Edit Medicine Modal */}
      {(modal === "add" || modal === "edit") && (
        <PrescriptionModal
          initialMedicine={editingMedicine}
          existingCount={saved.medicines.length}
          onSave={handleSaveMedicine}
          onClose={() => {
            setModal(null)
            setEditingMedicine(null)
          }}
        />
      )}

      {/* Delete Confirmation Modal */}
      {modal === "delete" && deletingMedicine && (
        <Modal
          title="Remove medicine"
          close={() => {
            setModal(null)
            setDeletingMedicine(null)
          }}
        >
          <div className="space-y-4">
            <div className="flex items-center gap-3 rounded-xl bg-red-50 p-4 text-red-900 border border-red-200">
              <AlertTriangle size={24} className="shrink-0 text-red-600" />
              <div>
                <p className="font-semibold text-sm">
                  Are you sure you want to remove {deletingMedicine.name}?
                </p>
                <p className="mt-1 text-xs text-red-700">
                  This will stop future reminders for this prescription.
                </p>
              </div>
            </div>

            <label className="flex items-start gap-2.5 cursor-pointer rounded-lg border border-border p-3 text-xs">
              <input
                type="checkbox"
                checked={deletePastRecords}
                onChange={(e) => setDeletePastRecords(e.target.checked)}
                className="mt-0.5 rounded text-primary focus:ring-primary"
              />
              <span className="text-muted-foreground">
                Also clear historical dose records for this medicine (uncheck to
                keep your past history).
              </span>
            </label>

            <div className="flex justify-end gap-3 pt-3">
              <button
                type="button"
                onClick={() => {
                  setModal(null)
                  setDeletingMedicine(null)
                }}
                className="!min-h-0 rounded-lg border border-border px-4 py-2.5 text-xs font-medium hover:bg-muted"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                className="!min-h-0 rounded-lg bg-red-600 px-4 py-2.5 text-xs font-semibold text-white hover:bg-red-700"
              >
                Remove medicine
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* Reminders Modal */}
      {modal === "reminders" && (
        <Modal title="A gentle reminder" close={() => setModal(null)}>
          <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-secondary text-primary">
            <Bell size={27} />
          </div>
          <p className="text-sm leading-7">
            Get browser notifications at the exact daily times specified in your
            prescription. Keep Dosewell open in your browser.
          </p>
          <p className="mt-3 text-xs leading-6 text-muted-foreground">
            Browser permission is required. Dosewell sounds your gentle reminder
            at the exact times you entered.
          </p>
          {notificationError && (
            <p
              role="alert"
              className="mt-4 rounded-lg bg-amber-50 p-3 text-xs leading-5 text-amber-800"
            >
              {notificationError}
            </p>
          )}
          <button
            onClick={() =>
              saved.reminders
                ? (setSaved((current) => ({ ...current, reminders: false })),
                  setModal(null))
                : void enableReminders()
            }
            className={`${primaryButton} mt-6 w-full`}
          >
            <Bell size={16} />
            {saved.reminders
              ? "Turn off browser reminders"
              : "Enable browser reminders"}
          </button>
        </Modal>
      )}

      {/* Help Modal */}
      {modal === "help" && (
        <Modal
          title="Prescription management guide"
          close={() => setModal(null)}
        >
          <div className="space-y-5 text-sm">
            <div>
              <h3 className="font-semibold text-foreground">
                How do I set up my prescription?
              </h3>
              <p className="mt-2 text-xs leading-6 text-muted-foreground">
                Click <strong>Add medicine</strong> to configure your medicine
                exactly as written on your prescription label: name, dosage
                (e.g. 1 tablet, 2 capsules, 5 ml), frequency, specific reminder
                times, start/end dates, and food instructions.
              </p>
            </div>
            <div>
              <h3 className="font-semibold text-foreground">
                Multiple daily times
              </h3>
              <p className="mt-2 text-xs leading-6 text-muted-foreground">
                If your medicine is taken 3 times a day (e.g. 8:00 AM, 2:00 PM,
                8:00 PM), each is tracked as a distinct dose. Completing the
                morning dose leaves subsequent doses pending.
              </p>
            </div>
            <div>
              <h3 className="font-semibold text-foreground">Skipping doses</h3>
              <p className="mt-2 text-xs leading-6 text-muted-foreground">
                Dosewell will never automatically skip doses. If you are
                instructed to skip a dose, you can explicitly click the Skip
                button on that dose card.
              </p>
            </div>
          </div>
        </Modal>
      )}

      {/* Profile Modal */}
      {modal === "profile" && (
        <Modal title="Your personal workspace" close={() => setModal(null)}>
          <div className="flex items-center gap-4">
            <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-[#e8d5b9] font-display text-lg font-bold text-[#594838]">
              {userInitials}
            </span>
            <div className="min-w-0 flex-1">
              <h3 className="font-semibold text-foreground truncate">
                {userDisplayName}
              </h3>
              <p className="mt-0.5 text-xs text-muted-foreground truncate">
                {user?.email || "Supabase authenticated"}
              </p>
              <div className="mt-1.5 flex items-center gap-1.5">
                <span className="inline-flex items-center gap-1 rounded-full bg-[#edf5ef] px-2 py-0.5 text-[11px] font-medium text-[#24533f]">
                  <ShieldCheck size={12} className="text-[#3b8260]" />
                  {user?.email_confirmed_at ? "Email verified" : "Active session"}
                </span>
              </div>
            </div>
          </div>
          <p className="mt-5 text-xs leading-6 text-muted-foreground">
            Authenticated securely with Supabase Auth. Your prescription routines
            and dose history are kept active for this account.
          </p>
          <div className="mt-5 space-y-2.5">
            <button
              onClick={() => {
                setModal(null)
                navigate("/settings")
              }}
              className={`${primaryButton} w-full`}
            >
              Manage workspace settings
              <ArrowRight size={15} />
            </button>
            <button
              onClick={async () => {
                setModal(null)
                await signOut()
                setToast("You have been signed out.")
              }}
              className="!min-h-0 w-full inline-flex items-center justify-center gap-2 rounded-lg border border-red-200 bg-white px-4 py-2.5 text-xs font-semibold text-red-600 hover:bg-red-50 hover:text-red-700 transition-colors"
            >
              <LogOut size={14} />
              Sign out of Dosewell
            </button>
          </div>
        </Modal>
      )}

      {/* Library Detail Modal */}
      {detail && (
        <Modal title={detail.name} close={() => setDetail(null)}>
          <span className="rounded-full bg-secondary px-3 py-1 text-xs font-medium text-primary">
            {detail.category}
          </span>
          <p className="mt-5 text-sm leading-7">{detail.description}</p>
          <div className="mt-5 rounded-xl bg-[#f7f7ef] p-4">
            <div className="flex items-center gap-2 text-xs font-semibold">
              <ShieldCheck size={16} />
              Information, not medical advice
            </div>
            <p className="mt-2 text-xs leading-6 text-muted-foreground">
              This summary is for educational reference. Consult your doctor or
              pharmacist for medical advice.
            </p>
          </div>
          <a
            href={detail.url}
            target="_blank"
            rel="noopener noreferrer"
            className={`${primaryButton} mt-5 w-full`}
          >
            Read reference page
            <ArrowRight size={15} />
          </a>
        </Modal>
      )}
    </AppShell>
  )
}

// -------------------------------------------------------------
// Interactive Prescription Add / Edit Modal
// -------------------------------------------------------------
function PrescriptionModal({
  initialMedicine,
  existingCount,
  onSave,
  onClose,
}: {
  initialMedicine: Medicine | null
  existingCount: number
  onSave: (med: Medicine) => void
  onClose: () => void
}) {
  const isEditing = Boolean(initialMedicine)

  const [name, setName] = useState(initialMedicine?.name || "")
  const [type, setType] = useState<MedicineType>(
    initialMedicine?.type || "Tablet",
  )
  const [dosage, setDosage] = useState(initialMedicine?.dosage || "1 tablet")
  const [doseAmount, setDoseAmount] = useState(
    initialMedicine?.doseAmount || "1",
  )
  const [dosageUnit, setDosageUnit] = useState(
    initialMedicine?.dosageUnit || "tablet",
  )
  const [strength, setStrength] = useState(initialMedicine?.strength || "")
  const [frequency, setFrequency] = useState<FrequencyType>(
    initialMedicine?.frequency || "Once a day",
  )
  const [times, setTimes] = useState<string[]>(
    initialMedicine?.times && initialMedicine.times.length > 0
      ? initialMedicine.times
      : ["08:00"],
  )
  const [daysOfWeek, setDaysOfWeek] = useState<number[]>(
    initialMedicine?.daysOfWeek || [0, 1, 2, 3, 4, 5, 6],
  )
  const [startDate, setStartDate] = useState(
    initialMedicine?.startDate || dateKey(),
  )
  const [hasEndDate, setHasEndDate] = useState(
    Boolean(initialMedicine?.endDate),
  )
  const [endDate, setEndDate] = useState(initialMedicine?.endDate || "")
  const [foodInstruction, setFoodInstruction] = useState<FoodInstruction>(
    initialMedicine?.foodInstruction || "After food",
  )
  const [instructions, setInstructions] = useState(
    initialMedicine?.instructions || "",
  )
  const [notes, setNotes] = useState(initialMedicine?.notes || "")

  // Quick dosage presets helper
  function updateQuickDosage(amt: string, unit: string) {
    setDoseAmount(amt)
    setDosageUnit(unit)
    setDosage(`${amt} ${unit}`.trim())
  }

  // Handle frequency change with smart default times
  function handleFrequencyChange(newFreq: FrequencyType) {
    setFrequency(newFreq)
    const defaults = getDefaultTimesForFrequency(newFreq)
    setTimes(defaults)
  }

  function addTimeSlot() {
    setTimes((current) => [...current, "12:00"])
  }

  function updateTimeSlot(index: number, value: string) {
    setTimes((current) => {
      const copy = [...current]
      copy[index] = value
      return copy
    })
  }

  function removeTimeSlot(index: number) {
    if (times.length <= 1) return
    setTimes((current) => current.filter((_, i) => i !== index))
  }

  function toggleDayOfWeek(dayVal: number) {
    setDaysOfWeek((current) =>
      current.includes(dayVal)
        ? current.filter((d) => d !== dayVal)
        : [...current, dayVal],
    )
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!name.trim() || !dosage.trim()) return

    const finalTimes = times.length ? times : ["08:00"]
    // Sort times
    finalTimes.sort()

    const medicine: Medicine = {
      id: initialMedicine?.id || crypto.randomUUID(),
      name: name.trim(),
      type,
      dosage: dosage.trim(),
      doseAmount: doseAmount.trim(),
      dosageUnit: dosageUnit.trim(),
      strength: strength.trim(),
      frequency,
      times: finalTimes,
      daysOfWeek: daysOfWeek.length ? daysOfWeek : [0, 1, 2, 3, 4, 5, 6],
      startDate,
      endDate: hasEndDate ? endDate : "",
      foodInstruction,
      instructions: instructions.trim(),
      notes: notes.trim(),
      active: true,
      color: initialMedicine ? initialMedicine.color : existingCount % 4,
    }

    onSave(medicine)
  }

  return (
    <Modal
      title={
        isEditing
          ? `Edit ${initialMedicine?.name} prescription`
          : "Add prescription medicine"
      }
      close={onClose}
      maxWidth="max-w-2xl"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        <p className="text-xs text-muted-foreground leading-5">
          Configure your medicine schedule strictly according to your
          prescription. Dosewell generates exact reminders based on your entered
          dosage, times, and instructions.
        </p>

        {/* 1. Name & Type */}
        <div className="space-y-3">
          <label className="block text-xs font-semibold text-foreground">
            Medicine name *
            <input
              required
              autoFocus={!isEditing}
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Paracetamol, Metformin, Amoxicillin"
              className="mt-1.5 w-full rounded-lg border border-border px-3.5 py-2.5 text-sm outline-none focus:border-primary"
            />
          </label>

          <div>
            <span className="block text-xs font-semibold text-foreground mb-1.5">
              Medicine type
            </span>
            <div className="flex flex-wrap gap-1.5">
              {medicineTypes.map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setType(t)}
                  className={`!min-h-0 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                    type === t
                      ? "bg-primary text-white"
                      : "border border-border bg-white text-muted-foreground hover:bg-muted hover:text-foreground"
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* 2. Custom Dosage & Strength */}
        <div className="rounded-xl border border-border bg-[#fbfcfb] p-4 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-foreground">
              Dosage configuration
            </span>
            <span className="text-[11px] text-muted-foreground">
              Used in reminders and spoken aloud
            </span>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block text-xs font-semibold text-foreground">
              Exact dosage *
              <input
                required
                value={dosage}
                onChange={(e) => setDosage(e.target.value)}
                placeholder="e.g. 1 tablet, 2 capsules, 5 ml, ½ tablet"
                className="mt-1.5 w-full rounded-lg border border-border bg-white px-3 py-2 text-sm font-medium"
              />
            </label>

            <label className="block text-xs font-semibold text-foreground">
              Strength{" "}
              <span className="font-normal text-muted-foreground">
                (optional)
              </span>
              <input
                value={strength}
                onChange={(e) => setStrength(e.target.value)}
                placeholder="e.g. 500 mg, 650 mg, 1000 IU"
                className="mt-1.5 w-full rounded-lg border border-border bg-white px-3 py-2 text-sm"
              />
            </label>
          </div>

          {/* Quick Dosage Presets */}
          <div>
            <span className="text-[11px] font-medium text-muted-foreground">
              Quick amount shortcuts:
            </span>
            <div className="mt-1.5 flex flex-wrap gap-1.5">
              {["½", "1", "2", "3", "5", "10", "15"].map((amt) => (
                <button
                  key={amt}
                  type="button"
                  onClick={() => updateQuickDosage(amt, dosageUnit || "tablet")}
                  className="!min-h-0 rounded border border-border bg-white px-2 py-0.5 text-xs text-muted-foreground hover:border-primary hover:text-primary"
                >
                  {amt}
                </button>
              ))}
              <span className="self-center mx-1 text-xs text-muted-foreground">
                |
              </span>
              {["tablet", "tablets", "capsule", "capsules", "ml", "drops"].map(
                (u) => (
                  <button
                    key={u}
                    type="button"
                    onClick={() => updateQuickDosage(doseAmount || "1", u)}
                    className="!min-h-0 rounded border border-border bg-white px-2 py-0.5 text-xs text-muted-foreground hover:border-primary hover:text-primary"
                  >
                    {u}
                  </button>
                ),
              )}
            </div>
          </div>
        </div>

        {/* 3. Frequency & Multiple Daily Reminder Times */}
        <div className="rounded-xl border border-border bg-[#fbfcfb] p-4 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-foreground">
              Frequency & reminder times
            </span>
            <span className="text-[11px] text-muted-foreground">
              {times.length} dose{times.length > 1 ? "s" : ""} per day
            </span>
          </div>

          <label className="block text-xs font-semibold text-foreground">
            Schedule frequency
            <select
              value={frequency}
              onChange={(e) =>
                handleFrequencyChange(e.target.value as FrequencyType)
              }
              className="mt-1.5 w-full rounded-lg border border-border bg-white px-3 py-2 text-sm font-medium"
            >
              {frequencyOptions.map((f) => (
                <option key={f} value={f}>
                  {f}
                </option>
              ))}
            </select>
          </label>

          {/* Days of week selector if certain days */}
          {(frequency === "Certain days of the week" ||
            frequency === "Custom schedule") && (
            <div className="pt-1">
              <span className="block text-xs font-semibold text-foreground mb-1.5">
                Active days of the week
              </span>
              <div className="flex flex-wrap gap-1.5">
                {daysOfWeekList.map(({ label, value }) => {
                  const isSelected = daysOfWeek.includes(value)
                  return (
                    <button
                      key={value}
                      type="button"
                      onClick={() => toggleDayOfWeek(value)}
                      className={`!min-h-0 h-8 w-11 rounded-lg text-xs font-semibold transition-colors ${
                        isSelected
                          ? "bg-primary text-white"
                          : "border border-border bg-white text-muted-foreground hover:bg-muted"
                      }`}
                    >
                      {label}
                    </button>
                  )
                })}
              </div>
            </div>
          )}

          {/* Daily Reminder Time Pickers */}
          <div className="pt-2">
            <span className="block text-xs font-semibold text-foreground mb-2">
              Configured daily reminder times
            </span>
            <div className="grid gap-2 sm:grid-cols-2">
              {times.map((t, idx) => (
                <div
                  key={idx}
                  className="flex items-center gap-2 rounded-lg border border-border bg-white px-3 py-1.5 shadow-sm"
                >
                  <Clock3 size={15} className="text-muted-foreground" />
                  <input
                    type="time"
                    required
                    value={t}
                    onChange={(e) => updateTimeSlot(idx, e.target.value)}
                    className="flex-1 bg-transparent text-sm font-semibold text-foreground outline-none"
                  />
                  <span className="text-xs text-muted-foreground">
                    {timeLabel(t)}
                  </span>
                  {times.length > 1 && (
                    <button
                      type="button"
                      aria-label="Remove time"
                      onClick={() => removeTimeSlot(idx)}
                      className="!min-h-0 rounded p-1 text-muted-foreground hover:text-red-600"
                    >
                      <X size={14} />
                    </button>
                  )}
                </div>
              ))}
            </div>

            <button
              type="button"
              onClick={addTimeSlot}
              className="!min-h-0 mt-2.5 flex items-center gap-1.5 text-xs font-semibold text-primary hover:underline"
            >
              <Plus size={14} />
              Add another reminder time
            </button>
          </div>
        </div>

        {/* 4. Food Instruction & Custom Instructions */}
        <div className="space-y-4">
          <div>
            <span className="block text-xs font-semibold text-foreground mb-1.5">
              Food instructions
            </span>
            <div className="flex flex-wrap gap-1.5">
              {foodInstructionOptions.map((f) => (
                <button
                  key={f}
                  type="button"
                  onClick={() => setFoodInstruction(f)}
                  className={`!min-h-0 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                    foodInstruction === f
                      ? "bg-primary text-white"
                      : "border border-border bg-white text-muted-foreground hover:bg-muted hover:text-foreground"
                  }`}
                >
                  {f}
                </button>
              ))}
            </div>
          </div>

          <label className="block text-xs font-semibold text-foreground">
            Custom instructions{" "}
            <span className="font-normal text-muted-foreground">
              (spoken in reminder)
            </span>
            <input
              value={instructions}
              maxLength={120}
              onChange={(e) => setInstructions(e.target.value)}
              placeholder="e.g. Take with plenty of water, Take after breakfast"
              className="mt-1.5 w-full rounded-lg border border-border px-3.5 py-2 text-sm"
            />
          </label>

          {/* Quick instructions chips */}
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-[11px] text-muted-foreground">
              Suggestions:
            </span>
            {quickInstructions.map((chip) => (
              <button
                key={chip}
                type="button"
                onClick={() => setInstructions(chip)}
                className="!min-h-0 rounded border border-border bg-[#f8faf7] px-2 py-0.5 text-[11px] text-[#4f6755] hover:bg-[#ebf2ec]"
              >
                {chip}
              </button>
            ))}
          </div>
        </div>

        {/* 5. Prescription Duration */}
        <div className="rounded-xl border border-border bg-[#fbfcfb] p-4 space-y-3">
          <span className="block text-xs font-bold text-foreground">
            Prescription duration
          </span>

          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block text-xs font-semibold text-foreground">
              Start date *
              <input
                type="date"
                required
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="mt-1.5 w-full rounded-lg border border-border bg-white px-3 py-2 text-sm"
              />
            </label>

            <div>
              <label className="block text-xs font-semibold text-foreground">
                End date
                <input
                  type="date"
                  disabled={!hasEndDate}
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="mt-1.5 w-full rounded-lg border border-border bg-white px-3 py-2 text-sm disabled:opacity-40 disabled:bg-stone-50"
                />
              </label>

              <label className="mt-2 flex items-center gap-2 cursor-pointer text-xs text-muted-foreground">
                <input
                  type="checkbox"
                  checked={!hasEndDate}
                  onChange={(e) => {
                    const checked = e.target.checked
                    setHasEndDate(!checked)
                    if (checked) setEndDate("")
                  }}
                  className="rounded text-primary focus:ring-primary"
                />
                Ongoing schedule (no end date)
              </label>
            </div>
          </div>
          {hasEndDate && endDate && (
            <p className="text-[11px] text-muted-foreground italic">
              Dosewell will automatically stop reminders for this medicine after{" "}
              {endDate}.
            </p>
          )}
        </div>

        {/* 6. Notes */}
        <label className="block text-xs font-semibold text-foreground">
          Prescription notes{" "}
          <span className="font-normal text-muted-foreground">(optional)</span>
          <input
            value={notes}
            maxLength={140}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="e.g. Prescribed by Dr. Smith for 7 days"
            className="mt-1.5 w-full rounded-lg border border-border px-3.5 py-2 text-sm"
          />
        </label>

        {/* Modal Buttons */}
        <div className="flex justify-end gap-3 pt-3 border-t border-border">
          <button
            type="button"
            onClick={onClose}
            className="!min-h-0 rounded-lg border border-border px-4 py-2.5 text-xs font-medium hover:bg-muted"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="!min-h-0 inline-flex items-center justify-center gap-1.5 rounded-lg bg-primary px-5 py-2.5 text-xs font-semibold text-white hover:bg-[#286b54]"
          >
            <Check size={16} />
            {isEditing ? "Save prescription changes" : "Add to routine"}
          </button>
        </div>
      </form>
    </Modal>
  )
}

const router = createBrowserRouter([
  { path: "/", Component: Dashboard },
  { path: "/medicines", Component: Dashboard },
  { path: "/schedule", Component: Dashboard },
  { path: "/library", Component: Dashboard },
  { path: "/settings", Component: Dashboard },
  { path: "*", Component: Dashboard },
])

export default function App() {
  return (
    <AuthProvider>
      <RouterProvider router={router} />
    </AuthProvider>
  )
}
