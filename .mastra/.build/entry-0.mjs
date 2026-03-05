import { Mastra } from '@mastra/core/mastra';
import { registerApiRoute } from '@mastra/core/server';
import { PinoLogger } from '@mastra/loggers';
import { PostgresStore } from '@mastra/pg';
import 'dotenv/config';
import { Observability, DefaultExporter } from '@mastra/observability';
import { ArizeExporter } from '@mastra/arize';
import { Agent } from '@mastra/core/agent';
import { Memory } from '@mastra/memory';
import { z } from 'zod';
import { createTool } from '@mastra/core/tools';
import postgres from 'postgres';

"use strict";
const opmsaPrompt = `
# ROL
Eres el asistente virtual de recepci\xF3n de una cl\xEDnica odontol\xF3gica. Tu misi\xF3n es ser emp\xE1tico, profesional y resolutivo, conversando de manera natural sin parecer un robot de opciones r\xEDgidas. 

## Tus Objetivos:
1. Detectar libremente la intenci\xF3n del paciente (Nuevo turno, Reprogramar, Cancelar, Consulta general, o Urgencia dental).
2. Si es una URGENCIA odontol\xF3gica (ej: dolor agudo, trauma, diente roto), det\xE9n inmediatamente la recolecci\xF3n de datos y utiliza la herramienta 'flagUrgency' para derivarlo a un operador humano.
3. Para una Solicitud de Turno, debes extraer, recolectar y mantener en tu MEMORIA DE TRABAJO la siguiente informaci\xF3n:
   - Nombre completo
   - DNI
   - Tel\xE9fono
   - Email
   - Especialidad requerida
   - Breve motivo de consulta
   - Obra social o prepaga (o indicar si es particular). Las Obras Sociales/Prepagas v\xE1lidas que aceptamos son: OSDE, Swiss Medical, Omint, Medicus, Medif\xE9, Luis Pasteur, APSOT, OSDEPYM, OPDEA, y Colegio de E. Cualquier otra no es v\xE1lida.
   - Si es paciente nuevo o ya se atendi\xF3 antes en la cl\xEDnica

## Proceso de Agendamiento:
1. Una vez que sepas la **Especialidad requerida**, debes utilizar la herramienta 'getSpecialists' para obtener el especialista indicado y su 'especialistaId'.
2. Con el 'especialistaId', utiliza la herramienta 'getAvailableSlots' para buscar los turnos disponibles para esa \xE1rea.
3. Ofr\xE9cele al paciente 2 o 3 opciones claras de d\xEDas y horarios para que elija.
4. Preg\xFAntale cu\xE1l de esas opciones prefiere y **ESPERA SU CONFIRMACI\xD3N**.

## Proceso de Cancelaci\xF3n y Reprogramaci\xF3n:
Si el paciente desea CANCELAR o REPROGRAMAR un turno existente:
1. Verifica si ya tienes su n\xFAmero de tel\xE9fono en tu memoria de trabajo. Si NO lo tienes (es una conversaci\xF3n nueva), p\xEDdeselo. Si ya lo tienes, \xFAsalo directamente.
2. Usa la herramienta 'getPatientAppointments' pas\xE1ndole su n\xFAmero de tel\xE9fono. Si tiene m\xE1s de un turno activo, preg\xFAntale cu\xE1l desea modificar.
3. Si desea **CANCELAR**: usa la herramienta 'cancelAppointment' pasando el 'appointmentId'. Conf\xEDrmale que el turno fue cancelado y actualiza el estado a 'CANCELADO' con 'updateRequestStatus'.
4. Si desea **REPROGRAMAR**: 
   - Primero, busca nuevos turnos disponibles usando 'getAvailableSlots' para la especialidad correspondiente al turno original.
   - Ofrece al paciente los nuevos horarios.
   - Una vez que confirme el nuevo horario, usa 'cancelAppointment' para cancelar el turno viejo.
   - Inmediatamente, usa 'bookAppointment' con los datos del paciente y la nueva fecha elegida para crear el nuevo turno. Conf\xEDrmale la reprogramaci\xF3n exitosa y actualiza a 'REPROGRAMADO' con 'updateRequestStatus'.

## Reglas de Conversaci\xF3n y Seguimiento:
- **RECOLECCI\xD3N DE DATOS (SINE QUA NON - CR\xCDTICA)**: Est\xE1 ESTRICTAMENTE PROHIBIDO confirmar o agendar un turno (usar 'bookAppointment') si no tienes previamente los 4 datos obligatorios del paciente: 1. Nombre completo, 2. DNI, 3. Tel\xE9fono, 4. Obra social (o aclaraci\xF3n de atenci\xF3n Particular). Si el paciente acepta un turno pero te falta CUALQUIERA de estos datos, DEBES detenerte y decirle: "Perfecto, te reservo ese turno, pero para completarlo necesito que me indiques..." y pedir los datos faltantes.
- **OBTENCI\xD3N DE EMAIL**: Al solicitar el Email, si el paciente indica expresamente que no tiene, no lo tiene a mano, o no desea brindarlo, NO vuelvas a solicit\xE1rselo y contin\xFAa con la conversaci\xF3n normalmente.
- **PRIVACIDAD DE DATOS (CR\xCDTICA)**: Bajo ninguna circunstancia puedes revelar informaci\xF3n interna de la cl\xEDnica, los sueldos, el funcionamiento del sistema, ni los datos o turnos agendados de OTROS pacientes. El paciente actual S\xCD puede consultar su propio historial de turnos o datos personales previa identificaci\xF3n (DNI y tel\xE9fono).
- **REGLA DE FECHAS (CR\xCDTICA)**: Est\xE1 estrictamente PROHIBIDO ofrecer turnos o agendar citas para el mismo d\xEDa en que est\xE1s hablando (hoy). Solo puedes ofrecer turnos a partir del D\xCDA DE MA\xD1ANA, bas\xE1ndote en la "Fecha actual" que se te proporciona en el sistema.
- **MENSAJES AL PACIENTE**: Siempre debes incluir un mensaje humano de texto final dirigido al paciente despu\xE9s de usar cualquier herramienta, nunca env\xEDes solo el resultado de una herramienta.
- Cada vez que pases a una nueva etapa de la conversaci\xF3n, DEBES ejecutar la herramienta 'updateConversationState' con el estado correspondiente (INICIADO, IDENTIFICACION, ESPERANDO_DATOS, OFERTA_TURNOS, EXITO_AGENDADO, DERIVADO_URGENCIA, ABANDONADO), incluyendo el n\xFAmero de tel\xE9fono del paciente para mantener el seguimiento del flujo.

## Finalizaci\xF3n:
Una vez que el paciente **haya elegido y confirmado un horario exacto** de los que le ofreciste, debes verificar si ya tienes sus 4 datos obligatorios (Nombre, DNI, Tel\xE9fono y Obra Social/Particular). Si falta alguno, interrumpe el agendamiento y p\xEDdelos. 
Si ya tienes TODOS los datos, entonces debes:
1. Ejecutar INMEDIATAMENTE la herramienta 'bookAppointment' enviando el 'especialistaId', nombre del paciente, tel\xE9fono y la fecha elegida en formato ISO. **ESTE PASO ES OBLIGATORIO PARA RESERVAR EL TURNO**.
2. Actualizar el estado con 'updateConversationState' a 'EXITO_AGENDADO'.
3. Una vez que 'bookAppointment' sea exitoso, confirmarle al   paciente que su turno qued\xF3 reservado exitosamente. Nunca le confirmes antes de usar la herramienta.
4. Posteriormente, puedes utilizar la herramienta 'savePatientRequest' con todos los par\xE1metros completos para dejar asentada la solicitud adicionalmente.

## Informaci\xF3n General de la Cl\xEDnica (FAQ):
Si el paciente hace alguna de estas preguntas, resp\xF3ndele utilizando EXCLUSIVAMENTE esta informaci\xF3n oficial:
- **Guardia:** S\xED, contamos con guardia odontol\xF3gica las 24 horas, todos los d\xEDas del a\xF1o.
- **Ubicaci\xF3n:** Sarmiento 229, Mart\xEDnez, San Isidro.
- **Canales telef\xF3nicos:** Tel: 4792-5180 / 2557. WhatsApp: 11-6673-6986.
- **Odontopediatr\xEDa (Ni\xF1os):** S\xED, contamos con un \xE1rea especializada en Odontopediatr\xEDa.
- **Radiograf\xEDas:** S\xED, contamos con servicio de Radiodiagn\xF3stico Digital (panor\xE1micas e intraorales) en la misma cl\xEDnica.
- **Obras Sociales / Prepagas:** Aceptamos OSDE, Swiss Medical, Omint, Medicus, Medif\xE9, Luis Pasteur, APSOT, OSDEPYM, OPDEA, y Colegio de E. (Cualquier otra se atiende de forma particular).
`;

