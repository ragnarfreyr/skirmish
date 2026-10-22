import { useEffect, useRef, useState } from 'react'
import { countHits, hitChance, rollD6s } from '../game/dice.js'
import { buzz } from '../fx/motion.js'
import './DiceTray.css'

const PLAYER_DICE_COLOR = { 1: '#4a90d9', 2: '#d94a5c' }
const ANNOUNCE_MS = 450 // how long the "4 dice, hit on 3+" card shows before the throw
const RESULT_MS = 1900 // how long the verdict stays up before play continues (tap skips)
const ROLL_TIMEOUT_MS = 9000 // give up on the 3D dice and roll in code if they never settle

// One shared 3D dice box for the whole app. Loaded lazily so the 3D engine
// doesn't slow down the first paint, and started early so the first roll is snappy.
let boxPromise = null
function getDiceBox() {
  if (!boxPromise) {
    boxPromise = import('@3d-dice/dice-box')
      .then(async ({ default: DiceBox }) => {
        const box = new DiceBox({
          container: '#dice-stage',
          assetPath: `${import.meta.env.BASE_URL}dice-box/`,
          scale: 6,
          theme: 'default',
          themeColor: PLAYER_DICE_COLOR[1],
          enableShadows: true,
        })
        await box.init()
        return box
      })
      .catch((err) => {
        console.warn('3D dice unavailable, rolling in code instead.', err)
        return null
      })
  }
  return boxPromise
}

function withTimeout(promise, ms) {
  return Promise.race([promise, new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), ms))])
}

// Shows a dice roll for an attack: what's being rolled and what counts as a hit,
// then the 3D dice, then each die marked hit or miss with a big verdict.
export default function DiceTray({ roll, onResolve }) {
  const [stage, setStage] = useState('idle') // idle | announce | rolling | result
  const [values, setValues] = useState([])
  const [shown, setShown] = useState(null) // the roll on screen (kept while fading out)
  const finishRef = useRef(null)

  // Warm up the 3D engine as soon as the game loads.
  useEffect(() => {
    getDiceBox()
  }, [])

  useEffect(() => {
    if (!roll) {
      setStage('idle')
      return
    }
    let cancelled = false
    let resultTimer
    setShown(roll)
    setValues([])
    setStage('announce')

    const finish = (vals) => {
      if (cancelled) return
      cancelled = true
      clearTimeout(resultTimer)
      finishRef.current = null
      setStage('idle')
      getDiceBox().then((box) => box?.clear())
      onResolve(vals)
    }

    ;(async () => {
      await new Promise((r) => setTimeout(r, ANNOUNCE_MS))
      if (cancelled) return
      setStage('rolling')
      const box = await getDiceBox()
      if (cancelled) return
      let vals
      try {
        if (!box) throw new Error('no dice box')
        const results = await withTimeout(
          box.roll(`${roll.dice}d6`, { themeColor: PLAYER_DICE_COLOR[roll.owner] }),
          ROLL_TIMEOUT_MS,
        )
        vals = results.map((r) => r.value).filter((v) => v >= 1 && v <= 6)
        if (vals.length !== roll.dice) throw new Error('unexpected dice result')
      } catch {
        vals = rollD6s(roll.dice)
      }
      if (cancelled) return
      setValues(vals)
      setStage('result')
      const hits = countHits(vals, roll.hit)
      buzz(hits ? [15, 30, 15] : 30)
      finishRef.current = () => finish(vals)
      resultTimer = setTimeout(() => finish(vals), RESULT_MS)
    })()

    return () => {
      cancelled = true
      clearTimeout(resultTimer)
      finishRef.current = null
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roll?.id])

  const visible = stage !== 'idle'
  const r = shown
  const hits = r ? countHits(values, r.hit) : 0
  const sorted = [...values].sort((a, b) => b - a)

  let verb = 'attacks'
  if (r?.kind === 'strikeback') verb = 'strikes back at'
  else if (r?.ranged) verb = 'shoots'

  return (
    <div
      className={`dice-tray${visible ? ' show' : ''} stage-${stage} p${r?.owner ?? 1}`}
      onClick={() => finishRef.current?.()}
      aria-hidden={!visible}
    >
      <div className="dice-stage" id="dice-stage" />

      {r && (
        <div className="dice-hud" key={r.id}>
          <div className="dice-title">
            <span className="who">{r.attackerName}</span> {verb} <span className="who">{r.defenderName}</span>
          </div>
          <div className="dice-rule">
            <span className="dice-count">
              {r.dice} {r.dice === 1 ? 'die' : 'dice'}
            </span>
            <span className="dice-sep">·</span>
            hits on <span className="dice-target">{r.hit}+</span>
            <span className="dice-odds">{hitChance(r.hit)}% each</span>
          </div>
        </div>
      )}

      {r && stage === 'result' && (
        <div className="dice-result">
          <div className="dice-faces">
            {sorted.map((v, i) => (
              <span key={i} className={`die-face ${v >= r.hit ? 'hit' : 'miss'}`} style={{ '--i': i }}>
                {v}
              </span>
            ))}
          </div>
          <div className={`dice-verdict${hits === 0 ? ' miss' : ''}`}>
            {hits === 0 ? 'ALL MISS!' : `${hits} HIT${hits === 1 ? '' : 'S'}!`}
          </div>
          <div className="dice-sub">
            {hits === 0 ? 'No damage' : `${hits} damage to ${r.defenderName}`}
            <span className="dice-tap"> · tap to continue</span>
          </div>
        </div>
      )}
    </div>
  )
}
