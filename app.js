import express from "express";
import axios from "axios";

const app = express();
app.use(express.json());

// ======== CONFIG (rellena .env) ========
const VERIFY_TOKEN = process.env.VERIFY_TOKEN; // .env
const WHATSAPP_TOKEN = process.env.WHATSAPP_TOKEN; // .env
const PHONE_NUMBER_ID = process.env.WHATSAPP_PHONE_NUMBER_ID; // .env
const PORT = process.env.PORT || 3000;

const UPSTASH_URL = process.env.UPSTASH_REDIS_REST_URL;
const UPSTASH_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN;
function hasRedis() { return !!(UPSTASH_URL && UPSTASH_TOKEN); }
function ordersRedisKey(date = new Date()) { return `orders:${ymdEuropeMadrid(date)}`; }


// Meta Graph API (usa la versión estable actual)
const GRAPH_URL = `https://graph.facebook.com/v20.0/${PHONE_NUMBER_ID}/messages`;

// ======== DATOS DEL NEGOCIO (personaliza aquí) ========
const HORARIO = {
  lunes: "Cerrado",
  martes: "8:00–14:00",
  miércoles: "8:00–14:00",
  jueves: "8:00–14:00",
  viernes: "8:00–14:00, 17:00–20:00",
  sábado: "8:00–14:00",
  domingo: "11:00–14:30"
};

const CATEGORIES_TEXT = [
  { key: "embutidos", title: "Embutidos" },
  { key: "elaborados", title: "Elaborados" },
  { key: "ave_conejo", title: "Ave / Conejo" },
  { key: "ternasco", title: "Ternasco" },
  { key: "ternera", title: "Ternera" },
  { key: "cerdo", title: "Cerdo" },
  { key: "congelados", title: "Congelados caseros" },
  { key: "asados_paellas", title: "Asados/Paella/Preparados" },
  { key: "conservas", title: "Conservas" },
];

