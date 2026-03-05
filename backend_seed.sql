DROP TABLE IF EXISTS demo_requests;
DROP TABLE IF EXISTS demo_agenda;
DROP TABLE IF EXISTS demo_pacientes;
DROP TABLE IF EXISTS demo_especialistas;

CREATE TABLE demo_especialistas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nombre TEXT NOT NULL,
    especialidad TEXT NOT NULL,
    bio TEXT,
    activo BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE demo_pacientes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nombre_completo TEXT NOT NULL,
    telefono TEXT UNIQUE,
    email TEXT UNIQUE,
    obra_social TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE demo_agenda (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    especialista_id UUID NOT NULL REFERENCES demo_especialistas(id) ON DELETE CASCADE,
    paciente_id UUID REFERENCES demo_pacientes(id) ON DELETE SET NULL,
    fecha_hora TIMESTAMP WITH TIME ZONE NOT NULL,
    duracion_minutos INTEGER DEFAULT 30,
    estado TEXT DEFAULT 'disponible' CHECK (estado IN ('disponible', 'reservado', 'confirmado', 'cancelado')),
    notas TEXT,
    UNIQUE (especialista_id, fecha_hora)
);

CREATE TABLE demo_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    phone TEXT NOT NULL,
    full_name TEXT NOT NULL,
    dni TEXT,
    specialty TEXT,
    reason TEXT,
    time_slot_requested TEXT,
    health_insurance TEXT,
    is_new_patient BOOLEAN DEFAULT false,
    status TEXT DEFAULT 'PENDIENTE VALIDACION' CHECK (status IN ('RECIBIDO', 'PENDIENTE VALIDACION', 'TURNO CONFIRMADO', 'REPROGRAMADO', 'CANCELADO', 'SIN RESPUESTA', 'URGENCIA'))
);

CREATE INDEX idx_demo_agenda_fecha ON demo_agenda(fecha_hora);
CREATE INDEX idx_demo_especialistas_rama ON demo_especialistas(especialidad);

INSERT INTO demo_especialistas (nombre, especialidad, bio) VALUES 
('Dr. Héctor Méndez', 'Guardia 24/7', 'Atención de urgencias odontológicas en cualquier momento.'),
('Dra. Silvina Luna', 'Guardia 24/7', 'Atención de urgencias odontológicas en cualquier momento.'),
('Dr. Fabián Ríos', 'Blanqueamiento Dental', 'Procedimiento seguro y eficaz con gel activado por luz especial. (No indicado en embarazo).'),
('Dra. Valeria Ortiz', 'Blanqueamiento Dental', 'Procedimiento seguro y eficaz con gel activado por luz especial. (No indicado en embarazo).'),
('Dr. Roberto Casal', 'Carillas Dentales', 'De porcelana, para corregir forma, color, tamaño o posición.'),
('Dra. Mónica Galindo', 'Carillas Dentales', 'De porcelana, para corregir forma, color, tamaño o posición.'),
('Dra. Elena Soler', 'Odontopediatría', 'Espacio cálido y amable para niños, enfocado en prevención y hábitos saludables.'),
('Dr. Marcos Paz', 'Odontopediatría', 'Espacio cálido y amable para niños, enfocado en prevención y hábitos saludables.'),
('Dr. Guillermo Soto', 'Periodoncia', 'Tratamiento de encías y hueso (sangrado, inflamación, sarro).'),
('Dra. Patricia Conde', 'Periodoncia', 'Tratamiento de encías y hueso (sangrado, inflamación, sarro).'),
('Dr. Sergio Torres', 'Alineadores Invisibles', 'Ortodoncia estética con férulas transparentes y removibles.'),
('Dra. Lucía Bosch', 'Alineadores Invisibles', 'Ortodoncia estética con férulas transparentes y removibles.'),
('Dr. Andrés Ibáñez', 'Implantes Dentales', 'Reemplazo de piezas con raíces de titanio biocompatible.'),
('Dra. Julia Domínguez', 'Implantes Dentales', 'Reemplazo de piezas con raíces de titanio biocompatible.'),
('Dr. Fernando Gatti', 'ATM y Bruxismo', 'Tratamiento de dolores articulares y desgaste dental por estrés (placas de descanso).'),
('Dra. Lorena Pratto', 'ATM y Bruxismo', 'Tratamiento de dolores articulares y desgaste dental por estrés (placas de descanso).'),
('Dr. Manuel Neira', 'Cirugía Bucal y Maxilofacial', 'Extracciones (incluyendo muelas de juicio), biopsias y tratamientos óseos.'),
('Dra. Rosa Espinoza', 'Cirugía Bucal y Maxilofacial', 'Extracciones (incluyendo muelas de juicio), biopsias y tratamientos óseos.'),
('Dra. Laura Mendez', 'Endodoncia', 'Tratamiento de conducto para conservar piezas infectadas o dañadas.'),
('Dr. Jorge Luis', 'Endodoncia', 'Tratamiento de conducto para conservar piezas infectadas o dañadas.'),
('Dra. Beatriz Vico', 'Prótesis Dental', 'Coronas, puentes, prótesis fijas o removibles sin metales visibles.'),
('Dr. Raúl Estévez', 'Prótesis Dental', 'Coronas, puentes, prótesis fijas o removibles sin metales visibles.'),
('Dr. Santiago Segura', 'Operatoria Dental (Caries)', 'Restauraciones con materiales de alta estética y durabilidad.'),
('Dra. Inés Estévez', 'Operatoria Dental (Caries)', 'Restauraciones con materiales de alta estética y durabilidad.'),
('Dr. Víctor Hugo', 'Radiodiagnóstico Digital', 'Radiografías intraorales y panorámicas con reducción de radiación (hasta 10 veces menos).'),
('Dra. Alicia Moreau', 'Radiodiagnóstico Digital', 'Radiografías intraorales y panorámicas con reducción de radiación (hasta 10 veces menos).');

INSERT INTO demo_agenda (especialista_id, fecha_hora, estado)
SELECT id, date_trunc('day', CURRENT_DATE + INTERVAL '1 day') + INTERVAL '10 hours', 'disponible'
FROM demo_especialistas;

INSERT INTO demo_agenda (especialista_id, fecha_hora, estado)
SELECT id, date_trunc('day', CURRENT_DATE + INTERVAL '1 day') + INTERVAL '11 hours', 'disponible'
FROM demo_especialistas 
LIMIT 10;
