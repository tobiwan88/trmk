---
title: "Wie Claude mich auf die falschen Fehler hinwies"
date: "2026-02-28"
---
# Embedded Weather Station – AI, UX & Zephyr

Diesen Samstag habe ich versucht, LVGL zum Laufen zu bringen und eine einfache UX mit Claude zu entwickeln. Das klang am Anfang einfach, war es aber nicht.

## Der Plan
Ich habe das Design der gewünschten UX gezeichnet und als Basis für die Generierung verwendet. Es gab bereits einen Platzhalter, und zuerst wollte ich prüfen, ob es funktioniert.
![Design](../img/ux_drawn.jpg)

## Und dann kam der Fehler

Nachdem ich alles gebaut, SDL aktiviert und Docker eingerichtet hatte, um meine X-Session an XQuartz für macOS weiterzuleiten, habe ich mit der guten alten xclock geprüft, ob es funktioniert. Ich startete den Zephyr-Build und bekam einen Fehler:

```
No matching fbConfigs or visuals found
glx: failed to create drisw screen
X Error of failed request:  BadValue (integer parameter out of range for operation)
  Major opcode of failed request:  149 (GLX)
  Minor opcode of failed request:  24 (X_GLXCreateNewContext)
  Value in failed request:  0x0
  Serial number of failed request:  27
  Current serial number in output stream:  28
```

Claude wies auf fehlende Bibliotheken hin, also fügte ich die verschiedenen GLX-Bibliotheken hinzu und – immer noch derselbe Fehler...
Dann schlug es vor, einen Software-Treiber zu verwenden. Immer noch dasselbe.

Frustriert suchte ich nach Alternativen: Xvfb und x11vnc. Ich richtete sie ein, und jetzt gab es keine Abstürze mehr, aber ein leerer Bildschirm :/

Ich kompilierte dann schnell ein Python-Skript mit SDL, das funktionierte, und baute dann ein Zephyr-Sample, das ebenfalls funktionierte. Das deutete darauf hin, dass etwas in meinem Setup fehlte. Mit diesem als Referenz fand Claude heraus, dass bestimmte Aufrufe fehlten. Jetzt wird die LVGL-UI korrekt gerendert.

![Design](../img/ux_v1.jpg)

## Fazit

Am Ende läuft die Wetterstation-UI – aber nicht dank AI allein, sondern dank klassischem Debugging und Sample-Code. Claude hat beim LVGL-Code geholfen, aber ohne meine eigene Recherche und Tests hätte ich das Ziel nicht erreicht.

**Nächster Schritt:** Weitere interaktive Elemente hinzufügen und die Markdown-Dateien refaktorieren, um den Workflow effizienter zu gestalten.

**Code auf GitHub:** Wenn du das Setup sehen möchtest, schau dir [github.com/tobiwan88/trmk](https://github.com/tobiwan88/trmk) an. Feedback und Verbesserungen sind willkommen!
