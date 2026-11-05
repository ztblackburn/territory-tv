import { useState, useEffect } from 'react'
import './App.css'

const DEFAULT_SETTINGS = {
  enabled: true,
  grain: 15,
  saturation: 72,
  blur: 20,
  scanlines: 8,
  activePreset: 'Custom',
}

const presets = {
  '1972 Territory': {
    grain: 22,
    saturation: 65,
    blur: 28,
    scanlines: 5,
  },
  '1974 Color Broadcast': {
    grain: 15,
    saturation: 78,
    blur: 15,
    scanlines: 8,
  },
  'Vintage CRT': {
    grain: 30,
    saturation: 70,
    blur: 25,
    scanlines: 35,
  },
}

function App() {
  const [enabled, setEnabled] = useState(DEFAULT_SETTINGS.enabled)
  const [grain, setGrain] = useState(DEFAULT_SETTINGS.grain)
  const [saturation, setSaturation] = useState(DEFAULT_SETTINGS.saturation)
  const [blur, setBlur] = useState(DEFAULT_SETTINGS.blur)
  const [scanlines, setScanlines] = useState(DEFAULT_SETTINGS.scanlines)
  const [activePreset, setActivePreset] = useState(DEFAULT_SETTINGS.activePreset)

  const [videoUrl, setVideoUrl] = useState(null)
  const [videoName, setVideoName] = useState('')
  const [settingsLoaded, setSettingsLoaded] = useState(false)

  // Load saved settings when the popup opens.
  useEffect(() => {
    if (!globalThis.chrome?.storage?.local) {
      setSettingsLoaded(true)
      return
    }

    chrome.storage.local.get('territorySettings', (result) => {
      const saved = result.territorySettings || DEFAULT_SETTINGS

      setEnabled(saved.enabled ?? DEFAULT_SETTINGS.enabled)
      setGrain(saved.grain ?? DEFAULT_SETTINGS.grain)
      setSaturation(saved.saturation ?? DEFAULT_SETTINGS.saturation)
      setBlur(saved.blur ?? DEFAULT_SETTINGS.blur)
      setScanlines(saved.scanlines ?? DEFAULT_SETTINGS.scanlines)
      setActivePreset(saved.activePreset ?? DEFAULT_SETTINGS.activePreset)

      setSettingsLoaded(true)
    })
  }, [])

  // Save settings and send changes to the active tab.
  useEffect(() => {
    if (!settingsLoaded) return

    const settings = {
      enabled,
      grain,
      saturation,
      blur,
      scanlines,
      activePreset,
    }

    if (globalThis.chrome?.storage?.local) {
      chrome.storage.local.set({ territorySettings: settings })
    }

    if (!globalThis.chrome?.tabs?.query) return

    chrome.tabs.query(
      { active: true, currentWindow: true },
      (tabs) => {
        const tabId = tabs[0]?.id
        if (tabId === undefined) return

        chrome.tabs.sendMessage(
          tabId,
          {
            type: 'TERRITORY_SETTINGS',
            settings,
          },
          () => {
            // Ignore tabs where the content script is unavailable.
            if (chrome.runtime.lastError) return
          }
        )
      }
    )
  }, [
    settingsLoaded,
    enabled,
    grain,
    saturation,
    blur,
    scanlines,
    activePreset,
  ])

  const applyPreset = (name) => {
    const preset = presets[name]

    setGrain(preset.grain)
    setSaturation(preset.saturation)
    setBlur(preset.blur)
    setScanlines(preset.scanlines)
    setActivePreset(name)
  }

  const handleVideoUpload = (event) => {
    const file = event.target.files[0]

    if (file) {
      if (videoUrl) URL.revokeObjectURL(videoUrl)

      setVideoUrl(URL.createObjectURL(file))
      setVideoName(file.name)
    }
  }

  const filterStyle = enabled
    ? {
        filter: `sepia(0.18) saturate(${saturation}%) contrast(90%) brightness(103%) blur(${blur / 100}px)`,
      }
    : {}

  const markCustom = () => setActivePreset('Custom')

  return (
    <div className="app">
      <header className="header">
        <div className="brand">
          <span className="brand-icon">TV</span>
          <div>
            <h1>TERRITORY TV</h1>
            <p>WRESTLING BROADCAST RESTORATION</p>
          </div>
        </div>

        <button
          className={enabled ? 'toggle active' : 'toggle'}
          onClick={() => setEnabled(!enabled)}
        >
          {enabled ? 'FILTER ON' : 'FILTER OFF'}
        </button>
      </header>

      <main>
        <section className="preview">
          <div className="preview-label">LIVE BROADCAST PREVIEW</div>

          <div className="screen">
            {videoUrl ? (
              <video
                src={videoUrl}
                controls
                autoPlay
                style={filterStyle}
              />
            ) : (
              <div className="placeholder">
                <span>1973</span>
                <h2>TERRITORY WRESTLING</h2>
                <p>CLASSIC BROADCAST EXPERIENCE</p>
                <label className="upload-button">
                  LOAD WRESTLING VIDEO
                  <input
                    type="file"
                    accept="video/*"
                    onChange={handleVideoUpload}
                    hidden
                  />
                </label>
              </div>
            )}

            {enabled && videoUrl && (
              <>
                <div className="grain" style={{ opacity: grain / 100 }} />
                <div className="scanlines" style={{ opacity: scanlines / 100 }} />
                <div className="warm-tint" />
                <div className="vignette" />
                <div className="flicker" />
              </>
            )}
          </div>

          <div className="preview-footer">
            <span>CHANNEL 04</span>
            <span>{videoName || '1973 TERRITORY BROADCAST'}</span>
            <span>COLOR TV</span>
          </div>

          {videoUrl && (
            <label className="upload-button replace-video">
              CHANGE VIDEO
              <input
                type="file"
                accept="video/*"
                onChange={handleVideoUpload}
                hidden
              />
            </label>
          )}
        </section>

        <section className="controls">
          <div className="section-heading">
            <div>
              <h2>PICTURE SETTINGS</h2>
              <p>Customize your vintage broadcast</p>
            </div>
          </div>

          <div className="preset-selector">
            {Object.keys(presets).map((name) => (
              <button
                key={name}
                className={
                  activePreset === name
                    ? 'preset-button selected'
                    : 'preset-button'
                }
                onClick={() => applyPreset(name)}
              >
                {name}
              </button>
            ))}
          </div>

          <FilterSlider
            label="Film Grain"
            value={grain}
            onChange={setGrain}
            onInteract={markCustom}
          />

          <FilterSlider
            label="Color Saturation"
            value={saturation}
            onChange={setSaturation}
            onInteract={markCustom}
          />

          <FilterSlider
            label="Soft Focus"
            value={blur}
            onChange={setBlur}
            onInteract={markCustom}
          />

          <FilterSlider
            label="Scan Lines"
            value={scanlines}
            onChange={setScanlines}
            onInteract={markCustom}
          />

          <button
            className="reset"
            onClick={() => {
              setGrain(DEFAULT_SETTINGS.grain)
              setSaturation(DEFAULT_SETTINGS.saturation)
              setBlur(DEFAULT_SETTINGS.blur)
              setScanlines(DEFAULT_SETTINGS.scanlines)
              setActivePreset('Custom')
            }}
          >
            RESET SETTINGS
          </button>
        </section>
      </main>

      <footer>
        TERRITORY TV © 1973 — THE GOLDEN AGE OF WRESTLING
      </footer>
    </div>
  )
}

function FilterSlider({ label, value, onChange, onInteract }) {
  return (
    <div className="slider-control">
      <div className="slider-heading">
        <label>{label}</label>
        <span>{value}%</span>
      </div>

      <input
        type="range"
        min="0"
        max="100"
        value={value}
        onChange={(e) => {
          onChange(Number(e.target.value))
          onInteract()
        }}
      />
    </div>
  )
}

export default App