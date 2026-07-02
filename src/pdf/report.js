import { jsPDF } from 'jspdf'
import autoTable from 'jspdf-autotable'

// Brand palette translated to RGB for the PDF canvas (light "document" theme
// so it prints cleanly, with the navy/gold identity retained in the chrome).
const NAVY = [10, 20, 36]
const NAVY_SOFT = [23, 44, 72]
const GOLD = [176, 143, 66]
const INK = [30, 41, 59]
const MUTED = [110, 122, 140]
const OK = [46, 125, 90]
const DANGER = [176, 58, 46]
const HAIRLINE = [222, 227, 235]
const ZEBRA = [246, 248, 251]

const MARGIN = 48

function fmtDate(d) {
  return d.toLocaleString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

// Draws the running header/footer on every page.
function decoratePages(doc, generatedAt) {
  const pageCount = doc.getNumberOfPages()
  const w = doc.internal.pageSize.getWidth()
  const h = doc.internal.pageSize.getHeight()

  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i)

    // Header band
    doc.setFillColor(...NAVY)
    doc.rect(0, 0, w, 30, 'F')
    doc.setFillColor(...GOLD)
    doc.rect(0, 30, w, 1.4, 'F')

    doc.setFont('helvetica', 'bold')
    doc.setFontSize(10)
    doc.setTextColor(255, 255, 255)
    doc.text('SENTINEL', MARGIN, 19)
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(8)
    doc.setTextColor(200, 169, 90)
    doc.text('COMPLIANCE MANAGER', MARGIN + 58, 19)

    doc.setTextColor(180, 190, 205)
    doc.setFontSize(7.5)
    doc.text('CONFIDENTIAL', w - MARGIN, 19, { align: 'right' })

    // Footer
    doc.setDrawColor(...HAIRLINE)
    doc.setLineWidth(0.5)
    doc.line(MARGIN, h - 30, w - MARGIN, h - 30)
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(7.5)
    doc.setTextColor(...MUTED)
    doc.text(`Generated ${fmtDate(generatedAt)}`, MARGIN, h - 18)
    doc.text(`Page ${i} of ${pageCount}`, w - MARGIN, h - 18, { align: 'right' })
  }
}

