# marauder-v6-web-gui

Interfaz web autónoma en español para controlar un **ESP32 Marauder v6.1** mediante **Web Serial a 115200 baudios**. Todo funciona desde `index.html`: sin backend, sin cuentas y sin dependencias de producción.

## Características

- Conexión USB mediante Web Serial.
- Terminal en tiempo real con UTF-8 incremental.
- Historial de comandos con ↑/↓.
- LF y CRLF seleccionables.
- Exportación del log de sesión.
- Menú jerárquico equivalente al del dispositivo.
- Separación entre **nombre visible** y **comando enviado** cuando la etiqueta del menú no coincide con la CLI.
- Formularios para operaciones que requieren parámetros.
- Validación de índices y rangos antes del envío.
- Filtro rápido de comandos.
- Botón fijo `stopscan`.
- Interfaz responsive para escritorio y pantallas pequeñas.
- Salida Serial renderizada como texto para evitar interpretar HTML recibido desde el dispositivo.
- Pruebas automáticas con Playwright y Chromium mediante GitHub Actions.

## Menú implementado

### WiFi

**Sniffers**

`sniffprobe`, `sniffbeacon`, `sniffdeauth`, `packetcount`, `sniffpmkid`, `packetmonitor`, `channelanalyzer`, `channelsummary`, `sniffraw`, `pwnagotchi`, `pineapple`

**Scanners**

`pingscan`, `arpscan`, `portscan`, `sshescan`, `telnetscan`, `smtpscan`, `dnsscan`, `httpscan`, `httpscan`, `rdpscan`

**Attacks**

`evilportal`, `deauth`, `apclonespam`, `deauthtarget`, `karma`, `badmsg`, `badmsgtarget`, `assocsleep`, `assocsleeptarget`, `saecommit`, `channelswitch`, `quiettime`

**General**

`clearstations`, `selecthtml`, `selectap`, `viewap`, `selectstation`, `join`, `joinsaved`, `startap`, `hostapinfo`, `setmac`, `shutdown`, `loadwardrive`, `generatessids`, `selectprobessids`, `addssids`, `clearssids`, `clearaps`

### Bluetooth

**Sniffers**

`sniffbt`, `sniffflipper`, `findmy`, `findmymonitor`, `skimmer`, `btanalyze`, `flock`, `metadetect`, `foxhunt`

**Attacks**

`sourapple`, `applejuice`, `swiftpair`, `samsungspam`, `googlespam`, `flipperspam`, `blespam`, `spoofairtag`, `findmysound`

### GPS

`gpsdata`, `nmea`, `tracker start`, `tracker stop`, `gpspoi`

### Device & Settings

`info`, `reboot`, `ls /`, `brightness`, `settings`

Los ajustes como `forcepmkid` o `chanhop` se pueden activar/desactivar desde la terminal según lo que exponga la compilación instalada.

## Etiqueta del menú vs. CLI

Algunas opciones del dispositivo son nombres de menú y no necesariamente la cadena literal que acepta la CLI. La GUI mantiene ambos conceptos separados.

Ejemplos conocidos para v1.16.0:

| Menú | Comando enviado |
| --- | --- |
| `pwnagotchi` | `sniffpwn` |
| `sshescan` | `portscan -s ssh` |
| `dnsscan` | `portscan -s dns` |
| `deauth` | `attack -t deauth` |
| `badmsg` | `attack -t badmsg` |
| `saecommit` | `attack -t sae` |
| `skimmer` | `sniffskim` |
| `flock` | `sniffbt -t flock` |
| `metadetect` | `sniffbt -t meta` |
| `sourapple` | `blespam -t sourapple` |
| `applejuice` | `blespam -t applejuice` |
| `swiftpair` | `blespam -t windows` |
| `samsungspam` | `blespam -t samsung` |
| `googlespam` | `blespam -t google` |
| `flipperspam` | `blespam -t flipper` |
| `tracker start` | `gpstracker -c start` |
| `tracker stop` | `gpstracker -c stop` |

La GUI muestra debajo de cada opción la cadena que enviará realmente. Para una compilación modificada o un fork, ejecuta `help`, `info` y `settings` y ajusta el mapeo en `MENU` si corresponde.

## Operaciones con parámetros

La interfaz abre un editor en lugar de enviar una plantilla incompleta para operaciones como:

- `portscan`
- `karma`
- `selectap`
- `viewap`
- `selectstation`
- `join`
- `setmac`
- `findmy`
- `blespam`
- `spoofairtag`
- `findmysound`
- `brightness`

Los índices deben ser enteros no negativos. `brightness` acepta valores de `0` a `9`.

## Uso local

```bash
python -m http.server 8080 --bind 127.0.0.1
```

Después abre:

```text
http://localhost:8080
```

Usa Chrome o Edge de escritorio, conecta el Marauder por un cable USB de datos y pulsa **Conectar USB**.

Web Serial requiere un contexto seguro: `localhost` o HTTPS. Cierra Arduino Serial Monitor, esptool, PuTTY u otras aplicaciones que puedan tener abierto el mismo puerto.

Configuración de puerto:

- 115200 baudios
- 8 bits
- sin paridad
- 1 bit de parada
- sin control de flujo

## Seguridad de la interfaz

La aplicación utiliza una CSP restrictiva y no carga JavaScript de terceros. Los bytes recibidos por Serial se decodifican y se insertan como texto, no mediante `innerHTML`.

Las opciones de la categoría **Attacks** requieren confirmación explícita antes de enviarse. Utiliza esas funciones únicamente sobre equipos, dispositivos y redes propios o para los que tengas autorización.

Las contraseñas usadas con `join` pueden aparecer en la respuesta del firmware y, por lo tanto, quedar almacenadas en el log exportado. Revisa los logs antes de compartirlos.

## Pruebas

```bash
npm install --no-save playwright
npx playwright install chromium
node tests/browser.cjs
```

La suite comprueba:

- presencia de todas las opciones del menú;
- aliases CLI;
- validación de parámetros;
- Web Serial a 115200;
- LF y CRLF;
- fragmentación UTF-8;
- protección frente a HTML recibido por Serial;
- desconexión y reconexión;
- filtro del menú;
- diseño responsive.

GitHub Actions ejecuta la misma prueba en cada pull request y en los pushes a `main`.

## Referencia

El proyecto toma como referencia ESP32 Marauder v1.16.0 y su implementación CLI. El hardware, los módulos GPS/Bluetooth y determinadas funciones dependen de la compilación concreta instalada en el dispositivo.

Proyecto independiente y no afiliado al autor de ESP32 Marauder.
