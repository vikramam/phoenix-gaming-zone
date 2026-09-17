import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { FieldLabel, Input } from '@/components/ui/input'
import { paiseToRupees, rupeesToPaise } from '@/lib/money'
import { DEFAULT_SNACK_CHIPS_PAISE, DEFAULT_SNACK_COKE_PAISE } from '@/lib/snacks'
import { resetDemoData, updateSettings } from '@/lib/store'
import type { RoundingMode } from '@/lib/types'
import { useAppData } from '@/lib/use-store'

export function BusinessPage() {
  const data = useAppData()
  const [settings, setSettings] = useState(data.settings)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    setSettings(data.settings)
  }, [data.settings])

  function save(next = settings) {
    updateSettings(next)
    setSettings(next)
    setSaved(true)
    window.setTimeout(() => setSaved(false), 2000)
  }

  return (
    <div>
      <h1 className="page-title">Business</h1>
      <p className="mb-5 text-sm text-muted">
        Billing default: minimum 1 hour, then +30 minutes, round up. Session highlights use their own
        period lengths so you can test colors without changing the bill.
      </p>

      <section className="esports-card rounded-2xl p-5">
      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <FieldLabel>Gaming zone name</FieldLabel>
          <Input value={settings.name} onChange={(event) => setSettings({ ...settings, name: event.target.value })} />
        </div>
        <div>
          <FieldLabel>Tagline</FieldLabel>
          <Input value={settings.tagline} onChange={(event) => setSettings({ ...settings, tagline: event.target.value })} />
        </div>
        <div>
          <FieldLabel>Currency symbol</FieldLabel>
          <Input
            value={settings.currencySymbol}
            onChange={(event) => setSettings({ ...settings, currencySymbol: event.target.value })}
          />
        </div>
        <div>
          <FieldLabel>Timezone</FieldLabel>
          <Input value={settings.timezone} onChange={(event) => setSettings({ ...settings, timezone: event.target.value })} />
        </div>
        <div>
          <FieldLabel>Minimum minutes</FieldLabel>
          <Input
            type="number"
            value={settings.minimumDurationMinutes}
            onChange={(event) =>
              setSettings({ ...settings, minimumDurationMinutes: Number(event.target.value) })
            }
          />
        </div>
        <div>
          <FieldLabel>Increment minutes</FieldLabel>
          <Input
            type="number"
            value={settings.billingIncrementMinutes}
            onChange={(event) =>
              setSettings({ ...settings, billingIncrementMinutes: Number(event.target.value) })
            }
          />
        </div>
        <div>
          <FieldLabel>Rounding</FieldLabel>
          <select
            value={settings.roundingMode}
            onChange={(event) => setSettings({ ...settings, roundingMode: event.target.value as RoundingMode })}
            className="h-11 w-full rounded-lg border border-line bg-bg px-3"
          >
            <option value="up">Up</option>
            <option value="nearest">Nearest</option>
            <option value="down">Down</option>
          </select>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <FieldLabel>Opens</FieldLabel>
            <Input
              type="time"
              value={settings.openTime}
              onChange={(event) => setSettings({ ...settings, openTime: event.target.value })}
            />
          </div>
          <div>
            <FieldLabel>Closes</FieldLabel>
            <Input
              type="time"
              value={settings.closeTime}
              onChange={(event) => setSettings({ ...settings, closeTime: event.target.value })}
            />
          </div>
        </div>
      </div>

      <label className="mt-3 flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={settings.closesNextDay}
          onChange={(event) => setSettings({ ...settings, closesNextDay: event.target.checked })}
        />
        Closes after midnight
      </label>
      </section>

      <section className="esports-card mt-5 rounded-2xl p-5">
        <h2 className="mb-2 text-xl font-extrabold">Snack quick-add prices</h2>
        <p className="mb-4 text-sm text-muted">
          These are only shortcuts on the Add Snacks popup. Changing a price does not change snacks already added to a session. Use Save settings at the bottom.
        </p>
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <FieldLabel>Coke (₹)</FieldLabel>
            <Input
              type="number"
              min={1}
              value={paiseToRupees(settings.snackCokePaise ?? DEFAULT_SNACK_COKE_PAISE)}
              onChange={(event) =>
                setSettings({ ...settings, snackCokePaise: rupeesToPaise(Number(event.target.value)) })
              }
            />
          </div>
          <div>
            <FieldLabel>Chips (₹)</FieldLabel>
            <Input
              type="number"
              min={1}
              value={paiseToRupees(settings.snackChipsPaise ?? DEFAULT_SNACK_CHIPS_PAISE)}
              onChange={(event) =>
                setSettings({ ...settings, snackChipsPaise: rupeesToPaise(Number(event.target.value)) })
              }
            />
          </div>
        </div>
      </section>

      <section className="esports-card mt-5 rounded-2xl p-5">
      <h2 className="mb-2 text-xl font-extrabold">Session time warnings</h2>
      <p className="mb-4 text-sm text-muted">
        First period is 1 hour by default: yellow at 90% (54m), orange at 95% (57m), red at 100%. After
        Extend, the same percentages apply to the next 30 minutes. Change the percents or use a 1–2
        minute test period to see the colors immediately.
      </p>

      <div className="grid gap-4 md:grid-cols-3">
        <div>
          <FieldLabel>Yellow at %</FieldLabel>
          <Input
            type="number"
            min={1}
            max={100}
            value={settings.warningYellowPercent}
            onChange={(event) =>
              setSettings({ ...settings, warningYellowPercent: Number(event.target.value) })
            }
          />
        </div>
        <div>
          <FieldLabel>Orange at %</FieldLabel>
          <Input
            type="number"
            min={1}
            max={100}
            value={settings.warningOrangePercent}
            onChange={(event) =>
              setSettings({ ...settings, warningOrangePercent: Number(event.target.value) })
            }
          />
        </div>
        <div>
          <FieldLabel>Red at %</FieldLabel>
          <Input
            type="number"
            min={1}
            max={100}
            value={settings.warningRedPercent}
            onChange={(event) =>
              setSettings({ ...settings, warningRedPercent: Number(event.target.value) })
            }
          />
        </div>
        <div>
          <FieldLabel>First period (minutes)</FieldLabel>
          <Input
            type="number"
            min={1}
            value={settings.warningFirstPeriodMinutes}
            onChange={(event) =>
              setSettings({ ...settings, warningFirstPeriodMinutes: Number(event.target.value) })
            }
          />
        </div>
        <div>
          <FieldLabel>Extend period (minutes)</FieldLabel>
          <Input
            type="number"
            min={1}
            value={settings.warningExtendMinutes}
            onChange={(event) =>
              setSettings({ ...settings, warningExtendMinutes: Number(event.target.value) })
            }
          />
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <Button
          variant="outline"
          onClick={() =>
            save({
              ...settings,
              warningFirstPeriodMinutes: 2,
              warningExtendMinutes: 1,
            })
          }
        >
          Test: 2 min then +1 min
        </Button>
        <Button
          variant="outline"
          onClick={() =>
            save({
              ...settings,
              warningFirstPeriodMinutes: 1,
              warningExtendMinutes: 1,
            })
          }
        >
          Test: 1 min / 1 min
        </Button>
        <Button
          variant="outline"
          onClick={() =>
            save({
              ...settings,
              warningFirstPeriodMinutes: 60,
              warningExtendMinutes: 30,
              warningYellowPercent: 90,
              warningOrangePercent: 95,
              warningRedPercent: 100,
            })
          }
        >
          Shop: 60 min / +30 min
        </Button>
      </div>
      <p className="mt-2 text-xs text-muted">
        Test presets only change the highlight clock. Billing stays at 1 hour minimum / 30 minute
        increment unless you edit those fields above.
      </p>
      </section>

      <div className="mt-6 flex flex-wrap gap-3">
        <Button onClick={() => save()}>Save settings</Button>
        {saved ? <span className="self-center text-sm text-gold">Saved</span> : null}
        <Button
          variant="outline"
          onClick={() => {
            if (window.confirm('Reset this browser to the starter inventory and prices?')) {
              resetDemoData()
            }
          }}
        >
          Reset demo data
        </Button>
      </div>
    </div>
  )
}
