"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Download, Printer } from "lucide-react"

interface PDFPreviewProps {
  isOpen: boolean
  onClose: () => void
  document: any
}

export function PDFPreview({ isOpen, onClose, document }: PDFPreviewProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>Vista Previa PDF - {document?.numero}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="bg-white border rounded-lg p-6 min-h-[600px]">
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold">{document?.numero}</h2>
              <p className="text-lg text-gray-600">{document?.tipo?.toUpperCase()}</p>
            </div>

            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold mb-2">Objetivo</h3>
                <p className="text-gray-700">{document?.objetivo || "No especificado"}</p>
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-2">Alcance</h3>
                <p className="text-gray-700">{document?.alcance || "No especificado"}</p>
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-2">Desarrollo</h3>
                <p className="text-gray-700">{document?.desarrollo || "No especificado"}</p>
              </div>
            </div>
          </div>

          <div className="flex justify-end space-x-2">
            <Button variant="outline">
              <Printer className="h-4 w-4 mr-2" />
              Imprimir
            </Button>
            <Button variant="outline">
              <Download className="h-4 w-4 mr-2" />
              Descargar PDF
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
