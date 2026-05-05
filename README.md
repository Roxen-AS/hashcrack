# HashCrack v4.0-BOSS

> Why crack hashes when you can **blast** them?

Live url - https://hashcrack-livid.vercel.app/

---

## Features

| Feature | Description |
|---|---|
| **Auto-identification** | Detects MD5, SHA-1, SHA-224, SHA-256, SHA-384, SHA-512, NTLM, BCRYPT, and more |
| **Multi-API cascade** | Tries md5decrypt → hashtoolkit → md5.gromweb in parallel, stops on first hit |
| **Batch cracking** | Paste raw hashes, JSON blobs, `email:hash` dumps — it extracts everything |
| **File mode** | Drag-and-drop any text file; hashes are extracted and queued automatically |
| **Configurable threads** | 1–10 parallel requests for speed control |
| **Identify tab** | Real-time type detection with security rating, crackability, and entropy |
| **AI analysis** | Claude-powered SRE analysis of session results — patterns, attack vectors, remediation |
| **Export** | Download results as TSV |

---

## Project Structure

```
hashcrack/
├── index.html          # Entry point — HTML shell + script loading
├── README.md
│
├── core/
│   ├── detector.js     # Hash type identification, entropy, extraction
│   └── engine.js       # Crack orchestrator — concurrency, state, events
│
├── api/
│   └── lookup.js       # Multi-API lookup with CORS proxy cascade
│
└── ui/
    ├── styles.css      # Terminal phosphor aesthetic
    ├── renderer.js     # DOM rendering — result rows, badges, identify panel
    └── app.js          # App controller — wires everything, handles all events
```

---

## Usage

### Running locally

Just open `index.html` in a browser — no build step required.

```bash
# Serve locally (recommended for file:// CORS issues)
python3 -m http.server 8080
# then open http://localhost:8080
```

### Cracking hashes

1. Open the **CRACK** tab
2. Paste hashes (one per line, or mixed with text/JSON — auto-extracted)
3. Set thread count (1–10)
4. Click **RUN CRACK**

### Identifying a hash

1. Open the **IDENTIFY** tab
2. Type or paste any hash — type, security rating, entropy shown in real time

### File mode

1. Open the **FILE MODE** tab
2. Drag-and-drop any `.txt`, `.csv`, `.log`, or other text file
3. Hashes are extracted and previewed
4. Click **CRACK EXTRACTED** to run them

### AI Analysis

1. Crack some hashes first
2. Open the **AI ANALYSIS** tab
3. Click **ANALYZE HASHES** — powered by `claude-sonnet-4-20250514`

---

## Supported Hash Types

| Type | Length | Security |
|---|---|---|
| MD5 | 32 chars | ❌ Broken |
| SHA-1 | 40 chars | ⚠️ Deprecated |
| SHA-224 | 56 chars | ✅ Acceptable |
| SHA-256 | 64 chars | ✅ Strong |
| SHA-384 | 96 chars | ✅ Very strong |
| SHA-512 | 128 chars | ✅ Very strong |
| NTLM | 32 chars | ❌ Broken |
| BCRYPT | `$2...` | ✅ Strong (not crackable via lookup) |

---

## Lookup APIs

HashCrack tries the following endpoints in cascade order:

1. **md5decrypt.net** via corsproxy.io
2. **hashtoolkit.com** via allorigins.win  
3. **md5.gromweb.com** via corsproxy.io

Only MD5 and SHA-1 hashes of common/weak passwords will be found. Strong hashes of strong passwords are infeasible via rainbow table lookup — use the AI Analysis tab for attack recommendations.

---


