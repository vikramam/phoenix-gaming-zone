import html2canvas from 'html2canvas'
import { jsPDF } from 'jspdf'
import {
  formatInvoiceDate,
  formatInvoiceMoney,
  invoiceClock,
  paymentLine,
  type InvoiceModel,
} from './invoice'

const PAGE_W = 794
const PAGE_H = 1123

function escapeHtml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function loadImage(src: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image()
    img.decoding = 'async'
    img.onload = () => resolve(img)
    img.onerror = () => reject(new Error(`Could not load ${src}`))
    img.src = src
  })
}

function blendedLogoDataUrl(img: HTMLImageElement, size = 256) {
  const canvas = document.createElement('canvas')
  canvas.width = size
  canvas.height = size
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Could not prepare the logo.')
  ctx.fillStyle = '#0b1b2d'
  ctx.fillRect(0, 0, size, size)
  ctx.globalCompositeOperation = 'screen'
  ctx.drawImage(img, 0, 0, size, size)
  return canvas.toDataURL('image/jpeg', 0.92)
}

function imageToPngDataUrl(img: HTMLImageElement) {
  const canvas = document.createElement('canvas')
  canvas.width = img.naturalWidth || 512
  canvas.height = img.naturalHeight || 512
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Could not prepare artwork.')
  ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
  return canvas.toDataURL('image/png')
}

function invoiceMarkup(model: InvoiceModel, logoSrc: string, controllerSrc: string, padSrc: string) {
  const snacksRow =
    model.snacksPaise > 0
      ? `<tr>
          <td>Snacks<span>Counter add-ons</span></td>
          <td>1</td>
          <td>${formatInvoiceMoney(model.snacksPaise)}</td>
        </tr>`
      : ''

  return `<article class="pgz-inv">
    <img class="pgz-wm pgz-wm-a" src="${controllerSrc}" alt="" />
    <img class="pgz-wm pgz-wm-b" src="${padSrc}" alt="" />
    <header class="pgz-banner">
      <div class="pgz-mark"><img src="${logoSrc}" alt="" /></div>
      <div class="pgz-brand">
        <p class="pgz-co">${escapeHtml(model.companyName)}</p>
        <p class="pgz-tag">${escapeHtml(model.tagline)}</p>
      </div>
    </header>
    <div class="pgz-inner">
      <p class="pgz-meta">Invoice # ${escapeHtml(model.invoiceNumber)} · ${escapeHtml(formatInvoiceDate(model.issuedAt))}</p>
      <h1 class="pgz-title">Invoice</h1>
      <div class="pgz-facts">
        <div>
          <p class="pgz-kicker">Bill to</p>
          <p class="pgz-who">${escapeHtml(model.customerName)}</p>
          <p class="pgz-note">${escapeHtml(model.stationName)}</p>
        </div>
        <div>
          <p class="pgz-kicker">Payment</p>
          <p class="pgz-who">${escapeHtml(paymentLine(model.paymentStatus, model.paymentMethod))}</p>
          <p class="pgz-note">Pay at counter</p>
        </div>
      </div>
      <table>
        <thead>
          <tr>
            <th>Description</th>
            <th>Qty</th>
            <th>Price</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>
              ${escapeHtml(model.stationName)} · ${escapeHtml(model.playedLabel)} play
              <span>Start ${escapeHtml(invoiceClock(model.startedAt))} · End ${escapeHtml(invoiceClock(model.endedAt))}</span>
              <span>Billed ${escapeHtml(model.billedLabel)}</span>
            </td>
            <td>1</td>
            <td>${formatInvoiceMoney(model.gamingPaise)}</td>
          </tr>
          ${snacksRow}
        </tbody>
      </table>
      <div class="pgz-total-row">
        <p>Total amount</p>
        <p class="pgz-total">${formatInvoiceMoney(model.totalPaise)}</p>
      </div>
    </div>
    <footer class="pgz-footer">
      <p class="pgz-thanks">Thank You. Visit Again..! 🎮</p>
    </footer>
  </article>`
}

