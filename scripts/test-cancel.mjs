import { setTimeout } from 'timers/promises';

const PORT = 4111;
const ENDPOINT = `http://localhost:${PORT}/test`;

const messages = [
  "hola, soy diego, mi tel es 11223344",
  "quiero cancelar mi turno",
  "si, cancelalo por favor",
];

async function simulate() {
  console.log("🟢 INICIANDO SIMULACIÓN DE CANCELACIÓN 🟢\n");
  let currentThreadId = null;

  for (const msg of messages) {
    console.log(`\n📱 Usuario: "${msg}"`);
    console.log(`   (Enviando...)`);
    
    await setTimeout(2000);
    
    try {
      const response = await fetch(ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: msg,
          threadId: currentThreadId,
          resourceId: "paciente-whatsapp-2"
        })
      });
      
      const text = await response.text();
      let data = {};
      try { data = JSON.parse(text); } catch (e) {
         console.warn("   [Aviso: La respuesta no era JSON puro.]");
         console.log(`\n🤖 Asistente:\n"${text}"\n`);
         continue;
      }
      
      if (!currentThreadId && data.threadId) {
         currentThreadId = data.threadId;
         console.log(`   [Sistema: Hilo asignado -> ${currentThreadId}]`);
      }
      
      console.log(`\n🤖 Asistente:\n"${data.respuesta}"\n`);
      console.log("-----------------------------------------------------");
      
    } catch(e) {
      console.error("\n❌ Error de comunicación", e.message);
      break;
    }
  }
}

simulate();
