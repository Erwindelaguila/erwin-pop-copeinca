"use client"

import { Button } from "./ui/button"

interface StatusTabsProps {
  activeTab: "historial" | "pendiente"
  onTabChange: (tab: "historial" | "pendiente") => void
  historialCount: number
  pendienteCount: number
}

export function StatusTabs({ activeTab, onTabChange, historialCount, pendienteCount }: StatusTabsProps) {
  return (
    <div className="flex space-x-2 mb-6">
      <Button
        variant={activeTab === "historial" ? "default" : "outline"}
        onClick={() => onTabChange("historial")}
        className={`px-4 py-2 rounded-md font-medium ${
          activeTab === "historial"
            ? "bg-blue-600 text-white hover:bg-blue-700"
            : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
        }`}
      >
        Historial
        <span className="ml-2 px-2 py-1 text-xs bg-white/20 rounded-full">{historialCount}</span>
      </Button>
      <Button
        variant={activeTab === "pendiente" ? "default" : "outline"}
        onClick={() => onTabChange("pendiente")}
        className={`px-4 py-2 rounded-md font-medium ${
          activeTab === "pendiente"
            ? "bg-blue-600 text-white hover:bg-blue-700"
            : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
        }`}
      >
        Pendiente
        <span className="ml-2 px-2 py-1 text-xs bg-white/20 rounded-full">{pendienteCount}</span>
      </Button>
    </div>
  )
}
