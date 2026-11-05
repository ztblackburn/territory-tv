(() => {
  const DEFAULT_SETTINGS = {
    enabled: true,
    grain: 15,
    saturation: 72,
    blur: 20,
    scanlines: 8,
  }

  const settings = { ...DEFAULT_SETTINGS }

  let currentPlayer = null
  let overlay = null

  const style = document.createElement('style')

  style.textContent = `
    .territory-tv-overlay {
      position: absolute;
      inset: 0;
      pointer-events: none;
      z-index: 40;
      overflow: hidden;
    }

    .territory-tv-grain {
      position: absolute;
      inset: -50%;
      background-image:
        radial-gradient(circle, rgba(255,255,255,.7) .8px, transparent 1px),
        radial-gradient(circle, rgba(0,0,0,.7) .8px, transparent 1px);
      background-size: 5px 5px, 7px 7px;
      animation: territoryGrain .25s steps(3) infinite;
      mix-blend-mode: soft-light;
    }

    .territory-tv-scanlines {
      position: absolute;
      inset: 0;
      background: repeating-linear-gradient(
        to bottom,
        transparent 0px,
        transparent 3px,
        rgba(0,0,0,.35) 4px
      );
    }

    .territory-tv-warmth {
      position: absolute;
      inset: 0;
      background: rgba(180,135,75,.07);
      mix-blend-mode: color;
    }

    .territory-tv-vignette {
      position: absolute;
      inset: 0;
      background: radial-gradient(
        ellipse,
        transparent 55%,
        rgba(30,20,10,.28) 100%
      );
    }

    @keyframes territoryGrain {
      0% { transform: translate(0,0); }
      33% { transform: translate(3px,2px); }
      66% { transform: translate(-3px,1px); }
      100% { transform: translate(1px,-3px); }
    }
  `

  document.documentElement.appendChild(style)

  function findPlayer() {
    return document.querySelector('#movie_player')
  }

  function updateEffects() {
    const player = findPlayer()

    if (!player) return

    const video = player.querySelector('video')

    if (!video) return

    if (currentPlayer !== player) {
      if (overlay) overlay.remove()

      currentPlayer = player
      overlay = null
    }

    if (!settings.enabled) {
      video.style.removeProperty('filter')

      if (overlay) overlay.style.display = 'none'

      return
    }

    video.style.filter = `
      sepia(18%)
      saturate(${settings.saturation}%)
      contrast(90%)
      brightness(103%)
      blur(${settings.blur / 100}px)
    `

    if (!overlay) {
      overlay = document.createElement('div')
      overlay.className = 'territory-tv-overlay'

      overlay.innerHTML = `
        <div class="territory-tv-grain"></div>
        <div class="territory-tv-scanlines"></div>
        <div class="territory-tv-warmth"></div>
        <div class="territory-tv-vignette"></div>
      `

      player.appendChild(overlay)
    }

    overlay.style.display = 'block'

    overlay.querySelector('.territory-tv-grain').style.opacity =
      settings.grain / 100

    overlay.querySelector('.territory-tv-scanlines').style.opacity =
      settings.scanlines / 100
  }

  // Receive live updates from the popup.
  chrome.runtime.onMessage.addListener((message) => {
    if (message.type === 'TERRITORY_SETTINGS') {
      Object.assign(settings, message.settings)
      updateEffects()
    }
  })

  // Also respond to settings restored or changed in Chrome storage.
  chrome.storage.onChanged.addListener((changes, areaName) => {
    if (areaName === 'local' && changes.territorySettings) {
      Object.assign(settings, changes.territorySettings.newValue)
      updateEffects()
    }
  })

  // Load saved settings when the content script starts.
  chrome.storage.local.get('territorySettings', (result) => {
    if (result.territorySettings) {
      Object.assign(settings, result.territorySettings)
    }

    updateEffects()
  })

  // Watch YouTube's changing player and video elements.
  const observer = new MutationObserver(() => {
    updateEffects()
  })

  observer.observe(document.documentElement, {
    childList: true,
    subtree: true,
  })

  updateEffects()
})()