const PRODUCTS_TEXT = {
  embutidos: [
    "Lomo embuchado",
    "Chorizo Pamplona",
    "Chorizo Ibérico",
    "Chorizo Lomo",
    "Salchichón picado",
    "Salchichón ibérico",
    "Mortadela",
    "Jamón York",
    "Fiambre de pavo",
    "Cecina",
    "Jamón reserva",
    "Jamón ibérico",
    "Jamón de la Fueva",
    "Longaniza artesana fresca",
    "Chorizo artesano fresco",
    "Chorizo artesano picante",
    "Morcilla",
    "Queso fresco",
    "Queso curado Sansueña",
    "Queso curado Cañarejal",
    "Queso semicurado G. Baquero",
    "Queso tierno tranchetes",
    "Butifarra",
    "Fuet",
    "Bolos",
    "Lomo Tarazona",
    "Panceta curada",
    "Punta jamón (caldo)",
    "Hueso jamón (caldo)",
  ],
  elaborados: [
    "Salchichas de pollo",
    "Salchichas mixtas",
    "Picada solo ternera",
    "Picada mixta",
    "Hamburguesas de pollo",
    "Hamburguesas mixtas",
    "Libritos de lomo",
    "Pechuga rellena jamón-queso",
    "Pechuga rellena paté-queso",
    "Cachopos",
    "San Jacobo",
    "Pincho moruno",
    "Muslo relleno",
    "Churrasquitos de ternasco",
    "Churrasco",
    "Juanicos",
  ],
  ave_conejo: [
    "Pollo entero",
    "Muslo de pollo",
    "Pechuga de pollo",
    "Alas de pollo",
    "Esqueleto de pollo",
    "Pollo de corral *",
    "Pollo certificado *",
    "Gallina",
    "Codorniz *",
    "Conejo entero",
    "Pechuga de pavo *",
    "Pavo de estofar",
    "Pavo al ajillo",
    "Pavo entero *",
    "Pavita *",
    "Pularda *",
    "Pato *",
    "Higaditos *",
  ],
  ternasco: [
    "Pierna",
    "Costilla",
    "Pierna y costilla",
    "Paletillas",
    "Jarretes",
    "Alcorzadizo",
    "Cuello",
    "Lechecillas",
    "Rabo",
    "Cabezas *",
    "Hígado *",
    "Asaduras *",
    "Riñones",
    "Tripa y patas *",
    "Sebo",
    "Churrasquitos de ternasco",
    "Medios y cuartos",
    "Lechal *",
    "Cabrito *",
  ],
  ternera: [
    "Entrecot",
    "Chuletón",
    "Solomillo entero",
    "Solomillo filetes",
    "Ternera plancha",
    "Ternera guisar a tacos",
    "Ternera guisar a filetes",
    "Costilla",
    "Rabo *",
    "Ternera de empanar",
    "Hueso blanco",
    "Carrilleras *",
    "Lengua *",
    "Manos de ternera *",
  ],
  cerdo: [
    "Lomo cinta Teruel",
    "Lomo hueso Teruel",
    "Panceta Teruel",
    "Cabezada Teruel",
    "Secreto Teruel",
    "Solomillo",
    "Costilla",
    "Papada",
    "Magro",
    "Esquinazo",
    "Lomo cinta Ibérico",
    "Lomo hueso Ibérico",
    "Solomillo Ibérico",
    "Tocino salado Ibérico",
    "Lomo cinta Castañas",
    "Lomo hueso Castañas",
    "Cabezada Castañas",
    "Solomillo Castañas",
    "Carrilleras sin hueso *",
    "Carrilleras con hueso *",
    "Manitas de cerdo *",
    "Rabo *",
    "Careta *",
    "Oreja *",
    "Tocino fresco",
    "Cochinillo *",
    "Panceta adobada",
    "Secreto adobado",
    "Costilla adobada",
  ],
  congelados: [
    "Albóndigas con tomate",
    "Caldo",
    "Estofado de ternera",
    "Canelones de carne (4u)",
    "Canelones de marisco (4u)",
    "Lasaña boloñesa (2p)",
    "Croquetas de jamón",
    "Croquetas de cocido",
    "Empanadillas (varios sabores)",
    "Manitas de cerdo con tomate",
    "Roti de ternasco guisado",
    "Roti de pollo guisado",
    "Vieira rellena de marisco",
    "Nuggets de pollo",
  ],
  asados_paellas: [
    "Pollo asado con patatas",
    "Paletilla ternasco asada (patatas)",
    "Conejo asado",
    "Costilla de cerdo asada",
    "Paella de marisco (5/10p)",
    "Paella de carne (5/10p)",
    "Migas",
    "Albóndigas",
    "Ensaladilla rusa",
  ],
  conservas: [
    "Conejo escabechado",
    "Perdiz caza escabechada",
    "Perdiz escabechada",
    "Codorniz escabechada",
    "Conejo deshuesado",
    "Piñón nacional",
    "Atún en aceite",
    "Atún escabeche",
    "Atún aceite (pequeño)",
    "Atún escabeche (pequeño)",
    "Huevos",
    "Huevos de corral",
    "Espárragos de Navarra",
    "Pimiento del piquillo",
    "Tomate frito casero",
    "Alubias Rosara",
    "Garbanzos naturales Rosara",
    "Lenteja Rosara",
  ],
};

const LIST_HEADER = { type: "text", text: "Carta 3IEL 🍽️" };
const LIST_FOOTER = { text: "Productos con * son por encargo antes de las 19h." };
// Tiempo de "silencio" tras el mensaje de agradecimiento (en milisegundos)
const MUTE_AFTER_THANKS_MS = 2 * 60 * 1000; // 2 min (ajústalo a tu gusto)



// ======== ESTADO EN MEMORIA (cámbialo por Redis/DB en prod) ========
/** Map<string, { awaitingOrder: boolean }> por número de cliente */
const userState = new Map();

function getState(id) {
  return userState.get(id) || { awaitingOrder: false, muteUntil: 0 };
}
function setState(id, partial) {
  userState.set(id, { ...getState(id), ...partial });
}
function isMuted(id) {
  const { muteUntil } = getState(id);
  return muteUntil && Date.now() < muteUntil;
}
function clearMute(id) {
  const st = getState(id);
  if (st.muteUntil) setState(id, { muteUntil: 0 });
}



