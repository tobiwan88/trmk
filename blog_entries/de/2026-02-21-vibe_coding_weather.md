---
title: "Vibe Coding einer Wetterstation – Zephyr-Style"
date: "2026-02-21"
---

# Vibe Coding einer Wetterstation – Zephyr-Style

![Me Vibing around](../img/PXL_20260222_103831977.jpg)

Nach der Modernisierung meiner Website und meines Blog-Workflows mit Claude wollte ich herausfinden, wie weit ich AI-unterstützte Entwicklung für ein echtes Embedded-Projekt treiben kann. Das Ziel: Eine Wetterstation mit Zephyr RTOS bauen, mit simuliertem Display und Fake-Sensordaten – alles orchestriert von Claude in einer echten „Vibe Coding“-Session.

**Langfristig ist das Ziel, ein vollständiges Multi-Sensor-System zu schaffen – später auch auf echter Hardware. Claude soll nicht nur bei der Firmware helfen, sondern auch bei der Board-Auswahl (Devkit Phase 2) und später sogar bei Schaltplan- und PCB-Layout-Entwicklung (Phase 3) unterstützen. Die Idee: AI-Unterstützung maximal ausreizen, von der Simulation bis zum physischen Produkt.**

![High level idea of the Display](../img/PXL_20260221_095505761.MP.jpg)

Aktuell sind wir in **Phase 1: native_sim**. Der Fokus liegt auf dem Gateway mit Display – mindestens das LVGL-UI soll in der Simulation laufen, bevor es auf Hardware geht.

## Warum Zephyr und Vibe Coding?

![My friend claude](../img/Screenshot 2026-02-22 at 11.42.02.png)

