import { mastra } from "./mastra/index.js";

async function runMemoryDemo() {
  console.log("🦷 INICIANDO DEMO DE AGENTE DENTAL OPMSA CON MEMORIA...\n");

  const agent = mastra.getAgent("opmsaAgent");
  const memory = await agent.getMemory();

  console.log("1️⃣ Creando un nuevo paciente (hilo de memoria)...");
  const thread = await memory?.createThread({
    resourceId: "demo-paciente-1",
    title: "Primera Consulta - Carlos",
    metadata: {
      phone: "+54 9 11 9876-5432"
    }
  });
  
  const threadId = thread!.id;
  const resourceId = thread!.resourceId;
  console.log(`✅ Hilo creado exitosamente. ID: ${threadId}\n`);

  console.log("2️⃣ Paciente envia su primer mensaje...");
  const msg1 = "Hola! Soy Carlos y me está doliendo mucho la muela de juicio. Necesito un turno urgente.";
  console.log(`👤 Paciente: "${msg1}"\n`);
  
  console.log("⏳ Agente pensando...\n");
  const response1 = await agent.generate(msg1, {
    memory: {
      thread: threadId,
      resource: resourceId,
    }
  });
  console.log(`🤖 Agente: "${response1.text}"\n`);
  console.log("-".repeat(50) + "\n");

  console.log("3️⃣ Simulamos que pasa un tiempo, y el paciente vuelve a escribir (SIN RECORDARLE SU NOMBRE NI MOTIVO)...");
  const msg2 = "Perfecto, agendame para el horario más cercano que me ofreciste por favor.";
  console.log(`👤 Paciente: "${msg2}"\n`);

  console.log("⏳ Agente procesando con contexto previo...\n");
  const response2 = await agent.generate(msg2, {
    memory: {
      thread: threadId,
      resource: resourceId,
    }
  });
  console.log(`🤖 Agente: "${response2.text}"\n`);

  console.log("✨ Fin de la demo. Como puedes ver, el agente recordó que era Carlos, su dolor de muela, y las opciones que le había dado en el primer mensaje.");
}

runMemoryDemo().catch(console.error);
