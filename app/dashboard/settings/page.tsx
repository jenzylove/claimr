import { Suspense } from "react"
import { SettingsContent } from "@/components/claimr/settings-content"

export default function SettingsPage() {
  return (
    <div className="min-h-screen p-8">
      {/* Subtle background gradient */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -right-40 top-0 h-[500px] w-[500px] rounded-full bg-[#FF2D7A]/5 blur-[120px]" />
        <div className="absolute -left-40 bottom-0 h-[500px] w-[500px] rounded-full bg-[#2D6EFF]/5 blur-[120px]" />
      </div>

      <div className="relative mx-auto max-w-2xl">
        <Suspense fallback={null}>
          <SettingsContent />
        </Suspense>
      </div>
    </div>
  )
}