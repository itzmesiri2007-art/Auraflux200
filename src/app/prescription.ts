export type MedicineType = "Tablet" | "Capsule" | "Syrup" | "Injection" | "Drops" | "Cream" | "Other"

export type FoodInstruction = "Before food" | "After food" | "With food" | "On an empty stomach" | "Any time"

export type FrequencyType = "Once a day" | "Twice a day" | "Three times a day" | "Four times a day" | "Every X hours" | "Specific times" | "Certain days of the week" | "Custom schedule"

export type DoseStatus = "scheduled" | "due" | "snoozed" | "taken" | "skipped"

export type Medicine = {
  id: string
  name: string
  type: MedicineType
  dosage: string // e.g. "1 tablet", "2 capsules", "5 ml", "10 drops", "½ tablet", "500 mg"
  doseAmount?: string
  dosageUnit?: string
  strength?: string // e.g. "500 mg", "1000 IU"
  frequency: FrequencyType
  times: string[] // e.g. ["08:00", "14:00", "20:00"]
  daysOfWeek?: number[] // 0 = Sun, 1 = Mon, ..., 6 = Sat
  intervalHours?: number
  startDate: string // YYYY-MM-DD
  endDate?: string // YYYY-MM-DD (optional or empty)
  foodInstruction: FoodInstruction
  instructions?: string // prescription-specific instructions, e.g. "Take with plenty of water"
  notes?: string // optional notes
  active: boolean
  color: number
}

export type DoseRecord = {
  status: "taken" | "skipped"
  timestamp: string
}

export type ScheduledDose = {
  doseId: string // `${dateKey}_${medicine.id}_${time}`
  medicineId: string
  medicine: Medicine
  scheduledDate: string // YYYY-MM-DD
  scheduledTime: string // HH:mm
  status: DoseStatus
}

export type SavedState = {
  medicines: Medicine[]
  doseRecords: Record<string, DoseRecord>
  taken?: string[] // legacy support
  date: string
  reminders: boolean
  demo: boolean
  userName: string
}

export const dateKey = (d: Date = new Date()) => {
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, "0")
  const day = String(d.getDate()).padStart(2, "0")
  return `${year}-${month}-${day}`
}

export function timeLabel(time: string): string {
  if (!time || !time.includes(":")) return time || "12:00 AM"
  const [hours, minutes] = time.split(":").map(Number)
  const period = hours >= 12 ? "PM" : "AM"
  const displayHours = hours % 12 || 12
  return `${displayHours}:${String(minutes).padStart(2, "0")} ${period}`
}

export function formatTime24(time: string): string {
  if (!time) return "08:00"
  const [h, m] = time.split(":").map(Number)
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`
}

export const samplePrescriptions: Medicine[] = [
  {
    id: "1",
    name: "Vitamin D3",
    type: "Capsule",
    dosage: "1 softgel",
    doseAmount: "1",
    dosageUnit: "softgel",
    strength: "1000 IU",
    frequency: "Once a day",
    times: ["08:00"],
    startDate: "2026-01-01",
    endDate: "",
    foodInstruction: "With food",
    instructions: "Take with breakfast",
    notes: "Supports bone and immune health",
    active: true,
    color: 0,
  },
  {
    id: "2",
    name: "Lisinopril",
    type: "Tablet",
    dosage: "1 tablet",
    doseAmount: "1",
    dosageUnit: "tablet",
    strength: "10 mg",
    frequency: "Once a day",
    times: ["08:00"],
    startDate: "2026-01-01",
    endDate: "",
    foodInstruction: "Before food",
    instructions: "Take with a glass of water",
    notes: "Blood pressure management",
    active: true,
    color: 1,
  },
  {
    id: "3",
    name: "Metformin",
    type: "Tablet",
    dosage: "1 tablet",
    doseAmount: "1",
    dosageUnit: "tablet",
    strength: "500 mg",
    frequency: "Twice a day",
    times: ["08:00", "20:00"],
    startDate: "2026-01-01",
    endDate: "",
    foodInstruction: "After food",
    instructions: "Take after lunch and dinner",
    notes: "Type 2 diabetes support",
    active: true,
    color: 2,
  },
  {
    id: "4",
    name: "Paracetamol",
    type: "Tablet",
    dosage: "1 tablet",
    doseAmount: "1",
    dosageUnit: "tablet",
    strength: "650 mg",
    frequency: "Three times a day",
    times: ["08:00", "14:00", "20:00"],
    startDate: "2026-01-01",
    endDate: "",
    foodInstruction: "After food",
    instructions: "Take with plenty of water",
    notes: "Prescribed 3 times a day for relief",
    active: true,
    color: 3,
  },
]

export function getDosesForDate(
  medicines: Medicine[],
  date: Date,
  doseRecords: Record<string, DoseRecord> = {},
): ScheduledDose[] {
  const currentKey = dateKey(date)
  const dayOfWeek = date.getDay() // 0 = Sun, 1 = Mon ...
  const doses: ScheduledDose[] = []

  for (const med of medicines) {
    if (!med.active) continue

    // Check Start Date
    if (med.startDate && currentKey < med.startDate) {
      continue
    }

    // Check End Date
    if (med.endDate && currentKey > med.endDate) {
      continue
    }

    // Check Certain Days of Week
    if (
      med.frequency === "Certain days of the week" &&
      Array.isArray(med.daysOfWeek) &&
      med.daysOfWeek.length > 0
    ) {
      if (!med.daysOfWeek.includes(dayOfWeek)) {
        continue
      }
    }

    const times =
      Array.isArray(med.times) && med.times.length > 0 ? med.times : ["08:00"]

    for (const time of times) {
      const doseId = `${currentKey}_${med.id}_${time}`
      const rec = doseRecords[doseId]

      let status: DoseStatus = "scheduled"
      if (rec?.status === "taken") {
        status = "taken"
      } else if (rec?.status === "skipped") {
        status = "skipped"
      }

      doses.push({
        doseId,
        medicineId: med.id,
        medicine: med,
        scheduledDate: currentKey,
        scheduledTime: time,
        status,
      })
    }
  }

  // Sort chronologically by scheduled time
  doses.sort((a, b) => {
    const timeCompare = a.scheduledTime.localeCompare(b.scheduledTime)
    if (timeCompare !== 0) return timeCompare
    return a.medicine.name.localeCompare(b.medicine.name)
  })

  return doses
}

export function getDefaultTimesForFrequency(
  freq: FrequencyType,
  intervalHours = 6,
): string[] {
  switch (freq) {
    case "Once a day":
      return ["08:00"]
    case "Twice a day":
      return ["08:00", "20:00"]
    case "Three times a day":
      return ["08:00", "14:00", "20:00"]
    case "Four times a day":
      return ["08:00", "12:00", "16:00", "20:00"]
    case "Every X hours": {
      const times: string[] = []
      const step = Math.max(1, Math.min(24, intervalHours))
      for (let hour = 8; hour < 24; hour += step) {
        times.push(`${String(hour).padStart(2, "0")}:00`)
      }
      return times.length ? times : ["08:00"]
    }
    case "Certain days of the week":
      return ["08:00"]
    case "Specific times":
      return ["08:00", "14:00"]
    case "Custom schedule":
    default:
      return ["08:00"]
  }
}
