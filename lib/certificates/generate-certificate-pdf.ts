import { PDFDocument, rgb, StandardFonts } from 'pdf-lib'

export type CertificatePdfData = {
  studentName: string
  courseTitle: string
  certificateCode: string
  issuedAt: string
  finalScore?: number | null
  academyName?: string
}

export async function generateCertificatePdf(data: CertificatePdfData): Promise<Uint8Array> {
  const doc = await PDFDocument.create()
  const page = doc.addPage([842, 595])
  const { width, height } = page.getSize()

  const bold = await doc.embedFont(StandardFonts.HelveticaBold)
  const regular = await doc.embedFont(StandardFonts.Helvetica)
  const academy = data.academyName ?? 'Trading Cube Academy'

  const gold = rgb(0.85, 0.65, 0.1)
  const dark = rgb(0.12, 0.12, 0.12)
  const muted = rgb(0.45, 0.45, 0.45)

  page.drawRectangle({
    x: 28,
    y: 28,
    width: width - 56,
    height: height - 56,
    borderColor: gold,
    borderWidth: 3,
  })
  page.drawRectangle({
    x: 36,
    y: 36,
    width: width - 72,
    height: height - 72,
    borderColor: rgb(0.75, 0.75, 0.75),
    borderWidth: 1,
  })

  const center = (text: string, size: number, font: typeof bold, y: number, color = dark) => {
    const tw = font.widthOfTextAtSize(text, size)
    page.drawText(text, { x: (width - tw) / 2, y, size, font, color })
  }

  center(academy.toUpperCase(), 11, regular, height - 80, muted)
  center('Certificate of Completion', 28, bold, height - 130, dark)
  center('This certifies that', 12, regular, height - 175, muted)
  center(data.studentName, 32, bold, height - 220, dark)
  center('has successfully completed', 12, regular, height - 260, muted)
  center(data.courseTitle, 22, bold, height - 300, gold)

  if (data.finalScore != null) {
    center(`Final score · ${data.finalScore}%`, 12, regular, height - 340, rgb(0.1, 0.55, 0.3))
  }

  const issued = new Date(data.issuedAt).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
  center(`Issued ${issued}`, 10, regular, 90, muted)
  center(`Certificate ID · ${data.certificateCode}`, 10, regular, 72, muted)

  return doc.save()
}
