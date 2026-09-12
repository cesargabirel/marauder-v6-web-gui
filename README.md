# marauder-v6-web-gui

Interfaz web autónoma en español para controlar un **ESP32 Marauder v6.1**, con firmware oficial **v1.16.0**, por USB a **115200 baudios**. HTML, CSS y JavaScript están embebidos en `index.html`: sin compilación, dependencias de producción, CDN, cuentas ni backend.

![Interfaz de escritorio, desconectada](docs/desktop.png)

## Qué incluye

- Diseño oscuro adaptable a escritorio, tablets y pantallas pequeñas.
- Conexión manual mediante Web Serial, estado visual, cierre de lectores/escritores y manejo de desconexión física.
- Terminal de texto en tiempo real, decodificación UTF-8 incremental, comandos libres, historial con ↑/↓ y LF/CRLF.
- Accesos WiFi, Bluetooth, GPS y Sistema/SD. Cada botón muestra el comando que envía.
- Listado SD por Serial, exportación del listado, exportación del registro de sesión y copia binaria de archivos seleccionados desde un lector SD local.
- Prueba de navegador reproducible con un puerto serie simulado.

## Compatibilidad y precisión de comandos

El mapeo se verificó contra el **tag oficial v1.16.0**, commit `fe2160f0aa53ad8e6c5860f8dddd6e7bbaa3ba0b`, en [CommandLine.h](https://github.com/justcallmekoko/ESP32Marauder/blob/fe2160f0aa53ad8e6c5860f8dddd6e7bbaa3ba0b/esp32_marauder/CommandLine.h) y [CommandLine.cpp](https://github.com/justcallmekoko/ESP32Marauder/blob/fe2160f0aa53ad8e6c5860f8dddd6e7bbaa3ba0b/esp32_marauder/CommandLine.cpp).

El menú jerárquico reproduce las categorías solicitadas del dispositivo: **WiFi → Sniffers / Scanners / Attacks / General**, **Bluetooth → Sniffers / Attacks**, **GPS** y **Sistema / SD**. Usa elementos HTML nativos `details` / `summary` y CSS, sin scripts de apertura. Tab mueve el foco; Enter o Espacio abre/cierra un nivel. El menú tiene desplazamiento independiente y la terminal central conserva su funcionamiento.

Las etiquetas físicas no siempre coinciden con comandos CLI. Cada botón muestra la sintaxis realmente enviada. **No se envían nombres inventados**: por ejemplo, `pwnagotchi` usa `sniffpwn`. `scanap` no existe literalmente: su botón usa `sniffbeacon` para observar AP mediante beacons. `scanall` observa AP y estaciones. Cinco entradas quedan deshabilitadas con explicación: `scansta`, `shutdown`, `startap`, `stopap` y `sniffraw` dentro de Bluetooth. Por eso la GUI no sustituye funciones físicas que el firmware no expone por Serial.

Los botones que necesitan parámetros abren un editor en la barra lateral con validación y vista previa: portscan, beaconspam, karma, clearlist, join, setmac, selección de objetivos, findmy, blespam, spoofairtag y brightness. No envían plantillas incompletas. Para acciones basadas en índices, consulta primero la lista del dispositivo. Los índices se validan como enteros no negativos; su existencia y los requisitos de la operación los determina el firmware.

**Detener** permanece fijo en el borde inferior incluso al desplazar el menú o la página. Envía `stopscan` y cancela primero la recogida local del listado SD, si está activa. Solo se habilita con conexión. Es una solicitud al firmware: no garantiza interrumpir operaciones bloqueantes ni reemplaza el reinicio o apagado físico. Los comandos GPS/Bluetooth dependen del hardware y de las opciones de compilación; detén una operación antes de iniciar otra.

| Categoría | Subcategoría | Etiqueta | CLI enviada / plantilla | Nota |
| --- | --- | --- | --- | --- |
| WiFi | Sniffers | `sniffbeacon` | `sniffbeacon` | — |
| WiFi | Sniffers | `sniffprobe` | `sniffprobe` | — |
| WiFi | Sniffers | `sniffdeauth` | `sniffdeauth` | — |
| WiFi | Sniffers | `sniffpmkid` | `sniffpmkid` | Modo predeterminado del firmware; opciones adicionales por CLI. |
| WiFi | Sniffers | `sniffraw` | `sniffraw` | — |
| WiFi | Sniffers | `pwnagotchi` | `sniffpwn` | — |
| WiFi | Scanners | `scanall` | `scanall` | — |
| WiFi | Scanners | `scanap` | `sniffbeacon` | Equivalente de observación de AP por beacons; scanap no existe en esta versión. |
| WiFi | Scanners | `scansta` | No disponible | Sin escaneo CLI exclusivo de estaciones. Usa scanall y después list -c. |
| WiFi | Scanners | `pingscan` | `pingscan` | — |
| WiFi | Scanners | `arpscan` | `arpscan` | — |
| WiFi | Scanners | `portscan` | `portscan -a -t <índice>` | Índice de IP obtenido con list -i; requiere conexión a la red. |
| WiFi | Scanners | `sshescan` | `portscan -s ssh` | — |
| WiFi | Scanners | `dnsscan` | `portscan -s dns` | — |
| WiFi | Scanners | `httpsscan` | `portscan -s https` | — |
| WiFi | Scanners | `Listar APs` | `list -a` | — |
| WiFi | Scanners | `Listar estaciones` | `list -c` | — |
| WiFi | Scanners | `Listar IPs` | `list -i` | — |
| WiFi | Attacks | `deauth` | `attack -t deauth` | Requiere objetivos seleccionados con select. |
| WiFi | Attacks | `beaconspam` | `attack -t beacon <modo>` | — |
| WiFi | Attacks | `rickroll` | `attack -t rickroll` | — |
| WiFi | Attacks | `probespam` | `attack -t probe` | — |
| WiFi | Attacks | `karma` | `karma -p <índice>` | Índice de SSID de probe; consulta list -p. |
| WiFi | Attacks | `badmsg` | `attack -t badmsg` | — |
| WiFi | Attacks | `saecommit` | `attack -t sae` | — |
| WiFi | General | `clearlist` | `clearlist <lista>` | — |
| WiFi | General | `join` | `join -a <índice> -p <contraseña>` | El firmware imprime la contraseña en su respuesta: estará en el log de sesión. |
| WiFi | General | `Conectar red guardada` | `join -s` | — |
| WiFi | General | `setmac` | `randapmac / randstamac / clone…` | No existe setmac literal ni asignación CLI de MAC arbitraria en esta versión. |
| WiFi | General | `shutdown` | No disponible | La función física de apagar WiFi no está expuesta por la CLI. |
| WiFi | General | `startap` | No disponible | No existe este comando CLI. No se sustituye por un portal de otra función. |
| WiFi | General | `stopap` | No disponible | No existe este comando CLI. stopscan detiene modos de escaneo compatibles. |
| WiFi | General | `Seleccionar objetivos` | `select <lista> <índice>` | El firmware alterna la selección del índice. Comprueba el resultado con list. |
| WiFi | General | `Listar SSID de probes` | `list -p` | — |
| WiFi | General | `Canal actual` | `channel` | — |
| Bluetooth | Sniffers | `sniffbt` | `sniffbt` | — |
| Bluetooth | Sniffers | `sniffraw` | No disponible | sniffraw pertenece a WiFi; no hay equivalente Bluetooth raw en esta CLI. |
| Bluetooth | Sniffers | `findmy` | `findmy -t <índice>` | Hace sonar el AirTag seleccionado (list -t); depende de HAS_NIMBLE_2 y del dispositivo, no es un escaneo. |
| Bluetooth | Sniffers | `flock` | `sniffbt -t flock` | — |
| Bluetooth | Sniffers | `metadetect` | `sniffbt -t meta` | — |
| Bluetooth | Sniffers | `skimmer` | `sniffskim` | — |
| Bluetooth | Sniffers | `Detectar AirTags` | `sniffbt -t airtag` | — |
| Bluetooth | Sniffers | `Listar AirTags` | `list -t` | — |
| Bluetooth | Sniffers | `Listar Bluetooth` | `list -b` | — |
| Bluetooth | Attacks | `blespam` | `blespam -t <tipo>` | — |
| Bluetooth | Attacks | `spoofairtag` | `spoofat -t <índice>` | Índice de AirTag de list -t. |
| Bluetooth | Attacks | `sourapple` | `blespam -t sourapple` | — |
| Bluetooth | Attacks | `applejuice` | `blespam -t applejuice` | — |
| Bluetooth | Attacks | `swiftpair` | `blespam -t windows` | — |
| Bluetooth | Attacks | `samsungspam` | `blespam -t samsung` | — |
| Bluetooth | Attacks | `googlespam` | `blespam -t google` | — |
| Bluetooth | Attacks | `flipperspam` | `blespam -t flipper` | — |
| GPS | — | `gpsdata` | `gpsdata` | — |
| GPS | — | `gps sat` | `gps -g sat` | — |
| GPS | — | `tracker start` | `gpstracker -c start` | — |
| GPS | — | `tracker stop` | `gpstracker -c stop` | — |
| GPS | — | `wardrive` | `wardrive` | — |
| GPS | — | `NMEA` | `nmea` | — |
| Sistema / SD | — | `info` | `info` | — |
| Sistema / SD | — | `reboot` | `reboot` | — |
| Sistema / SD | — | `ls /` | `ls /` | — |
| Sistema / SD | — | `backup` | `backupspiffs` | Copia SPIFFS a /spiffs en la SD; no es una imagen completa del firmware. |
| Sistema / SD | — | `restore` | `restorespiffs` | Restaura SPIFFS desde /spiffs en SD y puede sobrescribir su contenido. |
| Sistema / SD | — | `brightness` | `brightness -s <0–9>` | — |
| Sistema / SD | — | `Consultar brillo` | `brightness` | — |
| Sistema / SD | — | `Estado de backup` | `backupstatus` | — |
| Sistema / SD | — | `Ayuda` | `help` | — |

`backup` y `restore` operan sobre **SPIFFS**, no sobre una imagen completa del equipo. La restauración puede sobrescribir datos. `findmy` hace sonar un AirTag seleccionado cuando la compilación lo admite; no es un sniffer. `setmac` ofrece aleatorización o clonación desde listas, no una MAC arbitraria.

**Credenciales de join:** el firmware imprime la contraseña en su respuesta Serial, que queda en la terminal y en el log exportable. El editor oculta el campo y la vista previa, pero no filtra la respuesta del dispositivo. Revisa los logs antes de compartirlos.

El perfil solicitado indica ESP-IDF `v5.5.1-710-g8410210c9a`, WSL Bypass habilitado, SD conectada de 3839 MB y monitor de batería no soportado. Son datos proporcionados para la unidad, **no mediciones realizadas por esta aplicación**. Las MAC del propietario no se incluyen en el repositorio. Ejecuta `info` y `help` para verificar tu compilación real. El nombre de versión por sí solo no identifica cambios de un fork.

## Uso local

1. Descarga o clona el repositorio y entra en su carpeta.
2. Sirve los archivos desde localhost, por ejemplo con Python:

   ```sh
   python -m http.server 8080 --bind 127.0.0.1
   ```

3. Abre `http://localhost:8080` en Chrome o Edge de escritorio con Web Serial disponible.
4. Conecta el Marauder con un cable USB de datos. Cierra monitores serie de Arduino, flasheadores y otras aplicaciones que ocupen el puerto.
5. Pulsa **Conectar dispositivo** y selecciona el puerto correcto en el selector del navegador.
6. Ejecuta **info** y **help**. La interfaz no envía comandos automáticamente al conectar.
7. Selecciona una operación. Para detenerla, usa **Detener · stopscan**. Envía comandos manuales con Enter o Enviar.
8. Exporta el log antes de cerrar la página y pulsa **Desconectar** para liberar el puerto.

Configuración: 115200, 8 bits, sin paridad, 1 bit de parada, sin control de flujo. LF es el valor inicial porque el firmware lee hasta `\n`. CRLF también está disponible.

Web Serial requiere contexto seguro (HTTPS o localhost) y soporte del navegador/sistema. El diseño funciona en tablets, pero **eso no garantiza acceso USB Serial** en Android, iPadOS o todos los navegadores. La interfaz comprueba la disponibilidad y muestra una explicación si falta. Referencia: [documentación de Web Serial de Chrome](https://developer.chrome.com/docs/capabilities/serial).

## SD, PCAP y logs: alcance real

El comando `ls <directorio>` de v1.16.0 devuelve líneas `nombre<TAB>tamaño`. [SDInterface.cpp](https://github.com/justcallmekoko/ESP32Marauder/blob/fe2160f0aa53ad8e6c5860f8dddd6e7bbaa3ba0b/esp32_marauder/SDInterface.cpp) no añade un marcador de finalización o un tipo de entrada al listado. La GUI no infiere carpetas a partir de tamaño cero.

**El firmware oficial no proporciona un comando CLI para descargar archivos arbitrarios de la SD por Serial.** `ls /` no transmite el contenido de los PCAP. No se implementa una descarga USB ficticia ni se guardan bytes de terminal como si fueran un PCAP.

### Consultar por USB

1. Detén cualquier escaneo con `stopscan` y espera a que deje de emitir datos.
2. Introduce `/` o una ruta absoluta sin espacios/comillas y pulsa **Listar directorio**.
3. Se recogen respuestas fragmentadas del puerto y se reconocen líneas con nombre y tamaño.
4. Pulsa **Finalizar lectura** cuando termine. A los 30 segundos se cierra la ventana de recepción con un aviso de posible resultado incompleto.
5. Usa **Guardar listado** para exportar el texto recibido. La consulta bloquea temporalmente otros botones de envío para reducir respuestas mezcladas; Detener permanece habilitado y cierra la consulta antes de enviar stopscan.

Una SD vacía, ausente o una ruta inválida pueden no producir salida. La aplicación no puede distinguirlas de forma fiable solo con `ls`. El listado no indica éxito ni integridad. Se muestran hasta 2000 entradas y se retienen hasta 2 MiB de texto.

### Copiar los archivos reales

1. Detén la captura y espera a que el firmware termine de escribir. Apaga el equipo antes de retirar la SD.
2. Conecta la SD a la PC con un lector.
3. En **Copiar desde lector SD**, selecciona los archivos PCAP, PCAPNG, LOG, TXT o CSV.
4. Pulsa **Guardar copia** junto a cada archivo y elige el destino mediante el navegador. Los bytes del archivo se conservan sin decodificación de texto. También puedes copiarlos directamente desde el explorador del sistema.

Para descarga íntegra por el mismo cable USB haría falta extender el firmware con un protocolo de transferencia que defina tamaño, encuadre, comprobación de integridad, errores y cancelación; ese cambio no forma parte de esta GUI compatible con el firmware oficial.

**Exportar log** descarga el texto de sesión recibido y los comandos enviados, no archivos de la SD. La memoria retiene los últimos 2 MiB de caracteres aproximadamente; la vista conserva los últimos 250 000 caracteres. **Limpiar** limpia solo la vista. Recargar/cerrar borra los datos de sesión; no hay almacenamiento persistente.

## GitHub Pages

`index.html` está listo para alojarse en GitHub Pages desde la raíz:

1. Sube el contenido de esta carpeta al repositorio `marauder-v6-web-gui`.
2. Ve a **Settings → Pages → Build and deployment → Deploy from a branch**.
3. Selecciona **main** y **/(root)**, guarda y espera al despliegue.
4. Abre la dirección HTTPS que muestra GitHub. El puerto se selecciona en la computadora de quien abre la página, no en GitHub.

Para crear el repositorio desde la terminal, si aún no existe:

```sh
git init -b main
git add .
git commit -m "Add Marauder v1.16.0 Web Serial GUI"
gh auth login
gh repo create marauder-v6-web-gui --public --source=. --remote=origin --push
```

No subas capturas de tráfico reales, contraseñas, registros de sesión ni información personal. `.gitignore` excluye PCAP y logs comunes, pero debes revisar lo que publicas.

## Seguridad y uso autorizado

Utiliza el equipo y esta interfaz únicamente en redes/dispositivos propios o con autorización explícita de sus responsables. Define el alcance antes de una evaluación. La captura de tráfico puede contener datos personales o confidenciales; respeta la normativa aplicable y protege los archivos exportados. El usuario es responsable de los comandos introducidos en la terminal.

La interfaz renderiza los datos serie y nombres de archivo con `textContent`, no como HTML. No ejecuta scripts recibidos por USB. No carga recursos remotos ni envía datos de sesión por red; su CSP bloquea conexiones de red del documento. El navegador solicita acceso al puerto y a los archivos locales. No se publican automáticamente los datos de la unidad.

La CLI libre permite operaciones del firmware más allá de los botones. **Desconectar el puerto o cerrar la página no detiene una operación autónoma del Marauder**: usa `stopscan` antes. El programa no controla el firmware ni puede garantizar su comportamiento.

## Captura en tablet

![Interfaz adaptable a tablet, desconectada](docs/tablet.png)

Ambas capturas son renders reales de la interfaz sin dispositivo conectado; no representan una sesión física ni resultados de escaneo.

## Pruebas y limitaciones

```sh
npm install --no-save playwright
npx playwright install chromium
node tests/browser.cjs
```

La prueba levanta un servidor temporal en localhost y simula `navigator.serial`: apertura a 115200, comandos y LF/CRLF, UTF-8 fragmentado, texto no confiable, listado SD fragmentado, rechazo de caracteres de control, copia binaria, desconexión/reconexión y adaptación móvil/tablet. También verifica navegación por teclado del acordeón, equivalencias CLI, opciones no disponibles, validación de parámetros y visibilidad de Detener durante la consulta SD y al desplazar una pantalla móvil. Regenera las capturas de `docs/`.

Para usar Edge instalado, establece `BROWSER_CHANNEL=msedge` en el entorno. `PLAYWRIGHT_MODULE` permite indicar una instalación externa de Playwright.

**No se realizaron pruebas contra un Marauder físico.** La terminal es de texto; no emula secuencias ANSI ni una terminal de pantalla completa. La compatibilidad exacta con la compilación del usuario debe comprobarse con el equipo conectado.

## Archivos

- `index.html`: aplicación completa y autónoma.
- `README.md`: uso, compatibilidad y límites.
- `docs/desktop.png`, `docs/tablet.png`: capturas reales de la GUI.
- `tests/browser.cjs`: pruebas de integración con puerto simulado.
- `.nojekyll`: alojamiento estático sin procesamiento Jekyll.

Proyecto independiente, sin afiliación al autor de ESP32 Marauder. Referencia de versión: [release oficial v1.16.0](https://github.com/justcallmekoko/ESP32Marauder/releases/tag/v1.16.0).