Zephyr ist ein modernes RTOS mit starker Modularität. Ich wollte mit der entkoppelten Architektur (zbus, mehrere Nodes etc.) experimentieren – und sehen, ob Claude mich schneller von der Idee zum laufenden Code bringt, mit weniger Overhead. Der Plan: Erst mit `native_sim` für schnelle Iteration starten, später auf echte Hardware wechseln. Als Referenz habe ich Claude auf [tiacsys/bridle](https://github.com/tiacsys/bridle) hingewiesen, ein gutes Zephyr-Starterprojekt.

## Der Prozess: AI als Coding Copilot

Ich habe Claude erste Anforderungen und Architekturideen gegeben. Daraus wurde schnell ein Hin und Her: Claude schlug Code vor, ich habe reviewed, präzisiert und manchmal zurückgelenkt. Wir haben das Event-System iteriert, Module entkoppelt und sogar einen „Start Prompt“ und eine Architektur-Doku generiert (alles im Repo).

### Sensor-Event-Struct: Vom Monolithen zur Skalierbarkeit

Eine der ersten Architekturfragen war die Repräsentation der Sensordaten. Claude schlug zunächst eine monolithische Struktur für jeden Messwerttyp vor:

```c
/* ABGELEHNT – skaliert nicht */
struct env_sensor_data {
    int32_t temperature_milli_c;
    int32_t humidity_milli_pct;
    int32_t pressure_pa;
    int64_t timestamp_ms;
};
```

Das wurde schnell unübersichtlich, sobald mehr Sensortypen dazukamen. Nach Diskussionen landeten wir bei einem viel skalierbareren, transportfreundlichen Format:

```c
/**
 * @brief Sensor measurement event transmitted on sensor_event_chan.
 *
 * Exactly 20 bytes on 32-bit and 64-bit: __packed removes struct-level
 * alignment padding.  No pointers; safe to copy over any transport (LoRa).
 */
struct env_sensor_data {
	uint32_t sensor_uid;   /**< DT-assigned unique sensor identifier   */
	enum sensor_type type; /**< Physical quantity (enum is 32-bit)     */
	int32_t q31_value;     /**< Q31 fixed-point encoded measurement    */
	int64_t timestamp_ms;  /**< k_uptime_get() at sample time, ms      */
} __packed;
```

Diese Version ist kompakt, erweiterbar und sicher für jeden Transport. Keine Pointer, kein Padding, jedes Event ist selbsterklärend.

Ein weiterer früher Vorschlag war ein eng gekoppelter „Sensor Manager“, der alle Sensoren direkt verwaltet. Stattdessen sind wir auf einen entkoppelten Ansatz mit Zephyrs zbus gewechselt – jeder Sensor-Node publiziert seine Events unabhängig. Das macht das System modular und leicht erweiterbar.
Ich habe auch einige Bilder als Ausgangspunkte für die Architektur hinzugefügt, und wir haben an ersten ADRs gearbeitet. Die muss ich noch besser reviewen – ich habe schon einige Dinge gefunden, die mir nicht gefallen, das Backlog wächst.
![Network in the future](../img/PXL_20260221_094631791.jpg)
![Zbus ideas](../img/PXL_20260221_095500635.jpg)

### Was gut lief

- **Schnelles Prototyping:** Mit Claude konnte ich Ideen einwerfen und in Minuten Code oder Architekturvorschläge bekommen. Neue Features (Fake-Sensor, Display-Logik) waren schnell ergänzt – einfach Ziel beschreiben und die AI machen lassen.
- **Parallele Produktivität:** Während Claude Code generierte, konnte ich reviewen, testen oder sogar eine Radrunde drehen. Die AI übernahm Boilerplate und Routine, ich konnte mich auf das Design konzentrieren.
- **Dokugenerierung:** Claude hat Architektur-Dokus automatisch erstellt und half, ein lebendiges `claude.md` für die Projektstruktur zu pflegen.

![Native sim runs](../img/Screenshot 2026-02-22 at 11.45.18.png)

### Die Herausforderungen

- **Kontext- und Token-Limits:** Token-Limits sind das neue „Out of Memory“ – besonders bei Zephyr-Komplexität. Manchmal wurde Kontext komprimiert, ich musste Anforderungen neu erklären oder Claude auf die richtigen Dateien stoßen.
- **Abschweifen:** Die AI driftete manchmal ab, schlug überkomplexe Lösungen vor oder verlor das Ziel aus den Augen. Ein einfaches Backlog half, den Fokus zu halten.
- **Devcontainer-Probleme:** Mein Devcontainer-Setup war etwas kaputt, aber Claude half zur Lösung. Trotzdem waren Resets und Netzwerkprobleme (wie SNTP) nervig.
- **Struct-Design:** Das erste `sensor_event_struct` war zu monolithisch. Nach mehreren Iterationen haben wir für bessere Skalierbarkeit und Entkopplung refaktoriert.

Einige dieser Herausforderungen sind noch nicht vollständig gelöst und werden wohl noch tiefere Recherche und Debugging von mir erfordern.


### Was ich gelernt habe

- **AI gezielt steuern:** Je besser man das System kennt, desto besser kann man Claude lenken. Vage Prompts führen zu ineffizienten oder nicht skalierbaren Vorschlägen.
- **Lebende Dokumentation:** `claude.md` aktuell halten und regelmäßig Architektur-Reviews machen zahlt sich aus – wie in jedem guten Softwareprojekt.
- **Kleine Schritte:** Inkrementell vorgehen, oft reviewen, Kurskorrekturen nicht scheuen.


### Was noch nervt

- **Redundante Recherche:** Manchmal liest Claude Dateien mehrfach oder macht viele Grep-Aufrufe, auch wenn ich schon auf die richtige Stelle hingewiesen habe. Die Ausgabe kann sehr ausführlich werden, Review kostet Zeit.
- **Verwechslungsgefahr bei ähnlichen Kommandos:** Ähnliche Kommandos in den Skills können verwirren – muss ich noch in der Doku nachschlagen.


## Nächste Schritte

- Claude-Nutzung optimieren: Skills vorbereiten, Prompts präzisieren, Backlog schlank halten.
- LVGL für das Display-MVP komplett zum Laufen bringen
- Docker- und Netzwerkprobleme beheben.
- Start Prompt und Architektur-Doku auf GitHub teilen.

## Fazit

Vibe Coding einer Zephyr-basierten Wetterstation mit Claude war produktiv und hat Spaß gemacht. Die AI glänzt bei Boilerplate, Dokumentation und schnellem Prototyping – braucht aber weiter einen Menschen für Architektur und Fokus. Mit mehr Struktur und besseren Prompts kann ich mir vorstellen, so auch größere Embedded-Projekte zu stemmen.

**Code und Doku:** Alles ist (oder wird) auf GitHub veröffentlicht. Wer neugierig ist: Repo anschauen, Feedback geben oder selbst mal Vibe Coding für ein Embedded-Projekt ausprobieren!

**Projekt auf GitHub:** [github.com/tobiwan88/weather-station](https://github.com/tobiwan88/weather-station)
