import { jsPDF } from 'jspdf'
import type { PageConfig } from '@/types/layout'
import { PAPER_SIZES_MM, getPageDimensions } from '@/types/layout'

export async function exportToPdf(
  canvasDataUrl: string,
  pageConfig: PageConfig,
): Promise<void> {
  const { paperSize, orientation } = pageConfig
  const dims = getPageDimensions(PAPER_SIZES_MM[paperSize], orientation)

  const pageW = dims.widthMm
  const pageH = dims.heightMm

  const pdfOrientation = orientation === 'landscape' ? 'l' : 'p'
  let format: [number, number] | string = pageSizeToFormat(paperSize)

  if (Array.isArray(format) && orientation === 'landscape') {
    format = [format[1], format[0]]
  }

  const doc = new jsPDF({
    orientation: pdfOrientation,
    unit: 'mm',
    format,
  })

  doc.addImage(canvasDataUrl, 'PNG', 0, 0, pageW, pageH, undefined, 'FAST')
  doc.save('map.pdf')
}

function pageSizeToFormat(paperSize: string): [number, number] | string {
  switch (paperSize) {
    case 'A4':
      return [210, 297]
    case 'A3':
      return [297, 420]
    case 'Letter':
      return [215.9, 279.4]
    default:
      return 'a4'
  }
}