// ===== PEDIDOS DEL DÍA (memoria) =====
const contactNames = new Map(); // wa_id -> nombre (si lo envía WhatsApp)
const ordersByDate = new Map(); // "YYYY-MM-DD" -> [{ from, name, text, ts }]

function ymdEuropeMadrid(date = new Date()) {
  const tz = "Europe/Madrid";
  const d = new Date(date.toLocaleString("en-US", { timeZone: tz }));
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${dd}`;
}

function hmEuropeMadrid(date = new Date()) {
  const tz = "Europe/Madrid";
  const d = new Date(date.toLocaleString("en-US", { timeZone: tz }));
  return d.toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit", hour12: false, timeZone: tz });
}

async function saveOrder({ from, name, text, ts = new Date() }) {
  const entry = { from, name, text, ts: new Date(ts).toISOString() };
  if (hasRedis()) {
    try {
      // Guarda en lista por día y caduca en 8 días
      await axios.post(
        UPSTASH_URL,
        { commands: [
          ["RPUSH", ordersRedisKey(ts), JSON.stringify(entry)],
          ["EXPIRE", ordersRedisKey(ts), (60 * 60 * 24 * 8).toString()]
        ]},
        { headers: { Authorization: `Bearer ${UPSTASH_TOKEN}` } }
      );
      console.log("saveOrder → Redis OK:", ordersRedisKey(ts));
      return;
    } catch (e) {
      console.error("saveOrder → Redis ERROR:", e?.response?.data || e.message);
      // sigue con fallback:
    } 
  }
  // Fallback en memoria
  const key = ymdEuropeMadrid(ts);
  const list = ordersByDate.get(key) || [];
  list.push({ from, name, text, ts: new Date(ts) });
  ordersByDate.set(key, list);
  console.log("saveOrder → MEMORY:", key, "(Redis no disponible)");
}


async function getOrdersSummary(date = new Date()) {
  const ymd = ymdEuropeMadrid(date);
  let list = [];
  if (hasRedis()) {
    try {
      const { data } = await axios.post(
        UPSTASH_URL,
        { commands: [["LRANGE", ordersRedisKey(date), "0", "-1"]] },
        { headers: { Authorization: `Bearer ${UPSTASH_TOKEN}` } }
      );
      const arr = (data?.[0]?.result) || [];
      list = arr.map(s => { try { return JSON.parse(s); } catch { return null; } })
                .filter(Boolean)
                .map(o => ({ ...o, ts: new Date(o.ts) }));
      console.log("getOrdersSummary → Redis len:", list.length, "key:", ordersRedisKey(date));
    } catch (e) {
      console.error("getOrdersSummary → Redis ERROR:", e?.response?.data || e.message);
    }
  } else {
    list = (ordersByDate.get(ymd) || []).map(o => ({ ...o }));
  }

  if (!list.length) return `No hay pedidos en ${ymd}.`;

  // Agrupar por cliente y formatear (igual que tenías)
  const byClient = new Map();
  for (const o of list) {
    const k = o.from;
    const arr = byClient.get(k) || [];
    arr.push(o);
    byClient.set(k, arr);
  }

  const lines = [];
  lines.push(`*Resumen de pedidos ${ymd}*`);
  lines.push(`Total: ${list.length}`);
  lines.push("");
  for (const [k, arr] of byClient.entries()) {
    const nombre = arr[0].name || k;
    lines.push(`• *${nombre}* (${k})`);
    for (const o of arr) {
      const hora = hmEuropeMadrid(o.ts);
      const primLinea = (o.text || "").split("\n")[0];
      lines.push(`   - ${hora} — ${primLinea}`);
    }
  }
  return lines.join("\n");
}



// ======== UTILIDADES ========
function normalizeKeyword(text) {
  if (!text) return "";
  const t = text.toLowerCase().trim();
  if (["1", "horario", "horari", "schedule"].includes(t)) return "horario";
  if (["2", "carta", "menu", "menú", "lista"].includes(t)) return "carta";
  if (["3", "pedido", "encargo", "orden", "order"].includes(t)) return "pedido";
  return "";
}

function getTomorrowScheduleEuropeMadrid() {
  // Calcula el nombre de mañana en español en zona Europe/Madrid
  const now = new Date();
  const madridNow = new Date(now.toLocaleString("en-US", { timeZone: "Europe/Madrid" }));
  const tomorrow = new Date(madridNow.getTime() + 24 * 60 * 60 * 1000);
  const weekday = tomorrow.toLocaleDateString("es-ES", { weekday: "long", timeZone: "Europe/Madrid" }).toLowerCase();
  // Asegura claves con acentos
  const key = weekday.normalize("NFD").replace(/[\u0300-\u036f]/g, (m) => m); // mantenemos acentos
  // El objeto HORARIO usa claves con acentos: lunes, martes, miércoles, jueves, viernes, sábado, domingo
  return { day: weekday, slot: HORARIO[weekday] ?? "Cerrado" };
}

function getNextOpenScheduleEuropeMadrid(startOffsetDays = 1) {
  // Devuelve el siguiente día ABIERTO a partir de hoy + startOffsetDays
  // { day, slot, daysAhead }  → day en minúsculas ("martes"), slot = "8:00–14:00", daysAhead = 1/2/...
  const tz = "Europe/Madrid";
  const now = new Date();
  const madridNow = new Date(now.toLocaleString("en-US", { timeZone: tz }));

  for (let d = startOffsetDays; d < startOffsetDays + 7; d++) {
    const target = new Date(madridNow.getTime() + d * 24 * 60 * 60 * 1000);
    const weekday = target
      .toLocaleDateString("es-ES", { weekday: "long", timeZone: tz })
      .toLowerCase();

    const slot = HORARIO[weekday] ?? "Cerrado";
    if ((slot || "").toLowerCase() !== "cerrado") {
      return { day: weekday, slot, daysAhead: d };
    }
  }

  // Fallback: por si todo estuviera "Cerrado"
  const target = new Date(madridNow.getTime() + startOffsetDays * 24 * 60 * 60 * 1000);
  const weekday = target
    .toLocaleDateString("es-ES", { weekday: "long", timeZone: tz })
    .toLowerCase();
  const slot = HORARIO[weekday] ?? "Cerrado";
  return { day: weekday, slot, daysAhead: startOffsetDays };
}

function capFirst(s = "") {
  return s ? s.charAt(0).toUpperCase() + s.slice(1) : s;
}


async function sendText(to, text) {
  return axios.post(
    GRAPH_URL,
    {
      messaging_product: "whatsapp",
      to,
      type: "text",
      text: { body: text }
    },
    { headers: { Authorization: `Bearer ${WHATSAPP_TOKEN}` } }
  );
}

async function sendButtonsMenu(to, bodyText = "Hola 👋 Soy el asistente de la Carnicería Biel.\nSíguenos en Instagram: https://www.instagram.com/carniceria3iel/\n\nElija una opción:") {
  // Botones interactivos (máx. 3)
  return axios.post(
    GRAPH_URL,
    {
      messaging_product: "whatsapp",
      to,
      type: "interactive",
      interactive: {
        type: "button",
        body: { text: bodyText },
        action: {
          buttons: [
            { type: "reply", reply: { id: "opt_horario", title: "Consultar horario ⏰" } },
            { type: "reply", reply: { id: "opt_carta", title: "Ver la carta 🍽️" } },
            { type: "reply", reply: { id: "opt_pedido", title: "Hacer un pedido 🛒" } }
          ]
        }
      }
    },
    { headers: { Authorization: `Bearer ${WHATSAPP_TOKEN}` } }
  );
}

function buildCategoryBlock(title, items) {
  const listado = items.map(i => `• ${i}`).join("\n");
  return `*${title}*\n${listado}`;
}

// por si alguna categoría fuese larguísima, troceamos en partes de ~3500 chars
async function sendLongTextInChunks(to, fullText, chunkSize = 3500) {
  for (let i = 0; i < fullText.length; i += chunkSize) {
    const part = fullText.slice(i, i + chunkSize);
    await sendText(to, part);
  }
}

// Envía la lista de CATEGORÍAS (selección única)
async function sendListCategories(to) {
  const sections = [{
    title: "Elige una categoría",
    rows: CATEGORIES_TEXT.map(c => ({
      id: `cat:${c.key}`,
      title: c.title.slice(0, 24) // títulos de fila ≤ 24 chars
    }))
  }];

  return axios.post(
    GRAPH_URL,
    {
      messaging_product: "whatsapp",
      to,
      type: "interactive",
      interactive: {
        type: "list",
        header: LIST_HEADER,
        body: { text: "Selecciona una categoría para ver la lista completa de productos." },
        footer: LIST_FOOTER,
        action: { button: "Ver categorías", sections }
      }
    },
    { headers: { Authorization: `Bearer ${WHATSAPP_TOKEN}` } }
  );
}

// Tras elegir la categoría, imprime TODO el texto de esa categoría (sin selección de productos)
async function sendCategorySectionText(to, categoryKey) {
  const cat = CATEGORIES_TEXT.find(c => c.key === categoryKey);
  const items = PRODUCTS_TEXT[categoryKey] || [];
  if (!cat || items.length === 0) {
    await sendText(to, "No hay productos en esta categoría.");
    // Ofrece volver a elegir categoría o al menú principal
    await sendListCategories(to);
    return;
  }
  const block = buildCategoryBlock(cat.title, items);
  await sendLongTextInChunks(to, block);
  // Luego tu menú de siempre (Horario / Carta / Pedido)
  await sendButtonsMenu(to, "¿Desea hacer algo más?\nElija una opción:");
}



async function handleOption(to, option) {
  switch (option) {
    case "horario": {
      const lines = [
        "*Horario* ⏰",
        `Lunes: ${HORARIO.lunes}`,
        `Martes: ${HORARIO.martes}`,
        `Miércoles: ${HORARIO.miércoles}`,
        `Jueves: ${HORARIO.jueves}`,
        `Viernes: ${HORARIO.viernes}`,
        `Sábado: ${HORARIO.sábado}`,
        `Domingo: ${HORARIO.domingo}`
      ].join("\n");
      await sendText(to, lines);
      await sendButtonsMenu(to, "¿Desea hacer algo más?\nElija una opción:");
      return;
    }
    case "carta": {
      await sendListCategories(to);
      return;
    }
    case "pedido": {
      userState.set(to, { awaitingOrder: true });
      await sendText(
        to,
        "Para hacer su pedido, por favor indique con detalle cómo quiere que le preparemos cada producto:\n• Cantidad (g/kg/filetes/unidades)\n• Corte y grosor (filetes/dados/trozos/deshuesado...)\n• Cómo lo va a cocinar (guisar/horno/plancha/brasa...)"
      );
      return;
    }
    default:
      await sendButtonsMenu(to);
      return;
  }
}

async function thankAndScheduleTomorrow(to) {
  const { day, slot, daysAhead } = getNextOpenScheduleEuropeMadrid(1);
  const cuando = daysAhead === 1 ? "mañana" : `el ${day}`;
  await sendText(
    to,
    `¡Muchas gracias! Su pedido estará listo *${cuando}* con horario de ${capFirst(day)}: ${slot}`
  );
  setState(to, { awaitingOrder: false, muteUntil: Date.now() + MUTE_AFTER_THANKS_MS });
}


// ======== ENDPOINTS ========

// Verificación del webhook (Meta hace GET con hub.*)
app.get("/webhook", (req, res) => {
  const mode = req.query["hub.mode"];
  const token = req.query["hub.verify_token"];
  const challenge = req.query["hub.challenge"];

  if (mode === "subscribe" && token === VERIFY_TOKEN) {
    return res.status(200).send(challenge);
  }
  return res.sendStatus(403);
});

// Recepción de notificaciones
app.post("/webhook", async (req, res) => {
  try {
    console.log("WEBHOOK BODY:", JSON.stringify(req.body, null, 2));
    const value = req.body?.entry?.[0]?.changes?.[0]?.value;
    
    // Guarda nombre del contacto si viene
    try {
      const contact = value?.contacts?.[0];
      if (contact?.wa_id && contact?.profile?.name) {
        contactNames.set(contact.wa_id, contact.profile.name);
      }
    } catch {}

    if (value?.statuses?.[0]) {
      console.log("STATUS UPDATE:", JSON.stringify(value.statuses[0], null, 2));
    }
    const body = req.body;

    // Estructura: entry[0].changes[0].value.messages[0]
    if (body?.entry?.[0]?.changes?.[0]?.value?.messages?.[0]) {
      const msg = body.entry[0].changes[0].value.messages[0];
      const from = msg.from; // número del cliente (string)
      const type = msg.type;

      // Si estamos esperando pedido, el siguiente texto es el pedido
      const state = userState.get(from);
      if (state?.awaitingOrder && type === "text") {
        const orderText = msg.text.body;
        // Guarda el pedido
        await saveOrder({
          from,
          name: contactNames.get(from),
          text: orderText,
          ts: new Date()
        });

        userState.set(from, { awaitingOrder: false });
        await thankAndScheduleTomorrow(from);
        return res.sendStatus(200);
      }

      if (type === "interactive") {
        const br = msg.interactive?.button_reply;
        const lr = msg.interactive?.list_reply;
      
        // Botones (tu lógica actual)
        if (br?.id) {
          clearMute(from); // <-- permitir interacción durante el silencio
          const id = br.id;
          if (id === "opt_horario") await handleOption(from, "horario");
          else if (id === "opt_carta") await handleOption(from, "carta");
          else if (id === "opt_pedido") await handleOption(from, "pedido");
          else await sendButtonsMenu(from);
          return res.sendStatus(200);
        }
      
        // Listas (solo categorías)
        if (lr?.id) {
          clearMute(from); // <-- permitir interacción durante el silencio
          const id = lr.id; // p.ej. "cat:embutidos"
          if (id.startsWith("cat:")) {
            const key = id.split(":")[1];
            await sendCategorySectionText(from, key);  // imprime la categoría completa
            return res.sendStatus(200);
          }
          // Si llega algo raro, vuelve al menú:
          await sendButtonsMenu(from);
          return res.sendStatus(200);
        }
      
        // Si no es ni botón ni lista: vuelve al menú
        await sendButtonsMenu(from);
        return res.sendStatus(200);
      }      

      // Si escribió texto libre, también admitimos palabras clave o 1/2/3
      if (type === "text") {
        const bodyTextRaw = msg.text?.body || "";
        const bodyText = bodyTextRaw.toLowerCase().trim();

        // 1) Comando de resumen (siempre se atiende, sin importar mute)
        if (bodyText === "resumen pedidos hoy") {
          const summary = await getOrdersSummary(new Date());
          await sendText(from, summary);
          return res.sendStatus(200);
        }

        // 2) Resto de lógica
        const kw = normalizeKeyword(msg.text?.body);

        // Si estamos en "silencio" y NO ha pedido nada concreto, ignoramos
        if (isMuted(from) && !kw) {
          console.log(`Muted reply from ${from}: "${bodyText}"`);
          return res.sendStatus(200);
        }
        if (kw) {
          clearMute(from);
          await handleOption(from, kw);
        } else {
          // Primer contacto o texto libre: mostramos menú
          await sendButtonsMenu(from);
        }
        return res.sendStatus(200);
      }

      // Otros tipos (imágenes, etc.): responde con menú
      await sendButtonsMenu(from);
      return res.sendStatus(200);
    }

    // No había mensajes (pueden ser status updates); responde 200
    return res.sendStatus(200);
  } catch (e) {
    console.error("Webhook error:", e?.response?.data || e);
    return res.sendStatus(200); // evitar reintentos agresivos
  }
});

app.listen(PORT, () => {
  console.log(`WhatsApp bot listening on port ${PORT}`);
});
console.log("Redis configured?", !!process.env.UPSTASH_REDIS_REST_URL && !!process.env.UPSTASH_REDIS_REST_TOKEN);
console.log("UPSTASH_REDIS_REST_URL(prefix):", (process.env.UPSTASH_REDIS_REST_URL || "").slice(0, 40), "...");

