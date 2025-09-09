import express from "express";
import axios from "axios";

const app = express();
app.use(express.json());

// ======== CONFIG (rellena .env) ========
const VERIFY_TOKEN = process.env.VERIFY_TOKEN; // .env
const WHATSAPP_TOKEN = process.env.WHATSAPP_TOKEN; // .env
const PHONE_NUMBER_ID = process.env.WHATSAPP_PHONE_NUMBER_ID; // .env
const PORT = process.env.PORT || 3000;

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
  { key: "asados_paellas", title: "Asados / Paellas" },
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
const LIST_FOOTER = { text: "Los marcados con * son por encargo o según disponibilidad." };
// Tiempo de "silencio" tras el mensaje de agradecimiento (en milisegundos)
const MUTE_AFTER_THANKS_MS = 30 * 60 * 1000; // 30 min (ajústalo a tu gusto)



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

async function sendButtonsMenu(to, bodyText = "Hola 👋 Soy el asistente de la Carnicería Biel. Elija una opción:") {
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
  await sendButtonsMenu(to, "¿Desea hacer algo más? Elija una opción:");
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
      await sendButtonsMenu(to, "¿Desea hacer algo más?\n Elija una opción:");
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
        "Para hacer su pedido, por favor indique con detalle cómo quiere el corte (grosor, filetes, pieza, etc.)."
      );
      return;
    }
    default:
      await sendButtonsMenu(to);
      return;
  }
}

async function thankAndScheduleTomorrow(to) {
  const { day, slot } = getTomorrowScheduleEuropeMadrid();
  await sendText(
    to,
    `¡Muchas gracias! Su pedido estará listo *mañana* con horario de ${day}: ${slot}`
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
        // Aquí podrías guardar el pedido en tu BD:
        // TODO: guardar msg.text.body como 'pedido' en tu sistema
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
        const bodyText = msg.text?.body || "";
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
