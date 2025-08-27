import express from "express";
import axios from "axios";

const app = express();
app.use(express.json());

// ======== CONFIG (rellena .env) ========
const VERIFY_TOKEN = process.env.VERIFY_TOKEN; // TODO: .env
const WHATSAPP_TOKEN = process.env.WHATSAPP_TOKEN; // TODO: .env
const PHONE_NUMBER_ID = process.env.WHATSAPP_PHONE_NUMBER_ID; // TODO: .env
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

const CARTA = [
  // TODO: Sustituye por tu contenido real
  "lista de carnes",
  "lista de preparados"
];

// ======== ESTADO EN MEMORIA (cámbialo por Redis/DB en prod) ========
/** Map<string, { awaitingOrder: boolean }> por número de cliente */
const userState = new Map();

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

async function sendButtonsMenu(to, bodyText = "Hola 👋 Soy el asistente de la carnicería. Elige una opción:") {
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
            { type: "reply", reply: { id: "opt_horario", title: "Horario" } },
            { type: "reply", reply: { id: "opt_carta", title: "Carta" } },
            { type: "reply", reply: { id: "opt_pedido", title: "Pedido" } }
          ]
        }
      }
    },
    { headers: { Authorization: `Bearer ${WHATSAPP_TOKEN}` } }
  );
}

async function handleOption(to, option) {
  switch (option) {
    case "horario": {
      const lines = [
        "Horario:",
        `lunes\t${HORARIO.lunes}`,
        `martes\t${HORARIO.martes}`,
        `miércoles\t${HORARIO.miércoles}`,
        `jueves\t${HORARIO.jueves}`,
        `viernes\t${HORARIO.viernes}`,
        `sábado\t${HORARIO.sábado}`,
        `domingo\t${HORARIO.domingo}`
      ].join("\n");
      await sendText(to, lines);
      await sendButtonsMenu(to, "¿Deseas hacer algo más? Elige una opción:");
      return;
    }
    case "carta": {
      const txt = `Carta:\n- ${CARTA.join("\n- ")}`;
      await sendText(to, txt);
      await sendButtonsMenu(to, "¿Deseas hacer algo más? Elige una opción:");
      return;
    }
    case "pedido": {
      userState.set(to, { awaitingOrder: true });
      await sendText(
        to,
        "Para hacer tu pedido, por favor indica con detalle cómo quieres el corte (grosor, filetes, pieza, etc.)."
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
    `¡Muchas gracias! Su pedido estará listo **mañana** con horario de (${day}): ${slot}`
  );
  await sendButtonsMenu(to, "¿Deseas hacer algo más? Elige una opción:");
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

      // Si pulsó botón interactivo
      if (type === "interactive" && msg.interactive?.button_reply?.id) {
        const id = msg.interactive.button_reply.id;
        if (id === "opt_horario") await handleOption(from, "horario");
        else if (id === "opt_carta") await handleOption(from, "carta");
        else if (id === "opt_pedido") await handleOption(from, "pedido");
        else await sendButtonsMenu(from);
        return res.sendStatus(200);
      }

      // Si escribió texto libre, también admitimos palabras clave o 1/2/3
      if (type === "text") {
        const kw = normalizeKeyword(msg.text?.body);
        if (kw) {
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
