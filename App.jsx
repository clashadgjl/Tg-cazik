import React, { useRef, useState } from 'react'
import GameCanvas from './GameCanvas.jsx'

export default function App() {
  const [balance, setBalance] = useState(1000)
  const [bet, setBet] = useState(10)
  const gameRef = useRef(null)

  function handleLog(msg) {
    const logEl = document.getElementById('log')
    if (logEl) logEl.innerHTML += `<div>${msg}</div>`
  }

  return (
    <div className="app">
      <header className="top">
        <div className="title">Sweet Bonanza — React Demo</div>
        <div className="controls">
          <div>Баланс: <span id="balance">{balance}</span></div>
          <div>Ставка: <input type="number" min="1" value={bet} onChange={e => setBet(Number(e.target.value) || 1)} /></div>
          <div>
            <button onClick={() => gameRef.current?.spin()}>Spin</button>
            <button onClick={() => gameRef.current?.toggleAuto()}>Auto</button>
            <button onClick={() => { gameRef.current?.saveSession(); alert('Сессия сохранена') }}>Save</button>
          </div>
        </div>
      </header>
      <main>
        <GameCanvas
          ref={gameRef}
          bet={bet}
          onState={s => { setBalance(s.balance) }}
          onLog={handleLog}
        />
        <aside className="side">
          <h3>Лог</h3>
          <div id="log" className="log"></div>
        </aside>
      </main>
      <footer className="foot">
        Готово для GitHub Pages — деплой через gh-pages
      </footer>
    </div>
  )
}