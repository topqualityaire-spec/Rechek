/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { createRoot } from 'react-dom/client';
import { GoogleGenAI, Type } from '@google/genai';

const App = () => {
  const [unitType, setUnitType] = useState('Refrigerator');
  const [systemType, setSystemType] = useState('Walk-in');
  const [refrigerant, setRefrigerant] = useState('R-404A');
  const [manufacturer, setManufacturer] = useState('Generic/Other');
  const [model, setModel] = useState('Generic/Other');
  const [ambientTemp, setAmbientTemp] = useState('95');
  const [boxTemp, setBoxTemp] = useState('');
  const [actualLowPressure, setActualLowPressure] = useState('');
  const [actualHighPressure, setActualHighPressure] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [results, setResults] = useState(null);
  const [history, setHistory] = useState([]);
  const [isManufacturerDropdownOpen, setIsManufacturerDropdownOpen] = useState(false);
  const [installPrompt, setInstallPrompt] = useState(null);
  const manufacturerDropdownRef = useRef(null);

  const refrigerants = [
    'R-1234yf', 'R-134a', 'R-22', 'R-290 (Propane)', 'R-404A', 'R-407A', 'R-407C', 'R-410A', 'R-448A', 'R-449A', 'R-450A', 'R-452A', 'R-507', 'R-513A',
  ].sort();

  const refrigerantInfo = {
    'R-1234yf': { pressureAt25F: 14.1 },
    'R-134a': { pressureAt25F: 22.3 },
    'R-22': { pressureAt25F: 47.6 },
    'R-290 (Propane)': { pressureAt25F: 47.8 },
    'R-404A': { pressureAt25F: 68.6 },
    'R-407A': { pressureAt25F: 63.0 },
    'R-407C': { pressureAt25F: 55.2 },
    'R-410A': { pressureAt25F: 89.9 },
    'R-448A': { pressureAt25F: 60.3 },
    'R-449A': { pressureAt25F: 61.9 },
    'R-450A': { pressureAt25F: 23.3 },
    'R-452A': { pressureAt25F: 70.5 },
    'R-507': { pressureAt25F: 72.1 },
    'R-513A': { pressureAt25F: 28.6 },
  };
  
  const manufacturerData = {
    'Generic/Other': {
      logoUrl: null,
      models: { 'Generic/Other': {} }
    },
    'Beverage-Air': {
      logoUrl: 'https://logo.clearbit.com/beverage-air.com',
      models: {
        'Generic/Other': {},
        'DD78': { refrigerant: 'R-134a', chargeOz: 12, tempRangeF: '36-38' },
        'UR48': { refrigerant: 'R-290 (Propane)', chargeOz: 3.5, tempRangeF: '36-38' },
      }
    },
    'Heatcraft': {
      logoUrl: 'https://logo.clearbit.com/heatcraftrpd.com',
      models: {
        'Generic/Other': {},
        'PTN053L6B': { refrigerant: 'R-448A', chargeOz: null, tempRangeF: '-10 to 0' },
        'Bohn LET090': { refrigerant: 'R-404A', chargeOz: null, tempRangeF: '35 to 40' },
        'PRO3070B': { refrigerant: 'R-448A', chargeOz: null, tempRangeF: '35 to 40' },
        'LLE-120': { refrigerant: 'R-404A', chargeOz: null, tempRangeF: '-10 to 0' },
      }
    },
    'Hoshizaki': {
      logoUrl: 'https://logo.clearbit.com/hoshizakiamerica.com',
      models: {
        'Generic/Other': {},
        'CR1B-FS': { refrigerant: 'R-404A', chargeOz: 10.2, tempRangeF: '33-39' },
        'F1A-FS': { refrigerant: 'R-404A', chargeOz: 12.7, tempRangeF: '-10' },
      }
    },
    'Traulsen': {
      logoUrl: 'https://logo.clearbit.com/traulsen.com',
      models: {
        'Generic/Other': {},
        'AHT232WUT-FHS': { refrigerant: 'R-290 (Propane)', chargeOz: 4.5, tempRangeF: '-5 to 0' },
        'G10010': { refrigerant: 'R-134a', chargeOz: 11, tempRangeF: '34-38' },
        'G12010': { refrigerant: 'R-450A', chargeOz: null, tempRangeF: '34-38' },
        'G20010': { refrigerant: 'R-450A', chargeOz: null, tempRangeF: '34-38' },
        'RHF232WUT': { refrigerant: 'R-290 (Propane)', chargeOz: 3.8, tempRangeF: '-5 to 0' },
        'RHT132WUT-FHS': { refrigerant: 'R-290 (Propane)', chargeOz: 3.7, tempRangeF: '34-38' }
      }
    },
    'True': {
      logoUrl: 'https://logo.clearbit.com/truemfg.com',
      models: {
        'Generic/Other': {},
        'T-49': { refrigerant: 'R-290 (Propane)', chargeOz: 5.5, tempRangeF: '33-38' },
        'T-49F': { refrigerant: 'R-404A', chargeOz: 22, tempRangeF: '-10' },
        'T-23': { refrigerant: 'R-134a', chargeOz: 8, tempRangeF: '33-38' },
      }
    },
  };

  const typeIcons = {
    Refrigerator: '🍎',
    Freezer: '❄️',
    'Walk-in': '🚪',
    'Reach-in': '🖐️',
  };
  
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  useEffect(() => {
    // PWA Manifest and Service Worker setup
    const setupPWA = () => {
        // 1. Create and inject the manifest
        const createIcon = (size) => {
            const svg = `
                <svg width="${size}" height="${size}" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
                    <rect width="100" height="100" rx="20" fill="#3498db" />
                    <text x="50" y="50" font-size="60" fill="white" text-anchor="middle" dominant-baseline="central" font-family="sans-serif">❄️</text>
                </svg>
            `;
            // btoa() fails on multi-byte characters. We need to encode the string properly first.
            return `data:image/svg+xml;base64,${btoa(unescape(encodeURIComponent(svg)))}`;
        };

        const manifest = {
            name: 'Rechek - HVAC/R Pressure Tool',
            short_name: 'Rechek',
            description: 'Get target operating pressures, temperatures, and repair suggestions for refrigeration units.',
            start_url: '.',
            display: 'standalone',
            background_color: '#f0f4f8',
            theme_color: '#3498db',
            icons: [
                { src: createIcon(192), sizes: '192x192', type: 'image/svg+xml' },
                { src: createIcon(512), sizes: '512x512', type: 'image/svg+xml' },
            ],
        };

        const manifestBlob = new Blob([JSON.stringify(manifest)], { type: 'application/json' });
        const manifestUrl = URL.createObjectURL(manifestBlob);
        const manifestLink = document.createElement('link');
        manifestLink.rel = 'manifest';
        manifestLink.href = manifestUrl;
        document.head.appendChild(manifestLink);

        // 2. Create and register the service worker
        if ('serviceWorker' in navigator) {
            const swCode = `
                const CACHE_NAME = 'rechek-cache-v1';
                const urlsToCache = [
                    '/',
                    'index.html',
                    'index.css',
                    'index.tsx'
                ];

                self.addEventListener('install', event => {
                    event.waitUntil(
                        caches.open(CACHE_NAME)
                            .then(cache => {
                                console.log('Opened cache');
                                return cache.addAll(urlsToCache);
                            })
                            .catch(err => {
                                console.error('Failed to cache files during install:', err);
                            })
                    );
                });

                self.addEventListener('fetch', event => {
                    event.respondWith(
                        caches.match(event.request)
                            .then(response => {
                                if (response) {
                                    return response; // Serve from cache
                                }
                                // Not in cache, fetch from network
                                return fetch(event.request).then(
                                    networkResponse => {
                                        if (!networkResponse || networkResponse.status !== 200) {
                                            return networkResponse;
                                        }

                                        // For cross-origin requests (e.g. CDNs, fonts), we get an opaque response.
                                        // We can cache it but not inspect it. 'basic' is same-origin.
                                        if (networkResponse.type === 'basic' || networkResponse.type === 'opaque') {
                                            const responseToCache = networkResponse.clone();
                                            caches.open(CACHE_NAME)
                                                .then(cache => {
                                                    cache.put(event.request, responseToCache);
                                                });
                                        }
                                        return networkResponse;
                                    }
                                );
                            })
                    );
                });
                
                self.addEventListener('activate', event => {
                    const cacheWhitelist = [CACHE_NAME];
                    event.waitUntil(
                        caches.keys().then(cacheNames => {
                            return Promise.all(
                                cacheNames.map(cacheName => {
                                    if (cacheWhitelist.indexOf(cacheName) === -1) {
                                        return caches.delete(cacheName);
                                    }
                                })
                            );
                        })
                    );
                });
            `;
            
            const swBlob = new Blob([swCode], { type: 'application/javascript' });
            const swUrl = URL.createObjectURL(swBlob);
            navigator.serviceWorker.register(swUrl)
                .then(registration => {
                    console.log('ServiceWorker registration successful with scope: ', registration.scope);
                })
                .catch(error => {
                    console.log('ServiceWorker registration failed: ', error);
                });
        }
    };
    setupPWA();
  }, []);
  
  useEffect(() => {
    // Logic to capture the install prompt event
    const handleBeforeInstallPrompt = (e) => {
        e.preventDefault();
        setInstallPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    return () => {
        window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  useEffect(() => {
    try {
      const savedHistory = localStorage.getItem('refrigerationHistory');
      if (savedHistory) setHistory(JSON.parse(savedHistory));
    } catch (err) {
      console.error("Failed to load data from localStorage", err);
    }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem('refrigerationHistory', JSON.stringify(history));
    } catch (err) {
      console.error("Failed to save history to localStorage", err);
    }
  }, [history]);

  useEffect(() => {
    setModel('Generic/Other');
  }, [manufacturer]);

  useEffect(() => {
    if (manufacturer !== 'Generic/Other' && model !== 'Generic/Other') {
        const modelData = manufacturerData[manufacturer].models[model];
        if (modelData && modelData.refrigerant) {
            setRefrigerant(modelData.refrigerant);
        }
    }
  }, [model, manufacturer]);
  
  useEffect(() => {
    const handleClickOutside = (event) => {
        if (manufacturerDropdownRef.current && !manufacturerDropdownRef.current.contains(event.target)) {
            setIsManufacturerDropdownOpen(false);
        }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
        document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);
  
  const handleInstallClick = () => {
    if (installPrompt) {
        installPrompt.prompt();
        installPrompt.userChoice.then((choiceResult) => {
            if (choiceResult.outcome === 'accepted') {
                console.log('User accepted the install prompt');
            } else {
                console.log('User dismissed the install prompt');
            }
            setInstallPrompt(null);
        });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setResults(null);
    
    const refPressureInfo = refrigerantInfo[refrigerant]
        ? `(Note: This refrigerant has a reference pressure of ${refrigerantInfo[refrigerant].pressureAt25F} PSIG at 25°F)`
        : '';

    let manufacturerInfoPrompt = '';
    if (manufacturer !== 'Generic/Other' && model !== 'Generic/Other') {
        const modelData = manufacturerData[manufacturer].models[model];
        if (modelData) {
            manufacturerInfoPrompt = `
            The specific unit is a ${manufacturer} ${model}.
            Manufacturer specifications for this model are:
            - Refrigerant: ${modelData.refrigerant}
            - Factory Charge: ${modelData.chargeOz ? `${modelData.chargeOz} oz` : 'Varies'}
            - Target Temperature Range: ${modelData.tempRangeF}°F
            Use this manufacturer data as the primary source for your calculations and ideal specs.
            `;
        }
    }
    
    const prompt = `
      Act as an expert HVAC/R technician.
      ${manufacturerInfoPrompt}

      For a commercial ${systemType} ${unitType} using ${refrigerant} refrigerant ${refPressureInfo}, with an ambient temperature of ${ambientTemp}°F and an actual measured box temperature of ${boxTemp}°F, provide the following:

      PART 1: TARGET SPECS & ANALYSIS (based on ACTUAL box temp)
      Provide the following target values to maintain the CURRENT measured box temperature:
      1. Target box temperature range for this type of equipment.
      2. Target evaporator coil temperature (Saturated Suction Temperature).
      3. Target Temperature Differential (TD / Delta T).
      4. Target low-side (suction) pressure in PSIG.
      5. Target high-side (head) pressure in PSIG.
      6. A brief diagnosis explaining if the current state is acceptable for the given box temperature and what the pressures indicate.
      7. Analyze the data for signs of a potential refrigerant leak. Provide a leak potential rating (Low, Medium, or High) and a brief reasoning. A key indicator would be significantly lower-than-expected suction pressure for the required coil temperature to achieve the given box temperature.
      
      PART 2: IDEAL EQUIPMENT SPECS (independent of actual readings)
      Provide the ideal "textbook" operating specifications for this equipment type running at its standard target temperature (e.g., ~38F for a refrigerator, ~0F for a freezer). If specific manufacturer data is provided, prioritize it.
      8. Ideal box temperature range.
      9. Ideal low-side (suction) pressure.
      10. Ideal high-side (head) pressure.

      ${(actualLowPressure && actualHighPressure) ? `
      PART 3: DIAGNOSIS WITH ACTUAL READINGS
      The system's actual measured pressures are ${actualLowPressure} PSIG on the low-side and ${actualHighPressure} PSIG on the high-side.
      11. Based on these actual readings compared to the targets from PART 1, determine the refrigerant charge status (e.g., Undercharged, Overcharged, Appears Correct).
      12. Provide a single, brief, actionable piece of advice corresponding to the charge status.
      13. Provide a list of any OTHER specific, actionable repair suggestions or further diagnostic steps to take (do not include charge advice here).
      ` : ''}
    `;

    const responseSchema = {
      type: Type.OBJECT,
      properties: {
          targetBoxTemp: {
              type: Type.STRING,
              description: "The target box temperature range, e.g., '35°F - 40°F'."
          },
          targetCoilTemp: {
              type: Type.STRING,
              description: "The target evaporator coil temperature (SST), e.g., '25°F'."
          },
          targetDeltaT: {
              type: Type.STRING,
              description: "The target temperature differential (TD / Delta T) between the box air and the evaporator coil, e.g., '10°F'."
          },
          targetLowSidePsig: {
              type: Type.STRING,
              description: "The target low-side (suction) pressure in PSIG based on the ACTUAL box temp, e.g., '28 PSIG'."
          },
          targetHighSidePsig: {
              type: Type.STRING,
              description: "The target high-side (head) pressure in PSIG based on the ACTUAL box temp, e.g., '245 PSIG'."
          },
          diagnosis: {
              type: Type.STRING,
              description: "A brief diagnosis of the system's health based on the calculated pressures and temperatures for the given box temperature."
          },
          leakPotential: {
              type: Type.STRING,
              description: "An assessment of the refrigerant leak potential (Low, Medium, or High)."
          },
          leakReasoning: {
              type: Type.STRING,
              description: "A brief explanation for the leak potential assessment."
          },
          idealBoxTemp: {
              type: Type.STRING,
              description: "The ideal 'textbook' box temperature range for this equipment type, e.g., '35°F - 40°F'."
          },
          idealLowSidePsig: {
              type: Type.STRING,
              description: "The ideal 'textbook' low-side pressure for this equipment type under standard conditions."
          },
          idealHighSidePsig: {
              type: Type.STRING,
              description: "The ideal 'textbook' high-side pressure for this equipment type under standard conditions."
          },
          chargeStatus: {
              type: Type.STRING,
              description: "The determined refrigerant charge status (e.g., 'Undercharged', 'Overcharged', 'Appears Correct'). Only provide this if actual pressures are given."
          },
          chargeAdvice: {
              type: Type.STRING,
              description: "A single, actionable piece of advice based on the charge status. Only provide this if actual pressures are given."
          },
          repairSuggestions: {
              type: Type.ARRAY,
              description: "A list of actionable repair suggestions (excluding charge advice) based on the comparison of actual and ideal pressures.",
              items: { type: Type.STRING }
          }
      },
      required: ["targetBoxTemp", "targetCoilTemp", "targetDeltaT", "targetLowSidePsig", "targetHighSidePsig", "diagnosis", "leakPotential", "leakReasoning", "idealBoxTemp", "idealLowSidePsig", "idealHighSidePsig"],
    };

    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: responseSchema,
            },
        });

      if (response.text) {
        try {
            const parsedResult = JSON.parse(response.text);

            if (!parsedResult.targetBoxTemp || !parsedResult.targetLowSidePsig || !parsedResult.diagnosis) {
                throw new Error("Incomplete JSON response from model.");
            }

            setResults(parsedResult);
            const newHistoryItem = {
              id: Date.now(),
              query: { unitType, systemType, refrigerant, boxTemp, ambientTemp, actualLowPressure, actualHighPressure, manufacturer, model },
              result: parsedResult,
            };
            setHistory(prevHistory => [newHistoryItem, ...prevHistory.filter(item => 
                JSON.stringify(item.query) !== JSON.stringify(newHistoryItem.query)
            )]);
        } catch (parseError) {
            console.error("JSON Parsing/Validation Error:", parseError, "Raw response:", response.text);
            setError(
              "The AI returned a response in an unexpected format. This can happen with unusual or conflicting inputs. Please double-check your values and try again."
            );
        }

      } else {
        setError('The AI returned an empty response, which might be due to safety filters or a temporary issue. Please adjust your inputs and try again.');
      }
    } catch (err) {
      console.error("API Error:", err);
      let userFriendlyError = 'An unexpected error occurred. Please try again.';
      if (err instanceof Error) {
          if (err.message.toLowerCase().includes('fetch') || err.message.toLowerCase().includes('network')) {
              userFriendlyError = 'A network error occurred. Please check your internet connection and try again.';
          } 
          else if (err.message.includes('400') || err.message.includes('invalid argument')) {
               userFriendlyError = 'The request was invalid. Please check the input fields for any errors or typos and try again.';
          } else if (err.message.includes('500') || err.message.includes('internal error')) {
              userFriendlyError = 'The AI service is currently experiencing issues. Please try again in a few moments.';
          } else {
              userFriendlyError = 'An error occurred while communicating with the AI service. Please try again.';
          }
      }
      setError(userFriendlyError);
    } finally {
      setLoading(false);
    }
  };

  const handleHistoryClick = (item) => {
    setUnitType(item.query.unitType);
    setSystemType(item.query.systemType);
    setRefrigerant(item.query.refrigerant);
    setBoxTemp(item.query.boxTemp);
    setManufacturer(item.query.manufacturer || 'Generic/Other');
    setModel(item.query.model || 'Generic/Other');
    setAmbientTemp(item.query.ambientTemp || '95');
    setActualLowPressure(item.query.actualLowPressure || '');
    setActualHighPressure(item.query.actualHighPressure || '');
    setResults(item.result);
    setError('');
    const formTop = document.querySelector('.card');
    if (formTop) {
        formTop.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleClearHistory = () => {
    setHistory([]);
  };

  const ResultCard = ({ icon, title, value }) => (
    <div className="result-card">
        <div className="result-icon">{icon}</div>
        <div className="result-content">
            <h3>{title}</h3>
            <p>{value}</p>
        </div>
    </div>
  );

  const isModelSpecific = manufacturer !== 'Generic/Other' && model !== 'Generic/Other';

  return (
    <main className="container">
      <div className="card">
        <header>
          <h1>❄️ Rechek</h1>
          <p>Get target operating pressures, temperatures, and repair suggestions.</p>
          {installPrompt && (
            <button type="button" className="install-button" onClick={handleInstallClick} aria-label="Install App">
              Install App
            </button>
          )}
        </header>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Unit Type</label>
            <div className="segmented-control">
              <button type="button" onClick={() => setUnitType('Refrigerator')} className={unitType === 'Refrigerator' ? 'active' : ''}>Refrigerator</button>
              <button type="button" onClick={() => setUnitType('Freezer')} className={unitType === 'Freezer' ? 'active' : ''}>Freezer</button>
            </div>
          </div>

          <div className="form-group">
            <label>System Type</label>
            <div className="segmented-control">
              <button type="button" onClick={() => setSystemType('Walk-in')} className={systemType === 'Walk-in' ? 'active' : ''}>Walk-in</button>
              <button type="button" onClick={() => setSystemType('Reach-in')} className={systemType === 'Reach-in' ? 'active' : ''}>Reach-in</button>
            </div>
          </div>
          
          <div className="form-grid">
            <div className="form-group">
              <label htmlFor="manufacturer-select">Manufacturer</label>
              <div className="custom-select-container" ref={manufacturerDropdownRef}>
                  <button
                      type="button"
                      className="custom-select-trigger"
                      onClick={() => setIsManufacturerDropdownOpen(!isManufacturerDropdownOpen)}
                      aria-haspopup="listbox"
                      aria-expanded={isManufacturerDropdownOpen}
                  >
                      <span className="custom-select-value">
                          {manufacturerData[manufacturer]?.logoUrl && manufacturer !== 'Generic/Other' && (
                              <img src={manufacturerData[manufacturer].logoUrl} alt={`${manufacturer} logo`} className="manufacturer-logo" onError={(e) => { e.target.style.display = 'none'; }} />
                          )}
                          {manufacturer}
                      </span>
                  </button>
                  {isManufacturerDropdownOpen && (
                      <ul className="custom-select-options" role="listbox">
                          {Object.keys(manufacturerData).sort().map(m => (
                              <li
                                  key={m}
                                  className={`custom-select-option ${manufacturer === m ? 'selected' : ''}`}
                                  onClick={() => {
                                      setManufacturer(m);
                                      setIsManufacturerDropdownOpen(false);
                                  }}
                                  role="option"
                                  aria-selected={manufacturer === m}
                              >
                                  {manufacturerData[m].logoUrl && (
                                      <img src={manufacturerData[m].logoUrl} alt={`${m} logo`} className="manufacturer-logo" onError={(e) => { e.target.style.display = 'none'; }}/>
                                  )}
                                  {m}
                              </li>
                          ))}
                      </ul>
                  )}
              </div>
            </div>
            <div className="form-group">
                <label htmlFor="model-select">Model</label>
                <select id="model-select" value={model} onChange={(e) => setModel(e.target.value)} disabled={manufacturer === 'Generic/Other'}>
                    {manufacturerData[manufacturer] && Object.keys(manufacturerData[manufacturer].models).sort().map(m => <option key={m} value={m}>{m}</option>)}
                </select>
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="refrigerant-select">Refrigerant</label>
            <select id="refrigerant-select" value={refrigerant} onChange={(e) => setRefrigerant(e.target.value)} disabled={isModelSpecific}>
              {refrigerants.map(r => <option key={r} value={r}>{r}</option>)}
            </select>
            {isModelSpecific && <small>Refrigerant is set by the selected model.</small>}
          </div>
          
          <div className="form-grid">
            <div className="form-group">
              <label htmlFor="ambient-temp-input">Ambient Temp (°F)</label>
              <input
                  id="ambient-temp-input"
                  type="number"
                  value={ambientTemp}
                  onChange={(e) => setAmbientTemp(e.target.value)}
                  placeholder="e.g., 95"
                  required
              />
            </div>
            <div className="form-group">
              <label htmlFor="box-temp-input">Box Temp (°F)</label>
              <input
                  id="box-temp-input"
                  type="number"
                  value={boxTemp}
                  onChange={(e) => setBoxTemp(e.target.value)}
                  placeholder="e.g., 38"
                  required
              />
            </div>
          </div>

          <div className="form-grid">
            <div className="form-group">
              <label htmlFor="low-pressure-input">Actual Low PSIG</label>
              <input
                  id="low-pressure-input"
                  type="number"
                  value={actualLowPressure}
                  onChange={(e) => setActualLowPressure(e.target.value)}
                  placeholder="Optional"
              />
            </div>
            <div className="form-group">
              <label htmlFor="high-pressure-input">Actual High PSIG</label>
              <input
                  id="high-pressure-input"
                  type="number"
                  value={actualHighPressure}
                  onChange={(e) => setActualHighPressure(e.target.value)}
                  placeholder="Optional"
              />
            </div>
          </div>

          <button type="submit" disabled={loading}>
            {loading ? <div className="spinner"></div> : 'Get Specs'}
          </button>
        </form>

        {error && <div className="error-message">{error}</div>}

        {results && (
          <section className="results-section" aria-live="polite">
            <h2>Results for {manufacturer !== 'Generic/Other' ? `${manufacturer} ${model}` : `${systemType} ${unitType}`} ({refrigerant})</h2>
            
            {(actualLowPressure || actualHighPressure) && (
            <div className="results-group">
              <h3>Your Readings</h3>
              <div className="results-grid">
                  {actualLowPressure && (
                    <ResultCard icon="📉" title="Actual Suction Pressure" value={`${actualLowPressure} PSIG`} />
                  )}
                  {actualHighPressure && (
                    <ResultCard icon="📈" title="Actual Head Pressure" value={`${actualHighPressure} PSIG`} />
                  )}
              </div>
            </div>
            )}
            
            <div className="results-group">
                <h3>{`Target Specs for ${boxTemp}°F Box Temp`}</h3>
                <div className="results-grid">
                    <ResultCard icon="🌡️" title="Target Box Temp Range" value={results.targetBoxTemp} />
                    <ResultCard icon="🧊" title="Target Coil Temp (SST)" value={results.targetCoilTemp} />
                    <ResultCard icon="↔️" title="Target TD / Delta T" value={results.targetDeltaT} />
                    <ResultCard icon="📉" title="Target Suction Pressure" value={results.targetLowSidePsig} />
                    <ResultCard icon="📈" title="Target Head Pressure" value={results.targetHighSidePsig} />
                </div>
            </div>

            <div className="results-group">
                <h3>Ideal Specs for this Equipment</h3>
                <div className="results-grid">
                    <ResultCard icon="🌡️" title="Ideal Box Temp Range" value={results.idealBoxTemp} />
                    <ResultCard icon="📉" title="Ideal Suction Pressure" value={results.idealLowSidePsig} />
                    <ResultCard icon="📈" title="Ideal Head Pressure" value={results.idealHighSidePsig} />
                </div>
            </div>
            
            <div className="diagnosis-result">
                <h3>Diagnosis</h3>
                <p>{results.diagnosis}</p>
            </div>
            {results.chargeStatus && results.chargeAdvice && (
              <div className="charge-status-result">
                  <h3>Charge Status</h3>
                  <div className="charge-badge-container">
                      <span className={`charge-badge ${results.chargeStatus.toLowerCase().replace(/\s+/g, '-')}`}>{results.chargeStatus}</span>
                  </div>
                  <p>{results.chargeAdvice}</p>
              </div>
            )}
            <div className="leak-analysis-result">
                <h3>Leak Potential Analysis</h3>
                <div className="leak-badge-container">
                    <span className={`leak-badge ${results.leakPotential?.toLowerCase()}`}>{results.leakPotential}</span>
                </div>
                <p>{results.leakReasoning}</p>
            </div>
            {results.repairSuggestions && results.repairSuggestions.length > 0 && (
              <div className="repair-suggestions">
                <h3><span role="img" aria-label="wrench">🔧</span> Repair Suggestions</h3>
                <ul>
                  {results.repairSuggestions.map((suggestion, index) => (
                    <li key={index}>{suggestion}</li>
                  ))}
                </ul>
              </div>
            )}
          </section>
        )}
         <footer className="disclaimer">
            <p>
            Disclaimer: These values are typical estimates. Always consult the manufacturer's specifications for precise data.
            </p>
            <p className="developer-credit">
              Developed by Christopher Sosnowski
            </p>
        </footer>

        {history.length > 0 && (
          <section className="history-section">
            <div className="history-header">
              <h2>Query History</h2>
              <button onClick={handleClearHistory} className="clear-history-btn">Clear</button>
            </div>
            <ul className="history-list">
              {history.map(item => (
                <li key={item.id} onClick={() => handleHistoryClick(item)} tabIndex={0} onKeyDown={(e) => e.key === 'Enter' && handleHistoryClick(item)} role="button" aria-label={`View specs for ${item.query.systemType} ${item.query.unitType} with ${item.query.refrigerant} at ${item.query.boxTemp} degrees`}>
                  <span className="history-item-query">
                    <span className="history-icon" aria-hidden="true">{typeIcons[item.query.systemType]}</span>
                    <span className="history-icon" aria-hidden="true">{typeIcons[item.query.unitType]}</span>
                    <span className="history-text">{`${item.query.manufacturer !== 'Generic/Other' ? `${item.query.manufacturer} ${item.query.model}` : `${item.query.systemType} ${item.query.unitType}`} (${item.query.boxTemp}°F @ ${item.query.ambientTemp || '95'}°F Amb.)`}</span>
                  </span>
                  <span className="history-item-refrigerant">{item.query.refrigerant}</span>
                </li>
              ))}
            </ul>
          </section>
        )}
      </div>
    </main>
  );
};

const root = createRoot(document.getElementById('root'));
root.render(<App />);