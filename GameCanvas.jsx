import React, { useEffect, useRef, useImperativeHandle, forwardRef } from 'react'

const COLS = 6, ROWS = 6, CELL = 96, TYPES = 6, STAR = 6, BOMB = 7

const SweetEngine = function(canvas, hooks) {
  const ctx = canvas.getContext('2d')
  let grid = []
  let balance = 1000, bet = 10, mult = 1, freeSpins = 0, auto = false
  let raf = null
  const dpr = window.devicePixelRatio || 1
  canvas.width = CELL * COLS * dpr
  canvas.height = CELL * ROWS * dpr
  canvas.style.width = (CELL * COLS) + 'px'
  canvas.style.height = (CELL * ROWS) + 'px'
  ctx.scale(dpr, dpr)

  function _rand() { return Math.random() }

  function init() {
    grid = Array.from({ length: ROWS }, () => Array(COLS).fill(null))
    for (let r = 0; r < ROWS; r++)
      for (let c = 0; c < COLS; c++)
        grid[r][c] = { type: spawnType(), y: r * CELL, vy: 0 }
    hooks.onLog && hooks.onLog('Engine initialized')
    load() || save()
  }

  function spawnType() {
    const p = Math.random()
    if (p < 0.03) return STAR
    if (p < 0.06) return BOMB
    return Math.floor(Math.random() * TYPES)
  }

  function draw() {
    ctx.clearRect(0, 0, CELL * COLS, CELL * ROWS)
    ctx.fillStyle = '#071426'; ctx.fillRect(0, 0, CELL * COLS, CELL * ROWS)
    for (let r = 0; r < ROWS; r++)
      for (let c = 0; c < COLS; c++) {
        const cell = grid[r][c]; if (!cell) continue
        const x = c * CELL, y = cell.y
        ctx.fillStyle = 'rgba(255,255,255,0.03)'; ctx.fillRect(x + 6, y + 6, CELL - 12, CELL - 12)
        const cx = x + CELL / 2, cy = y + CELL / 2
        ctx.beginPath(); ctx.arc(cx, cy, 36, 0, Math.PI * 2)
        switch (cell.type) {
          case 0: ctx.fillStyle = '#ffb3c2'; break
          case 1: ctx.fillStyle = '#ffd48a'; break
          case 2: ctx.fillStyle = '#b7dfff'; break
          case 3: ctx.fillStyle = '#c7ffb3'; break
          case 4: ctx.fillStyle = '#e6b3ff'; break
          case 5: ctx.fillStyle = '#ffdfb3'; break
          case STAR: ctx.fillStyle = '#fff1a8'; break
          case BOMB: ctx.fillStyle = '#222'; break
          default: ctx.fillStyle = '#ccc'; break
        }
        ctx.fill(); ctx.closePath()
        if (cell.type === STAR) { ctx.fillStyle = '#c47'; ctx.fillRect(cx - 6, cy - 10, 12, 20) }
        if (cell.type === BOMB) { ctx.fillStyle = '#f66'; ctx.fillRect(cx - 6, cy - 6, 12, 12) }
      }
  }

  function updatePositions(dt) {
    for (let r = 0; r < ROWS; r++)
      for (let c = 0; c < COLS; c++) {
        const cell = grid[r][c]; if (!cell) continue
        if (cell.vy && cell.vy !== 0) {
          cell.y += cell.vy * (dt / 16)
          cell.vy += 0.6 * (dt / 16)
          const target = r * CELL
          if (cell.y >= target) { cell.y = target; cell.vy = 0 }
        }
      }
  }

  function findClusters() {
    const visited = Array.from({ length: ROWS }, () => Array(COLS).fill(false))
    const clusters = []; const dirs = [[1,0],[-1,0],[0,1],[0,-1]]
    for (let r = 0; r < ROWS; r++)
      for (let c = 0; c < COLS; c++) {
        if (visited[r][c]) continue; const cell = grid[r][c]; if (!cell) continue
        const type = cell.type; if (type === STAR || type === BOMB) { visited[r][c] = true; continue }
        const stack = [[r,c]]; const cluster = []
        visited[r][c] = true
        while (stack.length) {
          const [cr, cc] = stack.pop(); cluster.push({ r: cr, c: cc })
          for (const [dr, dc] of dirs) {
            const nr = cr + dr, nc = cc + dc
            if (nr<0||nr>=ROWS||nc<0||nc>=COLS) continue
            if (visited[nr][nc]) continue
            const n = grid[nr][nc]; if (!n || n.type!==type) continue
            visited[nr][nc]=true; stack.push([nr,nc])
          }
        }
        if (cluster.length>=4) clusters.push(cluster)
      }
    return clusters
  }

  function removeCluster(cluster) { cluster.forEach(cell => grid[cell.r][cell.c]=null) }

  function collapse() {
    for (let c = 0; c < COLS; c++) {
      let write = ROWS - 1
      for (let r = ROWS-1; r >= 0; r--) {
        if (grid[r][c]) {
          if (write!==r) { grid[write][c]=grid[r][c]; grid[write][c].vy = Math.random()*3+3; grid[r][c]=null }
          write--
        }
      }
      for (let r = write; r >=0; r--) grid[r][c] = {type: spawnType(), y: -CELL, vy: Math.random()*3+4}
    }
  }

  async function spin() {
    if (balance < bet && freeSpins <= 0) { hooks.onLog && hooks.onLog('Недостаточно баланса'); return }
    if (freeSpins > 0) { freeSpins--; hooks.onLog && hooks.onLog('Free spin, осталось: '+freeSpins) } else balance -= bet
    hooks.onState && hooks.onState({ balance })
    for (let r=0;r<ROWS;r++) for (let c=0;c<COLS;c++) grid[r][c]={type: spawnType(), y: -CELL, vy: Math.random()*4+4}
    await sleep(500)
    let totalWin = 0
    while (true) {
      const clusters = findClusters(); if (clusters.length===0) break
      let roundWin = 0
      clusters.forEach(cl => { const win = Math.floor(bet*(cl.length-3)*Math.max(1,mult)); roundWin+=win; removeCluster(cl) })
      totalWin += roundWin; mult += 0.25 * clusters.length; hooks.onLog && hooks.onLog('Результат раунда: '+roundWin)
      collapse(); await sleep(420)
    }
    if (totalWin>0){ balance+=totalWin; hooks.onLog && hooks.onLog('Выигрыш: '+totalWin) } else hooks.onLog && hooks.onLog('Нет комбинаций')
    mult = Math.max(1, mult*0.7); hooks.onState && hooks.onState({balance})
    save()
  }

  function save() { localStorage.setItem('sb_react_v1', JSON.stringify({balance, mult, freeSpins, grid: grid.map(r=>r.map(c=>c?c.type:null))})); hooks.onLog && hooks.onLog('Сохранено') }
  function load() { const raw = localStorage.getItem('sb_react_v1'); if(!raw) return false; try{ const s=JSON.parse(raw); balance=s.balance||balance; mult=s.mult||mult; freeSpins=s.freeSpins||0; if(s.grid){ grid=Array.from({length:ROWS},()=>Array(COLS).fill(null)); for(let r=0;r<ROWS;r++) for(let c=0;c<COLS;c++){ const t=s.grid[r][c]; grid[r][c]={type:t===null?spawnType():t, y:r*CELL, vy:0 } } } hooks.onLog && hooks.onLog('Загружено'); hooks.onState && hooks.onState({balance}); return true }catch(e){console.error(e); return false } }

  function sleep(ms){ return new Promise(r=>setTimeout(r,ms)) }

  let last = performance.now()
  function tick(now){ const dt=now-last; last=now; updatePositions(dt); draw(); raf=requestAnimationFrame(tick) }
  function start(){ if(!grid.length)init(); last=performance.now(); raf=requestAnimationFrame(tick) }
  function stop(){ if(raf) cancelAnimationFrame(raf) }
  async function toggleAuto(){ auto=!auto; while(auto){ if(balance<bet && freeSpins<=0){ hooks.onLog && hooks.onLog('Auto stop: low balance'); auto=false; break } await spin(); await sleep(600) } }

  start()
  return { spin, save, load, toggleAuto }
}

const GameCanvas = forwardRef(({bet, onState, onLog}, ref)=>{
  const canvasRef = useRef(null)
  const engineRef = useRef(null)

  useEffect(()=>{
    const canvas = canvasRef.current
    engineRef.current = SweetEngine(canvas, { onState, onLog })
    engineRef.current.load() || engineRef.current
  }, [])

  useImperativeHandle(ref, ()=>({
    spin: ()=>engineRef.current.spin(),
    saveSession: ()=>engineRef.current.save(),
    toggleAuto: ()=>engineRef.current.toggleAuto()
  }))

  return <canvas ref={canvasRef} className="game-canvas"/>
})

export default GameCanvas