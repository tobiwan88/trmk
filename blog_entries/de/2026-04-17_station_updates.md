---
title: "Station Updates — Vier Wochen Debugging"
date: "2026-04-17"
---

# Station Updates — Vier Wochen Debugging

## Zurück aus Taiwan

Nach zwei Wochen in Taiwan, in denen ich mich durch jeden Nachtmarkt gefuttert habe, kam ich mit neuem Fokus zurück. Das Weather Station Projekt hatte lange auf "lokal gut genug" gestanden, und ich war endlich genervt genug von der engen Kopplung im HTTP Dashboard, um was zu ändern.

Das ursprüngliche Design hatte bereits ZBUS zum Entkoppeln, aber irgendwie war der Dashboard-Code trotzdem mit der Sensor-Logik verwoben. Ein klarer Prompt an Claude und wir haben refactored.

## Die Entkopplung, die dann auch wirklich stimmte

Der erste Schritt war, HTML und CSS aus dem C Code rauszuholen. Es war peinlich, Präsentationslogik im Embedded C zu haben — nicht gerade wie man代码 zeigen will. Unabhängige Dateien bedeuteten auch, dass der LVGL-Widget-Ansatz für das Display sauberer wurde. Neue Sensoren hinzufügen bedeutete Widgets hinzufügen, und jetzt zogen sowohl das Web-Dashboard als auch das physische Display aus derselben sauberen Datenschicht.

Wer hätte gedacht, dass separate Dateien auch den UI-Redesign weniger schmerzhaft machen.

![High Level Konzept des Displays](../img/26_04_web1.png)

![High Level Konzept des Displays](../img/26_04_web2.png)

![High Level Konzept des Displays](../img/26_04_ui.png)

## Dokumentation zuerst, Fragen später

Eine Sache, die ich auf die harte Tour gelernt hab: Wartung beginnt am Tag, an dem du den Code schreibst, nicht sechs Monate später, wenn du alles vergessen hast. Also bevor wir weitere Features eingebaut haben, haben wir die Architektur-Dokumente sortiert und die ADRs aktualisiert. Mermaid-Diagramme rendern schön im generierten HTML, was das Ganze navigierbarer macht als eine Wand aus Text.

Als Nächstes: CI. GitHub Actions, PR Checks, und vollständige Integrationstests mit pytest. Ich schreib dazu einen eigenen Post — das Thema ist umfangreich genug dafür.

(https://github.com/tobiwan88/weather-station/actions/runs/24583292255)

## Dann kam Security

Die API hatte keine Authentifizierung. Nicht super für was, das am Internet hängt, auch wenn es nur meine persönliche Wetterstation ist. Eine schnelle tokenbasierte Auth-Implementierung schien straightforward. Manuelle Tests bestanden. Ich hab Claude gebeten, Integrationstests hinzuzufügen.

Und dann fiel alles auseinander.

## Der schmerzhafte Weg zu debuggbare Firmware

Was sie dir nicht über Remote Coding erzählen: der Agent dreht manchmal Kreise, weil er einfach nicht sehen kann, was wirklich fehlschlägt. Meine Tests schlugen fehl, und Claude schlug ständig die falschen Fixes vor — Connection Limits erhöhen, Timeouts ändern, Retries hinzufügen. Immer wieder von vorn.

Was wirklich los war: Der HTTP Server hatte ein Header-Length-Limit, das zu kurz für das Token im Authorization Header war. `#HTTP_SERVER_MAX_HEADER_LEN` — kurz genug um das Token abzuschneiden, lang genug um Debugging schmerzhaft zu machen.

Der Fix-Verlauf:
1. Bessere Ausgabe im Test Harness selbst --> Der Harness und pytest hatten am Anfang keine Debug-Ausgabe
2. Log-Level hochgedreht
3. Die eigentliche Ursache in der Server-Config gefunden

Nicht alle Fehler sind behoben, aber zumindest die Tests lassen sich jetzt ausführen. Langsam bekommen wir nützliche Fehlerlogs und genug Input darüber, was noch nicht läuft.

## Nächste Schritte

Alle Tests grün kriegen, vier laufen noch fehl aber die Tokens sind abgelaufen. Port auf echte Hardware. Die verschiedenen Dev-Kits sitzen ungeduldig auf meinem Schreibtisch. Mal sehen ob es sofort läuft oder ob noch eine Runde Debugging ansteht.

Spoiler: wahrscheinlich Letzteres.