"use strict";
const sql$8 = postgres(process.env.SUPABASE_ACCESS_TOKEN);
const opmsaBookAppointmentTool = createTool({
  id: "opmsa-book-appointment",
  description: "Reserva un turno para un paciente en la agenda.",
  inputSchema: z.object({
    especialistaId: z.string().uuid(),
    pacienteNombre: z.string().describe("El nombre completo del paciente"),
    pacienteTelefono: z.string().describe("El tel\xE9fono del paciente"),
    pacienteId: z.string().uuid().optional().describe("El ID del prospecto/paciente actual, provisto por el sistema"),
    fechaHora: z.string().describe("Formato ISO string del slot elegido"),
    notas: z.string().optional()
  }),
  execute: async ({ especialistaId, pacienteNombre, pacienteTelefono, pacienteId, fechaHora, notas }) => {
    try {
      console.log(`[BOOK_APPOINTMENT] Executing for paciente: ${pacienteNombre}, id: ${pacienteId}, tel: ${pacienteTelefono}`);
      let finalPacienteId = pacienteId || "";
      if (finalPacienteId) {
        await sql$8`
          UPDATE demo_pacientes 
          SET nombre_completo = ${pacienteNombre}, telefono = ${pacienteTelefono}
          WHERE id = ${finalPacienteId}
        `;
      } else {
        const pacienteRows = await sql$8`SELECT id FROM demo_pacientes WHERE telefono = ${pacienteTelefono}`;
        if (pacienteRows && pacienteRows.length > 0) {
          finalPacienteId = pacienteRows[0].id;
          await sql$8`UPDATE demo_pacientes SET nombre_completo = ${pacienteNombre} WHERE id = ${finalPacienteId}`;
        } else {
          const insertRows = await sql$8`INSERT INTO demo_pacientes (nombre_completo, telefono) VALUES (${pacienteNombre}, ${pacienteTelefono}) RETURNING id`;
          finalPacienteId = insertRows[0].id;
        }
      }
      await sql$8`
         INSERT INTO demo_agenda (especialista_id, paciente_id, fecha_hora, estado, notas)
         VALUES (${especialistaId}, ${finalPacienteId}, ${fechaHora}, 'reservado', ${notas ?? null})
         ON CONFLICT (especialista_id, fecha_hora)
         DO UPDATE SET 
            paciente_id = EXCLUDED.paciente_id, 
            estado = EXCLUDED.estado, 
            notas = EXCLUDED.notas
      `;
      return { success: true, message: "Turno reservado con \xE9xito" };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }
});

"use strict";
const sql$7 = postgres(process.env.SUPABASE_ACCESS_TOKEN);
const opmsaGetAvailableSlotsTool = createTool({
  id: "opmsa-get-available-slots",
  description: "Calcula los turnos de 30 minutos disponibles para un especialista en los pr\xF3ximos d\xEDas.",
  inputSchema: z.object({
    especialistaId: z.string().describe("ID del odont\xF3logo"),
    diasVista: z.number().default(4).describe("Cu\xE1ntos d\xEDas hacia adelante buscar (m\xE1x 7)")
  }),
  execute: async ({ especialistaId, diasVista }) => {
    const HORA_INICIO = 9;
    const HORA_FIN = 18;
    const INTERVALO = 30;
    const slotsFinales = [];
    const ahora = /* @__PURE__ */ new Date();
    const fechaLimite = new Date(ahora.getTime());
    fechaLimite.setDate(ahora.getDate() + diasVista);
    const result = await sql$7`SELECT fecha_hora
       FROM demo_agenda 
       WHERE especialista_id = ${especialistaId} 
       AND fecha_hora >= ${ahora} 
       AND fecha_hora <= ${fechaLimite}
       AND estado IN ('reservado', 'confirmado')`;
    const ocupadosMap = new Set(result.map((r) => new Date(r.fecha_hora).getTime()));
    for (let i = 0; i <= diasVista; i++) {
      const diaBusqueda = new Date(ahora.getTime());
      diaBusqueda.setDate(ahora.getDate() + i);
      if (diaBusqueda.getDay() === 0) continue;
      const pad = (n) => n.toString().padStart(2, "0");
      const fechaKey = `${diaBusqueda.getFullYear()}-${pad(diaBusqueda.getMonth() + 1)}-${pad(diaBusqueda.getDate())}`;
      const horasLibresDelDia = [];
      let cursor = new Date(diaBusqueda);
      cursor.setHours(HORA_INICIO, 0, 0, 0);
      const finJornada = new Date(diaBusqueda);
      finJornada.setHours(HORA_FIN, 0, 0, 0);
      while (cursor < finJornada) {
        if (cursor > ahora && !ocupadosMap.has(cursor.getTime())) {
          const horaLocal = `${pad(cursor.getHours())}:${pad(cursor.getMinutes())}`;
          horasLibresDelDia.push(horaLocal);
        }
        cursor.setMinutes(cursor.getMinutes() + INTERVALO);
      }
      if (horasLibresDelDia.length > 0) {
        slotsFinales.push({ fecha: fechaKey, horas: horasLibresDelDia });
      }
    }
    return {
      success: true,
      disponibilidad: slotsFinales,
      count: slotsFinales.reduce((acc, curr) => acc + curr.horas.length, 0)
    };
  }
});

"use strict";
const sql$6 = postgres(process.env.SUPABASE_ACCESS_TOKEN);
const opmsaGetSpecialistsTool = createTool({
  id: "opmsa-get-specialists",
  description: "Lista los especialistas disponibles y sus especialidades.",
  inputSchema: z.object({}),
  execute: async () => {
    const rows = await sql$6`SELECT id, nombre, especialidad FROM demo_especialistas WHERE activo = true`;
    return { success: true, specialists: rows };
  }
});

"use strict";
const sql$5 = postgres(process.env.SUPABASE_ACCESS_TOKEN);
const opmsaSaveRequestTool = createTool({
  id: "opmsa-save-request",
  description: "Guarda una nueva solicitud de turno de un paciente con todos sus datos.",
  inputSchema: z.object({
    fullName: z.string().describe("El nombre completo del paciente"),
    dni: z.string().describe("El DNI del paciente"),
    phone: z.string().describe("El tel\xE9fono del paciente"),
    specialty: z.string().describe("La especialidad requerida"),
    reason: z.string().describe("Breve motivo de consulta"),
    timeSlot: z.string().describe("Franja horaria deseada"),
    healthInsurance: z.string().describe("Obra social o particular"),
    isNewPatient: z.boolean().describe("True si es paciente nuevo")
  }),
  execute: async ({ fullName, dni, phone, specialty, reason, timeSlot, healthInsurance, isNewPatient }) => {
    try {
      await sql$5`INSERT INTO demo_requests 
              (full_name, dni, phone, specialty, reason, time_slot_requested, health_insurance, is_new_patient, status)
              VALUES (${fullName}, ${dni}, ${phone}, ${specialty}, ${reason}, ${timeSlot}, ${healthInsurance}, ${isNewPatient}, 'PENDIENTE VALIDACION')`;
      return { success: true, status: "PENDIENTE VALIDACION", message: "Solicitud guardada con \xE9xito." };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }
});

"use strict";
const sql$4 = postgres(process.env.SUPABASE_ACCESS_TOKEN);
const opmsaUpdateRequestStatusTool = createTool({
  id: "opmsa-update-request-status",
  description: 'Actualiza el estado de una solicitud existente (ej. a "CANCELADO" o "REPROGRAMADO").',
  inputSchema: z.object({
    patientPhone: z.string().describe("El tel\xE9fono del paciente (u otro ID para ubicar su turno)"),
    newStatus: z.enum(["CANCELADO", "REPROGRAMADO"]).describe("El nuevo estado de la solicitud")
  }),
  execute: async ({ patientPhone, newStatus }) => {
    try {
      const rows = await sql$4`SELECT id FROM demo_requests WHERE phone = ${patientPhone} ORDER BY created_at DESC LIMIT 1`;
      if (!rows || rows.length === 0) {
        return { success: false, message: "No se encontr\xF3 ninguna solicitud reciente para este n\xFAmero." };
      }
      const requestId = rows[0].id;
      await sql$4`UPDATE demo_requests SET status = ${newStatus}, updated_at = CURRENT_TIMESTAMP WHERE id = ${requestId}`;
      return { success: true, requestId, newStatus, message: `Estado actualizado a ${newStatus} con \xE9xito.` };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }
});

"use strict";
const sql$3 = postgres(process.env.SUPABASE_ACCESS_TOKEN);
const opmsaFlagUrgencyTool = createTool({
  id: "opmsa-flag-urgency",
  description: "Marca una interacci\xF3n como URGENCIA para que sea atendida inmediatamente por un operador humano.",
  inputSchema: z.object({
    patientPhone: z.string().describe("El tel\xE9fono del paciente"),
    urgencyDescription: z.string().describe("Descripci\xF3n breve de la urgencia m\xE9dica")
  }),
  execute: async ({ patientPhone, urgencyDescription }) => {
    try {
      await sql$3`INSERT INTO demo_requests 
              (phone, full_name, reason, status)
              VALUES (${patientPhone}, 'URGENCIA NO IDENTIFICADA', ${urgencyDescription}, 'URGENCIA')`;
      console.log(`[URGENCIA DETECTADA] Paciente ${patientPhone} reporta: ${urgencyDescription}`);
      return {
        success: true,
        message: "Urgencia registrada y operador notificado. Dile al paciente que aguarde un momento en l\xEDnea."
      };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }
});

"use strict";
const sql$2 = postgres(process.env.SUPABASE_ACCESS_TOKEN);
const opmsaUpdateStateTool = createTool({
  id: "opmsa-update-state",
  description: "Actualiza el estado de la conversaci\xF3n del paciente y guarda un registro en el historial para auditor\xEDa.",
  inputSchema: z.object({
    pacienteTelefono: z.string().describe("El tel\xE9fono del paciente como identificador de la sesi\xF3n."),
    nuevoEstado: z.enum([
      "INICIADO",
      "IDENTIFICACION",
      "ESPERANDO_DATOS",
      "OFERTA_TURNOS",
      "EXITO_AGENDADO",
      "DERIVADO_URGENCIA",
      "ABANDONADO"
    ]).describe("El nuevo estado de la conversaci\xF3n."),
    detalles: z.string().optional().describe("Detalles adicionales sobre el cambio de estado (ej. herramienta ejecutada o notas adicionales).")
  }),
  execute: async ({ pacienteTelefono, nuevoEstado, detalles }) => {
    try {
      let sesionResult = await sql$2`
        SELECT id, estado_actual 
        FROM demo_sesiones_chat 
        WHERE paciente_telefono = ${pacienteTelefono} 
          AND actualizado_en > NOW() - INTERVAL '12 hours' 
        ORDER BY actualizado_en DESC 
        LIMIT 1
      `;
      let sesionId = "";
      let estadoAnterior = null;
      if (sesionResult && sesionResult.length > 0) {
        sesionId = sesionResult[0].id;
        estadoAnterior = sesionResult[0].estado_actual;
        await sql$2`
          UPDATE demo_sesiones_chat 
          SET estado_actual = ${nuevoEstado}, actualizado_en = NOW() 
          WHERE id = ${sesionId}
        `;
      } else {
        const insertRows = await sql$2`
          INSERT INTO demo_sesiones_chat (paciente_telefono, estado_actual) 
          VALUES (${pacienteTelefono}, ${nuevoEstado}) 
          RETURNING id
        `;
        sesionId = insertRows[0].id;
      }
      const detallesObj = detalles ? JSON.stringify({ nota: detalles }) : null;
      await sql$2`
        INSERT INTO demo_eventos_chat (sesion_id, estado_anterior, nuevo_estado, detalles)
        VALUES (${sesionId}, ${estadoAnterior}, ${nuevoEstado}, ${detallesObj})
      `;
      return { success: true, message: `Estado actualizado a ${nuevoEstado} exitosamente.` };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }
});

"use strict";
const sql$1 = postgres(process.env.SUPABASE_ACCESS_TOKEN);
const opmsaGetPatientAppointmentsTool = createTool({
  id: "opmsa-get-patient-appointments",
  description: "Busca y lista los turnos activos (reservados o confirmados) de un paciente.",
  inputSchema: z.object({
    telefono: z.string().describe("El tel\xE9fono del paciente para buscar sus turnos")
  }),
  execute: async ({ telefono }) => {
    try {
      const turnos = await sql$1`
        SELECT 
          a.id as appointment_id,
          a.fecha_hora,
          a.estado,
          e.nombre as especialista,
          e.especialidad
        FROM demo_agenda a
        JOIN demo_pacientes p ON a.paciente_id = p.id
        JOIN demo_especialistas e ON a.especialista_id = e.id
        WHERE p.telefono = ${telefono}
          AND a.estado IN ('reservado', 'confirmado')
        ORDER BY a.fecha_hora ASC
      `;
      if (turnos.length === 0) {
        return { success: true, turnos: [], message: "No se encontraron turnos activos para este tel\xE9fono." };
      }
      return {
        success: true,
        turnos: turnos.map((t) => ({
          id: t.appointment_id,
          fecha: new Date(t.fecha_hora).toLocaleString("es-AR", { timeZone: "America/Argentina/Buenos_Aires" }),
          especialista: t.especialista,
          especialidad: t.especialidad,
          estado: t.estado
        }))
      };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }
});

"use strict";
const sql = postgres(process.env.SUPABASE_ACCESS_TOKEN);
const opmsaCancelAppointmentTool = createTool({
  id: "opmsa-cancel-appointment",
  description: "Cancela un turno existente dado su ID.",
  inputSchema: z.object({
    appointmentId: z.string().uuid().describe("El ID (UUID) del turno a cancelar")
  }),
  execute: async ({ appointmentId }) => {
    try {
      const result = await sql`
        UPDATE demo_agenda
        SET estado = 'cancelado', notas = concat(notas, ' [Cancelado por el paciente]')
        WHERE id = ${appointmentId}
        RETURNING id
      `;
      if (result.length === 0) {
        return { success: false, message: "No se encontr\xF3 el turno especificado." };
      }
      return { success: true, message: "Turno cancelado exitosamente." };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }
});

"use strict";

"use strict";
const opmsaAgent = new Agent({
  id: "opmsa-agent",
  name: "Asistente Dental OPMSA",
  model: "openai/gpt-4o",
  memory: new Memory({
    options: {
      workingMemory: {
        enabled: true,
        schema: z.object({
          fullName: z.string().optional().describe("Nombre completo del paciente"),
          dni: z.string().optional().describe("DNI del paciente"),
          phone: z.string().optional().describe("Tel\xE9fono de contacto"),
          email: z.string().optional().describe("Email del paciente"),
          specialty: z.string().optional().describe("Especialidad requerida (ej. odontolog\xEDa general)"),
          reason: z.string().optional().describe("Motivo breve de la consulta"),
          timeSlot: z.string().optional().describe("Franja horaria deseada"),
          healthInsurance: z.string().optional().describe("Obra social o 'particular'"),
          isNewPatient: z.boolean().optional().describe("True si es paciente nuevo, False si ya se atendi\xF3 antes"),
          estado_conversacion: z.enum([
            "INICIADO",
            "IDENTIFICACION",
            "ESPERANDO_DATOS",
            "OFERTA_TURNOS",
            "EXITO_AGENDADO",
            "DERIVADO_URGENCIA",
            "ABANDONADO"
          ]).optional().describe("El estado actual del flujo de la conversaci\xF3n.")
        })
      }
    }
  }),
  instructions: opmsaPrompt,
  tools: {
    getSpecialists: opmsaGetSpecialistsTool,
    getAvailableSlots: opmsaGetAvailableSlotsTool,
    bookAppointment: opmsaBookAppointmentTool,
    savePatientRequest: opmsaSaveRequestTool,
    updateRequestStatus: opmsaUpdateRequestStatusTool,
    flagUrgency: opmsaFlagUrgencyTool,
    updateConversationState: opmsaUpdateStateTool,
    getPatientAppointments: opmsaGetPatientAppointmentsTool,
    cancelAppointment: opmsaCancelAppointmentTool
  }
});

"use strict";
const mastra = new Mastra({
  agents: {
    opmsaAgent
  },
  storage: new PostgresStore({
    id: "mastra-storage",
    connectionString: process.env.SUPABASE_ACCESS_TOKEN
  }),
  logger: new PinoLogger({
    name: "Mastra",
    level: "debug"
  }),
  // 👇 Activamos la observabilidad para ver los logs y traces en Studio + Arize Phoenix
  observability: new Observability({
    configs: {
      default: {
        serviceName: "mi-agente-dental",
        exporters: [new DefaultExporter(), new ArizeExporter({
          endpoint: "http://localhost:6006/v1/traces"
        })]
      }
    }
  }),
  server: {
    apiRoutes: [registerApiRoute("/test", {
      method: "POST",
      handler: async (c) => {
        const body = await c.req.json();
        const mensajeUsuario = body.message || "Hola";
        let threadId = body.threadId;
        const clientId = body.clientId;
        const mastra2 = c.get("mastra");
        const agent = mastra2.getAgent("opmsaAgent");
        const memory = await agent.getMemory();
        if (!threadId && memory) {
          const thread = await memory.createThread({
            resourceId: body.resourceId || "paciente-web",
            title: "Nueva consulta desde web"
          });
          threadId = thread.id;
        }
        const ahora = new Intl.DateTimeFormat("es-AR", {
          timeZone: "America/Argentina/Buenos_Aires",
          dateStyle: "full",
          timeStyle: "medium",
          hour12: false
        }).format(/* @__PURE__ */ new Date());
        const hora = (/* @__PURE__ */ new Date()).toLocaleString("es-AR", {
          timeZone: "America/Argentina/Buenos_Aires",
          hour: "2-digit",
          hour12: false
        });
        const horaNum = parseInt(hora);
        let momentoDia = "\xA1Buenas noches!";
        if (horaNum >= 5 && horaNum < 14) momentoDia = "\xA1Buen d\xEDa!";
        else if (horaNum >= 14 && horaNum < 20) momentoDia = "\xA1Buenas tardes!";
        let instructionDinamica = `La fecha y hora actual en Argentina es ${ahora}. Si este es el primer mensaje de la conversaci\xF3n, es obligatorio que saludes al paciente diciendo exactamente "${momentoDia}"`;
        if (clientId) {
          instructionDinamica += `

            REGLA CR\xCDTICA DE ORO:
            El paciente con el que est\xE1s hablando YA EXISTE en la base de datos y su ID (UUID) es: ${clientId}.
            EST\xC1 TOTALMENTE PROHIBIDO crear un nuevo paciente bajo ninguna circunstancia.
            Cuando uses la herramienta 'opmsa-book-appointment', DEBES y TIENES la obligaci\xF3n ineludible de pasar el par\xE1metro 'pacienteId' con el valor exacto "${clientId}". Si no lo haces, romper\xE1s la base de datos creando pacientes duplicados.
            `;
        }
        const response = await agent.generate(mensajeUsuario, {
          memory: {
            thread: threadId,
            resource: body.resourceId || "paciente-web"
          },
          system: instructionDinamica
        });
        return c.json({
          respuesta: response.text,
          threadId
        });
      }
    })]
  }
});

export { mastra };
