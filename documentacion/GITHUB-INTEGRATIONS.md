# Error en Capa 8 — GitHub integration research

**Status:** engineering research / implementation plan · **Date:** 2026-11-14

## Objective

Demonstrate two distinct paths into the same local health-data backend:

1. **Galaxy Watch → PC:** provisional physiological observations, especially heart rate, sent via local Wi-Fi; PC stores, visualizes, and evaluates trends.
2. **Dummy medical instrument (Android phone using NFC HCE) → compatible NFC reader (second Android or USB reader) → PC → Watch:** a synthetic instrument result, clearly labeled as such, imported with provenance and displayed on both interfaces.

**Critical hardware constraint:** NFC payment support on a Galaxy Watch does not establish that a third-party Wear OS app can read NFC tags. Test `android.hardware.nfc` reader support on the exact watch. Do not promise phone-to-watch NFC until demonstrated. HCE (card emulation) and reader mode are different capabilities. NFC is a transport mechanism, not a guarantee of clinical accuracy.

## Repositories to inspect

| Priority | Repository | Relevant capability | How we would use it | Caveat |
|---|---|---|---|---|
| P0 | [xuan25/HeartRateStreamer-WearOS](https://github.com/xuan25/HeartRateStreamer-WearOS) | Wear OS heart-rate streaming to a PC over local network | Fastest proof-of-concept for watch → PC | Verify Samsung compatibility, permissions, sampling, packet schema and license before reusing code |
| P0 | [AndroidCrypto/Android_HCE_Beginner_App](https://github.com/AndroidCrypto/Android_HCE_Beginner_App) | Example HCE card and NFC reader; APDU exchange | Prototype synthetic medical reading on one Android and NFC reception on another | MIT license; adapt sample identifiers and protocol; no medical validation |
| P1 | [sfomuseum/android-nfc-clock](https://github.com/sfomuseum/android-nfc-clock) | Android phone HCE demonstration | Alternate simple dummy tag implementation | Demonstrates emulation, not watch NFC reading; check license |
| P1 | [TOM-Platform/TOM-Client-WearOS](https://github.com/TOM-Platform/TOM-Client-WearOS) | Wear OS sensor data to server | Reference for resilient sensor ingestion and sync | MIT license; review maturity and code before adoption |
| P1 | [li-he-li/watch5](https://github.com/li-he-li/watch5) | Watch + Android + desktop monitoring system | Reference if phone bridge becomes necessary | Verify device assumptions and license |
| P1 | [android/wear-os-samples — DataLayer](https://github.com/android/wear-os-samples/tree/main/DataLayer) | Official watch ↔ Android data messaging | Synchronize instrument result from phone to watch | Data Layer is not a direct PC transport |
| P1 | [android/health-samples](https://github.com/android/health-samples) | Official Android health sensor/Health Services samples | Implement watch sensor readings using supported APIs | Sensor availability varies by device and OS |
| P2 | [nfcpy/nfcpy](https://github.com/nfcpy/nfcpy) | Python NFC interaction with supported readers | Optional PC USB NFC reader alternative | Requires compatible USB hardware; HCE/APDU interoperability must be tested |
| P2 | [GusQTC/vitalsbridge](https://github.com/GusQTC/vitalsbridge) | Wearable-to-phone vitals integration | Additional reference, pending code/license review | Not validated for our hardware |
| P2 | [m-lomba/wearable-sensor-data](https://github.com/m-lomba/wearable-sensor-data) | Wear OS sensor data transfer | Additional reference, pending review | Not validated for our hardware |

The P0 repositories were inspected at the public GitHub landing/README level. Other links are reference candidates, not a claim that their code has been tested in our setup.

## Proposed architecture

```text
GALAXY WATCH (provisional) --HTTP/WebSocket over local Wi-Fi--> FASTAPI on PC
                                                         |
ANDROID A (dummy instrument, HCE) --NFC/APDU--> ANDROID B (reader)
                                               --HTTPS/HTTP local--> FASTAPI on PC
                                                         |
                                                  SQLite + rules
                                                         |
                                            React/Vite dashboard
                                                         |
                             Watch receives result over Wi-Fi or via Android bridge
```

For hackathon testing, use a dedicated local network. Keep sensor ingestion and simulated-device ingestion separate at the API boundary, then normalize into the same measurement schema. Implement offline queueing and retries as a later milestone.

## Minimal measurement contract

```json
{
  "measurement_id": "demo-bp-001",
  "astronaut_id": "crew-01",
  "type": "blood_pressure",
  "value": { "systolic": 118, "diastolic": 76 },
  "unit": "mmHg",
  "captured_at": "2026-11-14T18:00:00Z",
  "received_at": "2026-11-14T18:00:02Z",
  "source": {
    "class": "simulated_medical_instrument",
    "device_id": "E8-MED-001",
    "transport": "nfc_hce",
    "reader_id": "android-reader-01"
  },
  "quality": "demo_unverified",
  "synthetic": true
}
```

For watch measurements use `source.class = wearable_preliminary`, `transport = wifi`, and a device-specific sensor ID. Keep timestamps, units, original raw payload, validation status, and origin; never overwrite watch readings with instrument readings. A transfer acknowledgement means *received*, not *clinically verified*.

## Suggested local API

- `POST /api/v1/measurements/watch` — ingest wearable readings.
- `POST /api/v1/measurements/instrument` — ingest NFC reader forwarded payloads.
- `GET /api/v1/measurements?astronaut_id=...` — time-series and history.
- `GET /api/v1/measurements/latest` — dashboard/watch latest values.
- `GET /api/v1/events` or `WS /api/v1/events` — updates to PC and watch.

Validate schema, measurement units, IDs, timestamp plausibility, duplicate IDs, and payload size. Authenticate devices and encrypt transport for any real personal data. Demo readings must remain visibly marked synthetic.

## NFC proof of concept

1. **Inspect hardware**: `adb shell pm list features | grep -i nfc` (on Windows use `findstr /i nfc`). Check `android.hardware.nfc`, `android.hardware.nfc.hce`, and whether reader mode is accessible on the intended device.
2. Build Android A HCE using `HostApduService` and a dedicated application AID. Return a short, versioned synthetic measurement payload to a SELECT/READ command. The exact APDU contract is ours to design.
3. Build Android B reader with `NfcAdapter` reader mode and `IsoDep.transceive`; display received payload and source label.
4. Forward validated result to FastAPI; show `Instrument measurement received` in the desktop dashboard.
5. Sync a concise result/notification to the watch via local Wi-Fi or Wear OS Data Layer if using a phone bridge.
6. Demo an interrupted/duplicate transfer; ensure the backend does not silently duplicate or mislabel data.

**Fallback:** if NFC is blocked by hardware, demonstrate the identical normalized payload via manual import or QR with an explicit `transport` value. Do not call it an NFC transfer.

## Watch → PC proof of concept

1. Clone and inspect `HeartRateStreamer-WearOS` for build instructions, supported permissions, data format, and licensing.
2. Verify heart-rate readings on the actual Galaxy Watch. Never assume a constant sampling rate or medical accuracy.
3. Receive packets on the local PC and translate them into the common measurement contract.
4. Display live values, a last-seen timestamp, data-source badge, and a disconnection state.
5. Test network loss, watch screen-off/background behavior, battery constraints, and reconnect.
6. If direct Wi-Fi is unreliable, evaluate the official Wear OS Data Layer phone bridge.

## UX requirements

- **Watch:** compact preliminary status, last update, action to start check-in, and imported instrument result with source label.
- **PC:** separate *Wearable observations* and *Instrument measurements*; show timestamp, unit, source, quality, synthetic/real badge, trend, and evidence panel.
- **Transfer states:** ready → scanning → reading → validating → received → available on watch; plus timeout, unsupported device, malformed payload, duplicate, offline.
- **No fabricated health score:** a simulated measurement is not a clinical diagnosis. Any suggested medical action must come from a reviewed protocol.
- **Design:** modern UX, retro-80s blue/cyan visual language, restrained glow, accessible contrast, large glanceable watch typography.

## Implementation milestones

- **M0 — Feasibility (must pass):** exact watch model and Android phones identified; NFC HCE↔reader tested; heart-rate stream observed on PC.
- **M1 — Shared backend:** schemas, SQLite persistence, API endpoints, source provenance, deduplication, basic tests.
- **M2 — Watch live demo:** sensor reading to dashboard, reconnection handling, preliminary badge.
- **M3 — NFC dummy demo:** synthetic phone HCE → reader → backend → dashboard; watch receives a notification/result.
- **M4 — Integrated pitch:** provisional observation → instrument assessment → import → evidence/action screen; fallback rehearsed.

## Acceptance tests

- [ ] Actual watch sensor data appears on PC with device ID and timestamp.
- [ ] Removing network connectivity produces a visible disconnected state.
- [ ] A synthetic Android HCE reading is physically read by compatible NFC hardware.
- [ ] Backend stores both sources without confusing provenance.
- [ ] Duplicate measurement ID is idempotent.
- [ ] The watch displays the newly imported instrument result by a supported transport.
- [ ] Every demo measurement is clearly labeled synthetic or real.
- [ ] No claim that NFC reading on Galaxy Watch works without testing it.
- [ ] Repo licenses checked before code reuse and notices retained.

## Source links and further verification

- [HeartRateStreamer-WearOS](https://github.com/xuan25/HeartRateStreamer-WearOS)
- [watch5](https://github.com/li-he-li/watch5)
- [TOM-Client-WearOS](https://github.com/TOM-Platform/TOM-Client-WearOS)
- [android-nfc-clock](https://github.com/sfomuseum/android-nfc-clock)
- [Android HCE Beginner App](https://github.com/AndroidCrypto/Android_HCE_Beginner_App)
- [Google Wear OS DataLayer sample](https://github.com/android/wear-os-samples/tree/main/DataLayer)
- [Google Android Health Samples](https://github.com/android/health-samples)
- [nfcpy](https://github.com/nfcpy/nfcpy)
- [Android NFC HCE docs](https://developer.android.com/develop/connectivity/nfc/hce)
- [Android NFC reader docs](https://developer.android.com/develop/connectivity/nfc/advanced-nfc)

**Next decision:** confirm exact Galaxy Watch model and whether a second NFC Android or USB reader is available. This determines whether the NFC demo can run physically as designed.
