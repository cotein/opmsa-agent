import { Mastra } from '@mastra/core/mastra';
import { registerApiRoute } from '@mastra/core/server';
import { PinoLogger } from '@mastra/loggers';
import { PostgresStore } from '@mastra/pg';
import 'dotenv/config';
import { Observability, DefaultExporter, SensitiveDataFilter } from '@mastra/observability';
import { ArizeExporter } from '@mastra/arize';
import { opmsaAgent } from './agents/opmsa-agent';

export const mastra = new Mastra({
  agents: { opmsaAgent },
  storage: new PostgresStore({
    id: "mastra-storage",
    connectionString: process.env.DATABASE_URL || process.env.SUPABASE_ACCESS_TOKEN as string,
  }),
  logger: new PinoLogger({
    name: 'Mastra',
    level: 'debug',
  }),
  // 👇 Activamos la observabilidad para ver los logs y traces en Studio + Arize Phoenix
  observability: new Observability({
    configs: {
      default: {
        serviceName: "mi-agente-dental",
        exporters: [
          new DefaultExporter(),
          new ArizeExporter({
            endpoint: "http://localhost:6006/v1/traces", 
          })
        ]
      }
    }
  }),
  server: {
    apiRoutes: [
      registerApiRoute('/test', {
        method: 'POST',
        handler: async c => {
          // 1. Extraemos el mensaje que envía el usuario y el ID de su hilo si ya inició conversación
          const body = await c.req.json();
          const mensajeUsuario = body.message || "Hola";
          let threadId = body.threadId;
          const clientId = body.clientId; // Para no duplicar pacientes

          // 2. Instanciamos a tu agente
          const mastra = c.get('mastra');
          const agent = mastra.getAgent('opmsaAgent');
          const memory = await agent.getMemory();

          // 3. Generamos temporalmente una nueva memoria (hilo) si no se envió en el body
          if (!threadId && memory) {
             const thread = await memory.createThread({
               resourceId: body.resourceId || "paciente-web",
               title: "Nueva consulta desde web"
             });
             threadId = thread.id;
          }

          // 4. Calculamos la hora de Argentina y el saludo dinámicamente
          const ahora = new Intl.DateTimeFormat('es-AR', {
            timeZone: 'America/Argentina/Buenos_Aires',
            dateStyle: 'full',
            timeStyle: 'medium',
            hour12: false
          }).format(new Date());
          const hora = new Date().toLocaleString('es-AR', { timeZone: 'America/Argentina/Buenos_Aires', hour: '2-digit', hour12: false });
          const horaNum = parseInt(hora);
          let momentoDia = "¡Buenas noches!";
          if (horaNum >= 5 && horaNum < 14) momentoDia = "¡Buen día!";
          else if (horaNum >= 14 && horaNum < 20) momentoDia = "¡Buenas tardes!";

          // 5. Inyectamos la instrucción estructurada de forma invisible usando el parámetro 'system'
          let instructionDinamica = `La fecha y hora actual en Argentina es ${ahora}. Si este es el primer mensaje de la conversación, es obligatorio que saludes al paciente diciendo exactamente "${momentoDia}"`;
          
          if (clientId) {
            instructionDinamica += `\n
            REGLA CRÍTICA DE ORO:
            El paciente con el que estás hablando YA EXISTE en la base de datos y su ID (UUID) es: ${clientId}.
            ESTÁ TOTALMENTE PROHIBIDO crear un nuevo paciente bajo ninguna circunstancia.
            Cuando uses la herramienta 'opmsa-book-appointment', DEBES y TIENES la obligación ineludible de pasar el parámetro 'pacienteId' con el valor exacto "${clientId}". Si no lo haces, romperás la base de datos creando pacientes duplicados.
            `;
          }

          // 6. Generamos la respuesta con IA inyectándole el contexto por debajo
          const response = await agent.generate(mensajeUsuario, {
             memory: {
                 thread: threadId,
                 resource: body.resourceId || "paciente-web"
             },
             system: instructionDinamica
          });

          // 7. Devolvemos el texto final Y TAMBIÉN el identificador del hilo actual, 
          // el frontend debe encargarse de conservar ese 'threadId' y enviarlo en el próximo POST!
          return c.json({
               respuesta: response.text, 
               threadId: threadId 
          });
        },
      }),
    ],
  },
});