export function generateComplianceReport({ user, organizations, generatedAt = new Date() }) {
  const doc = new jsPDF({ unit: 'pt', format: 'a4' })
  const w = doc.internal.pageSize.getWidth()
  const contentW = w - MARGIN * 2

  // ---------------------------------------------------------------- Aggregates
  const totalMembers = organizations.reduce((s, o) => s + o.summary.total, 0)
  const totalCompliant = organizations.reduce((s, o) => s + o.summary.compliant, 0)
  const totalNon = organizations.reduce((s, o) => s + o.summary.nonCompliantCount, 0)
  const overallPct = totalMembers === 0 ? 100 : Math.round((totalCompliant / totalMembers) * 100)

  // ------------------------------------------------------------ Cover / summary
  let y = 78
  doc.setFont('times', 'normal')
  doc.setFontSize(30)
  doc.setTextColor(...NAVY)
  doc.text('Compliance Assessment', MARGIN, y)

  y += 22
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(10.5)
  doc.setTextColor(...MUTED)
  doc.text('Multi-Factor Authentication posture across all selected organizations.', MARGIN, y)

  y += 16
  doc.setFontSize(9)
  doc.setTextColor(...INK)
  const preparedFor = user?.name || user?.email || 'Authorized reviewer'
  doc.text(`Prepared for:  ${preparedFor}`, MARGIN, y)

  // Executive summary tiles
  y += 26
  const tiles = [
    { label: 'ORGANIZATIONS', value: String(organizations.length), color: NAVY_SOFT },
    { label: 'TOTAL MEMBERS', value: String(totalMembers), color: NAVY_SOFT },
    { label: 'COMPLIANT', value: String(totalCompliant), color: OK },
    { label: 'NON-COMPLIANT', value: String(totalNon), color: DANGER },
  ]
  const gap = 12
  const tileW = (contentW - gap * (tiles.length - 1)) / tiles.length
  const tileH = 64
  tiles.forEach((t, i) => {
    const x = MARGIN + i * (tileW + gap)
    doc.setFillColor(...ZEBRA)
    doc.setDrawColor(...HAIRLINE)
    doc.roundedRect(x, y, tileW, tileH, 4, 4, 'FD')
    doc.setFillColor(...t.color)
    doc.rect(x, y, 3, tileH, 'F')
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(22)
    doc.setTextColor(...t.color)
    doc.text(t.value, x + 14, y + 34)
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(7.5)
    doc.setTextColor(...MUTED)
    doc.text(t.label, x + 14, y + 50)
  })

  y += tileH + 24

  // Overall compliance meter
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(9)
  doc.setTextColor(...INK)
  doc.text('Overall MFA compliance', MARGIN, y)
  doc.setTextColor(...(overallPct >= 80 ? OK : overallPct >= 50 ? GOLD : DANGER))
  doc.text(`${overallPct}%`, w - MARGIN, y, { align: 'right' })
  y += 8
  const barH = 9
  doc.setFillColor(236, 239, 244)
  doc.roundedRect(MARGIN, y, contentW, barH, 4, 4, 'F')
  const fillColor = overallPct >= 80 ? OK : overallPct >= 50 ? GOLD : DANGER
  doc.setFillColor(...fillColor)
  const fillW = Math.max(4, (contentW * overallPct) / 100)
  doc.roundedRect(MARGIN, y, fillW, barH, 4, 4, 'F')
  y += barH + 30

  // ------------------------------------------------- Per-organization sections
  organizations.forEach((org, idx) => {
    const s = org.summary
    const estBlock = 120 + Math.min(s.nonCompliant.length, 6) * 16
    if (y + estBlock > doc.internal.pageSize.getHeight() - 60) {
      doc.addPage()
      y = 60
    }

    // Section heading
    doc.setFont('times', 'normal')
    doc.setFontSize(15)
    doc.setTextColor(...NAVY)
    doc.text(`${idx + 1}.  ${org.name}`, MARGIN, y)
    y += 6
    doc.setDrawColor(...GOLD)
    doc.setLineWidth(1)
    doc.line(MARGIN, y, MARGIN + 40, y)
    y += 4
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(7.5)
    doc.setTextColor(...MUTED)
    doc.text(`ID  ${org.id}`, MARGIN, y + 10)
    y += 22

    // Compliance status badge line
    const pct = s.percentage
    const statusColor = pct >= 80 ? OK : pct >= 50 ? GOLD : DANGER
    const statusText =
      pct >= 80 ? 'COMPLIANT' : pct >= 50 ? 'AT RISK' : 'NON-COMPLIANT'

    doc.setFont('helvetica', 'bold')
    doc.setFontSize(8)
    doc.setFillColor(...statusColor)
    const badgeW = doc.getTextWidth(statusText) + 16
    doc.roundedRect(MARGIN, y - 9, badgeW, 14, 3, 3, 'F')
    doc.setTextColor(255, 255, 255)
    doc.text(statusText, MARGIN + 8, y)

    doc.setFont('helvetica', 'normal')
    doc.setFontSize(9)
    doc.setTextColor(...INK)
    doc.text(
      `${s.total} members   ·   ${s.compliant} compliant   ·   ${s.nonCompliantCount} non-compliant   ·   ${pct}% MFA coverage`,
      MARGIN + badgeW + 12,
      y
    )
    y += 18

    if (s.nonCompliant.length > 0) {
      autoTable(doc, {
        startY: y,
        margin: { left: MARGIN, right: MARGIN },
        head: [['#', 'Member', 'Email', 'Phone']],
        body: s.nonCompliant.map((m, i) => [i + 1, m.name, m.email, m.phone]),
        theme: 'grid',
        styles: {
          font: 'helvetica',
          fontSize: 8.5,
          cellPadding: 5,
          lineColor: HAIRLINE,
          lineWidth: 0.5,
          textColor: INK,
        },
        headStyles: {
          fillColor: NAVY,
          textColor: [255, 255, 255],
          fontStyle: 'bold',
          fontSize: 8,
        },
        alternateRowStyles: { fillColor: ZEBRA },
        columnStyles: {
          0: { cellWidth: 26, halign: 'center', textColor: MUTED },
          3: { textColor: MUTED },
        },
        didParseCell: (data) => {
          if (data.section === 'body' && data.column.index === 1) {
            data.cell.styles.textColor = DANGER
            data.cell.styles.fontStyle = 'bold'
          }
        },
      })
      y = doc.lastAutoTable.finalY + 26
    } else {
      doc.setFont('helvetica', 'italic')
      doc.setFontSize(9)
      doc.setTextColor(...OK)
      doc.text('All members have MFA enabled. No exceptions.', MARGIN, y + 4)
      y += 30
    }
  })

  decoratePages(doc, generatedAt)

  const stamp = generatedAt.toISOString().slice(0, 10)
  doc.save(`sentinel-compliance-report-${stamp}.pdf`)
}
