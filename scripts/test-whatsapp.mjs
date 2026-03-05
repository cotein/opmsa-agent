import { setTimeout } from 'timers/promises';

const PORT = 4111; // Puerto por defecto de Mastra
const ENDPOINT = `http://localhost:${PORT}/test`;

const messages = [
  "Hola",
  "qué tal?",
  "necesito un turno",
  "me duele la muela un poco, para revisión general",
  "me llamo Diego",
  "mi DNI es 30123456 y mi cel es 11223344",
  "no tengo mail, disculpa",
  "el turno que tengas más cerca a partir de mañana, por favor"
];

async function simulate() {
  console.log("🟢 INICIANDO SIMULACIÓN DE WHATSAPP 🟢\n");
  let currentThreadId = null;

  for (const msg of messages) {
    console.log(`\n📱 Usuario: "${msg}"`);
    console.log(`   (Enviando...)`);
    
    // Simulamos que el humano tarda un poquito en escribir entre mensaje y mensaje
    await setTimeout(2000);
    
    try {
      const response = await fetch(ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: msg,
          threadId: currentThreadId,
          resourceId: "paciente-whatsapp-1"
        })
      });
      
      const text = await response.text();
      let data = {};
      try {
         data = JSON.parse(text);
      } catch (e) {
         console.warn("   [Aviso: La respuesta no era un JSON puro. Intentando extraer data...]");
         // Si la API devuelve otra cosa, simplemente lo imprimimos
         console.log(`\n🤖 Asistente OPMSA:\n"${text}"\n`);
         console.log("-----------------------------------------------------");
         continue;
      }
      
      if (!currentThreadId && data.threadId) {
         currentThreadId = data.threadId;
         console.log(`   [Sistema: Hilo asignado -> ${currentThreadId}]`);
      }
      
      console.log(`\n🤖 Asistente OPMSA:\n"${data.respuesta}"\n`);
      console.log("-----------------------------------------------------");
      
    } catch(e) {
      console.error("\n❌ Error de comunicación con la API. Asegúrate de que 'npm run dev' esté ejecutándose y el puerto sea el correcto.", e.message);
      break;
    }
  }
  
  console.log("🏁 SIMULACIÓN FINALIZADA 🏁");
}

simulate();
