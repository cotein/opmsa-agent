import { Agent } from "@mastra/core/agent";
import { Memory } from "@mastra/memory";
import { opmsaPrompt } from "../prompts/genera-citas";
import { z } from "zod";

// Importamos las herramientas que ya creamos/tienes
import {
  opmsaGetAvailableSlotsTool,
  opmsaBookAppointmentTool,
  opmsaGetSpecialistsTool,
  opmsaSaveRequestTool,
  opmsaUpdateRequestStatusTool,
  opmsaFlagUrgencyTool,
  opmsaUpdateStateTool,
  opmsaGetPatientAppointmentsTool,
  opmsaCancelAppointmentTool
} from "../tools";

export const opmsaAgent = new Agent({
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
          phone: z.string().optional().describe("Teléfono de contacto"),
          email: z.string().optional().describe("Email del paciente"),
          specialty: z.string().optional().describe("Especialidad requerida (ej. odontología general)"),
          reason: z.string().optional().describe("Motivo breve de la consulta"),
          timeSlot: z.string().optional().describe("Franja horaria deseada"),
          healthInsurance: z.string().optional().describe("Obra social o 'particular'"),
          isNewPatient: z.boolean().optional().describe("True si es paciente nuevo, False si ya se atendió antes"),
          estado_conversacion: z.enum([
            'INICIADO',
            'IDENTIFICACION',
            'ESPERANDO_DATOS',
            'OFERTA_TURNOS',
            'EXITO_AGENDADO',
            'DERIVADO_URGENCIA',
            'ABANDONADO'
          ]).optional().describe("El estado actual del flujo de la conversación.")
        })
      },
    },
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
    cancelAppointment: opmsaCancelAppointmentTool,
  },
});