const invoiceCss = `
  * { box-sizing: border-box; }
  .pgz-inv {
    position: relative;
    width: ${PAGE_W}px;
    height: ${PAGE_H}px;
    overflow: hidden;
    isolation: isolate;
    background: #f6f7f9;
    color: #1c2430;
    font-family: "Segoe UI", "Avenir Next", sans-serif;
  }
  .pgz-wm { position: absolute; pointer-events: none; z-index: 0; }
  .pgz-wm-a { right: -6%; bottom: 14%; width: 68%; opacity: 0.1; }
  .pgz-wm-b { left: -10%; top: 42%; width: 42%; opacity: 0.07; transform: rotate(-18deg); }
  .pgz-banner, .pgz-inner, .pgz-footer { position: relative; z-index: 1; }
  .pgz-banner {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 16px;
    padding: 28px 40px;
    background: #0b1b2d;
    color: #e8f2ff;
  }
  .pgz-mark {
    width: 88px;
    height: 88px;
    border-radius: 18px;
    overflow: hidden;
    background: #0b1b2d;
  }
  .pgz-mark img { width: 100%; height: 100%; object-fit: contain; }
  .pgz-brand { text-align: right; }
  .pgz-co { margin: 0; font-size: 26px; font-weight: 700; letter-spacing: -0.03em; }
  .pgz-tag, .pgz-meta, .pgz-note, td span { margin: 0; color: #6b7c8f; font-size: 14px; }
  .pgz-banner .pgz-tag { color: #91a7bf; font-size: 13px; }
  .pgz-inner { padding: 36px 40px 140px; }
  .pgz-title {
    margin: 14px 0 22px;
    font-size: 28px;
    font-weight: 700;
    letter-spacing: -0.02em;
  }
  .pgz-facts {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 24px;
    margin-bottom: 28px;
  }
  .pgz-kicker {
    margin: 0 0 6px;
    font-size: 12px;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: #6b7c8f;
  }
  .pgz-who { margin: 0; font-size: 18px; font-weight: 700; }
  table { width: 100%; border-collapse: collapse; }
  th, td {
    text-align: left;
    padding: 14px 0;
    border-bottom: 1px solid #d5dde6;
    font-size: 15px;
    vertical-align: top;
  }
  th:nth-child(2), td:nth-child(2), th:nth-child(3), td:nth-child(3) {
    text-align: right;
    white-space: nowrap;
  }
  th { color: #6b7c8f; font-weight: 500; }
  td span { display: block; margin-top: 4px; }
  .pgz-total-row {
    display: flex;
    justify-content: space-between;
    align-items: baseline;
    margin: 32px 0 0;
  }
  .pgz-total-row p { margin: 0; font-size: 16px; }
  .pgz-total { font-size: 28px; font-weight: 800; }
  .pgz-footer {
    position: absolute;
    left: 0;
    right: 0;
    bottom: 0;
    z-index: 2;
    display: flex;
    align-items: center;
    justify-content: center;
    height: 110px;
    padding: 36px 24px 12px;
    background:
      radial-gradient(120% 90% at 8% 120%, #091525 42%, transparent 43%),
      linear-gradient(180deg, transparent 28%, #ff6a00 28%, #ff8a33 62%, #2388ed 62%);
  }
  .pgz-thanks {
    margin: 0;
    text-align: center;
    font-size: 18px;
    font-weight: 700;
    color: #ffffff;
  }
`

export async function downloadInvoicePdf(model: InvoiceModel) {
  const [logo, controller, pad] = await Promise.all([
    loadImage('/new_logo.jpg'),
    loadImage('/images/packages/ps5-extra-controller.webp'),
    loadImage('/images/asset-types/controller.webp'),
  ])

  const host = document.createElement('div')
  host.style.cssText = `position:fixed;left:-10000px;top:0;width:${PAGE_W}px;height:${PAGE_H}px;pointer-events:none;`
  const page = document.createElement('div')
  page.innerHTML = `<style>${invoiceCss}</style>${invoiceMarkup(
    model,
    blendedLogoDataUrl(logo),
    imageToPngDataUrl(controller),
    imageToPngDataUrl(pad),
  )}`
  host.appendChild(page)
  document.body.appendChild(host)

  try {
    const canvas = await html2canvas(page.querySelector('.pgz-inv') as HTMLElement, {
      scale: 2,
      backgroundColor: '#f6f7f9',
      width: PAGE_W,
      height: PAGE_H,
      useCORS: true,
    })
    const pdf = new jsPDF({ orientation: 'p', unit: 'mm', format: 'a4' })
    pdf.addImage(canvas.toDataURL('image/jpeg', 0.95), 'JPEG', 0, 0, 210, 297)
    pdf.save(`Phoenix-Invoice-${model.invoiceNumber}.pdf`)
  } finally {
    host.remove()
  }
}
