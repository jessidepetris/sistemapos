// Provincias de Argentina
export const provincias = [
  { id: "01", nombre: "Buenos Aires" },
  { id: "02", nombre: "Catamarca" },
  { id: "03", nombre: "Chaco" },
  { id: "04", nombre: "Chubut" },
  { id: "05", nombre: "Córdoba" },
  { id: "06", nombre: "Corrientes" },
  { id: "07", nombre: "Entre Ríos" },
  { id: "08", nombre: "Formosa" },
  { id: "09", nombre: "Jujuy" },
  { id: "10", nombre: "La Pampa" },
  { id: "11", nombre: "La Rioja" },
  { id: "12", nombre: "Mendoza" },
  { id: "13", nombre: "Misiones" },
  { id: "14", nombre: "Neuquén" },
  { id: "15", nombre: "Río Negro" },
  { id: "16", nombre: "Salta" },
  { id: "17", nombre: "San Juan" },
  { id: "18", nombre: "San Luis" },
  { id: "19", nombre: "Santa Cruz" },
  { id: "20", nombre: "Santa Fe" },
  { id: "21", nombre: "Santiago del Estero" },
  { id: "22", nombre: "Tierra del Fuego" },
  { id: "23", nombre: "Tucumán" },
  { id: "24", nombre: "Ciudad Autónoma de Buenos Aires" }
];

// Localidades por provincia (ejemplo con algunas localidades principales por provincia)
export const localidadesPorProvincia: Record<string, { id: string, nombre: string }[]> = {
  "01": [ // Buenos Aires
    { id: "01-001", nombre: "La Plata" },
    { id: "01-002", nombre: "Mar del Plata" },
    { id: "01-003", nombre: "Bahía Blanca" },
    { id: "01-004", nombre: "Tandil" },
    { id: "01-005", nombre: "San Nicolás de los Arroyos" },
    { id: "01-006", nombre: "Quilmes" },
    { id: "01-007", nombre: "Morón" },
    { id: "01-008", nombre: "La Matanza" }
  ],
  "02": [ // Catamarca
    { id: "02-001", nombre: "San Fernando del Valle de Catamarca" },
    { id: "02-002", nombre: "Santa María" },
    { id: "02-003", nombre: "Andalgalá" },
    { id: "02-004", nombre: "Tinogasta" }
  ],
  "03": [ // Chaco
    { id: "03-001", nombre: "Resistencia" },
    { id: "03-002", nombre: "Barranqueras" },
    { id: "03-003", nombre: "Presidencia Roque Sáenz Peña" },
    { id: "03-004", nombre: "Villa Ángela" }
  ],
  "04": [ // Chubut
    { id: "04-001", nombre: "Rawson" },
    { id: "04-002", nombre: "Comodoro Rivadavia" },
    { id: "04-003", nombre: "Trelew" },
    { id: "04-004", nombre: "Puerto Madryn" }
  ],
  "05": [ // Córdoba
    { id: "05-001", nombre: "Córdoba" },
    { id: "05-002", nombre: "Río Cuarto" },
    { id: "05-003", nombre: "Villa María" },
    { id: "05-004", nombre: "San Francisco" },
    { id: "05-005", nombre: "Alta Gracia" },
    { id: "05-006", nombre: "Río Tercero" },
    { id: "05-007", nombre: "Villa Carlos Paz" },
    { id: "05-008", nombre: "Bell Ville" },
    { id: "05-009", nombre: "Marcos Juárez" },
    { id: "05-010", nombre: "Arroyito" },
    { id: "05-011", nombre: "Río Segundo" },
    { id: "05-012", nombre: "Villa Nueva" },
    { id: "05-013", nombre: "Villa Dolores" },
    { id: "05-014", nombre: "Morteros" },
    { id: "05-015", nombre: "La Calera" },
    { id: "05-016", nombre: "Cosquín" },
    { id: "05-017", nombre: "Jesús María" },
    { id: "05-018", nombre: "Río Ceballos" },
    { id: "05-019", nombre: "Cruz del Eje" },
    { id: "05-020", nombre: "Villa Allende" },
    { id: "05-021", nombre: "Capilla del Monte" },
    { id: "05-022", nombre: "La Falda" },
    { id: "05-023", nombre: "General Deheza" },
    { id: "05-024", nombre: "Laboulaye" },
    { id: "05-025", nombre: "Colonia Caroya" },
    { id: "05-026", nombre: "Oncativo" },
    { id: "05-027", nombre: "Oliva" },
    { id: "05-028", nombre: "Unquillo" },
    { id: "05-029", nombre: "Deán Funes" },
    { id: "05-030", nombre: "Monte Cristo" },
    { id: "05-031", nombre: "Salsipuedes" },
    { id: "05-032", nombre: "Almafuerte" },
    { id: "05-033", nombre: "Hernando" },
    { id: "05-034", nombre: "Las Varillas" },
    { id: "05-035", nombre: "Huinca Renancó" },
    { id: "05-036", nombre: "Malagueño" },
    { id: "05-037", nombre: "Pilar" },
    { id: "05-038", nombre: "Corral de Bustos" },
    { id: "05-039", nombre: "Saldán" },
    { id: "05-040", nombre: "Laguna Larga" }
  ],
  "06": [ // Corrientes
    { id: "06-001", nombre: "Corrientes" },
    { id: "06-002", nombre: "Goya" },
    { id: "06-003", nombre: "Mercedes" },
    { id: "06-004", nombre: "Santo Tomé" }
  ],
  "07": [ // Entre Ríos
    { id: "07-001", nombre: "Paraná" },
    { id: "07-002", nombre: "Concordia" },
    { id: "07-003", nombre: "Gualeguaychú" },
    { id: "07-004", nombre: "Concepción del Uruguay" }
  ],
  "08": [ // Formosa
    { id: "08-001", nombre: "Formosa" },
    { id: "08-002", nombre: "Clorinda" },
    { id: "08-003", nombre: "Pirané" },
    { id: "08-004", nombre: "Las Lomitas" }
  ],
  "09": [ // Jujuy
    { id: "09-001", nombre: "San Salvador de Jujuy" },
    { id: "09-002", nombre: "San Pedro de Jujuy" },
    { id: "09-003", nombre: "Palpalá" },
    { id: "09-004", nombre: "Libertador General San Martín" }
  ],
  "10": [ // La Pampa
    { id: "10-001", nombre: "Santa Rosa" },
    { id: "10-002", nombre: "General Pico" },
    { id: "10-003", nombre: "Toay" },
    { id: "10-004", nombre: "Eduardo Castex" }
  ],
  "11": [ // La Rioja
    { id: "11-001", nombre: "La Rioja" },
    { id: "11-002", nombre: "Chilecito" },
    { id: "11-003", nombre: "Arauco" },
    { id: "11-004", nombre: "Aimogasta" }
  ],
  "12": [ // Mendoza
    { id: "12-001", nombre: "Mendoza" },
    { id: "12-002", nombre: "San Rafael" },
    { id: "12-003", nombre: "Godoy Cruz" },
    { id: "12-004", nombre: "Guaymallén" },
    { id: "12-005", nombre: "Las Heras" }
  ],
  "13": [ // Misiones
    { id: "13-001", nombre: "Posadas" },
    { id: "13-002", nombre: "Oberá" },
    { id: "13-003", nombre: "Eldorado" },
    { id: "13-004", nombre: "Puerto Iguazú" }
  ],
  "14": [ // Neuquén
    { id: "14-001", nombre: "Neuquén" },
    { id: "14-002", nombre: "Cutral Có" },
    { id: "14-003", nombre: "Zapala" },
    { id: "14-004", nombre: "Plottier" }
  ],
  "15": [ // Río Negro
    { id: "15-001", nombre: "Viedma" },
    { id: "15-002", nombre: "San Carlos de Bariloche" },
    { id: "15-003", nombre: "General Roca" },
    { id: "15-004", nombre: "Cipolletti" }
  ],
  "16": [ // Salta
    { id: "16-001", nombre: "Salta" },
    { id: "16-002", nombre: "San Ramón de la Nueva Orán" },
    { id: "16-003", nombre: "Tartagal" },
    { id: "16-004", nombre: "Metán" }
  ],
  "17": [ // San Juan
    { id: "17-001", nombre: "San Juan" },
    { id: "17-002", nombre: "Rawson" },
    { id: "17-003", nombre: "Rivadavia" },
    { id: "17-004", nombre: "Caucete" }
  ],
  "18": [ // San Luis
    { id: "18-001", nombre: "San Luis" },
    { id: "18-002", nombre: "Villa Mercedes" },
    { id: "18-003", nombre: "Merlo" },
    { id: "18-004", nombre: "Juana Koslay" }
  ],
  "19": [ // Santa Cruz
    { id: "19-001", nombre: "Río Gallegos" },
    { id: "19-002", nombre: "Caleta Olivia" },
    { id: "19-003", nombre: "Puerto Deseado" },
    { id: "19-004", nombre: "El Calafate" }
  ],
  "20": [ // Santa Fe
    { id: "20-001", nombre: "Santa Fe" },
    { id: "20-002", nombre: "Rosario" },
    { id: "20-003", nombre: "Venado Tuerto" },
    { id: "20-004", nombre: "Rafaela" },
    { id: "20-005", nombre: "Reconquista" },
    { id: "20-006", nombre: "Santo Tomé" },
    { id: "20-007", nombre: "Villa Gobernador Gálvez" },
    { id: "20-008", nombre: "Esperanza" },
    { id: "20-009", nombre: "Casilda" },
    { id: "20-010", nombre: "Granadero Baigorria" },
    { id: "20-011", nombre: "San Lorenzo" },
    { id: "20-012", nombre: "Gálvez" },
    { id: "20-013", nombre: "Firmat" },
    { id: "20-014", nombre: "Pérez" },
    { id: "20-015", nombre: "Avellaneda" },
    { id: "20-016", nombre: "Cañada de Gómez" },
    { id: "20-017", nombre: "Capitán Bermúdez" },
    { id: "20-018", nombre: "Funes" },
    { id: "20-019", nombre: "Villa Constitución" },
    { id: "20-020", nombre: "Rufino" },
    { id: "20-021", nombre: "San Justo" },
    { id: "20-022", nombre: "Sunchales" },
    { id: "20-023", nombre: "Arroyo Seco" },
    { id: "20-024", nombre: "Roldán" },
    { id: "20-025", nombre: "San Jorge" },
    { id: "20-026", nombre: "Carcarañá" },
    { id: "20-027", nombre: "Villa Cañás" },
    { id: "20-028", nombre: "San Javier" },
    { id: "20-029", nombre: "Las Toscas" },
    { id: "20-030", nombre: "Llambi Campbell" },
    { id: "20-031", nombre: "San Carlos Centro" },
    { id: "20-032", nombre: "San Cristóbal" },
    { id: "20-033", nombre: "Sastre" },
    { id: "20-034", nombre: "Armstrong" },
    { id: "20-035", nombre: "Tostado" },
    { id: "20-036", nombre: "Coronda" },
    { id: "20-037", nombre: "Recreo" },
    { id: "20-038", nombre: "El Trébol" },
    { id: "20-039", nombre: "Las Parejas" }
  ],
  "21": [ // Santiago del Estero
    { id: "21-001", nombre: "Santiago del Estero" },
    { id: "21-002", nombre: "La Banda" },
    { id: "21-003", nombre: "Termas de Río Hondo" },
    { id: "21-004", nombre: "Frías" }
  ],
  "22": [ // Tierra del Fuego
    { id: "22-001", nombre: "Ushuaia" },
    { id: "22-002", nombre: "Río Grande" },
    { id: "22-003", nombre: "Tolhuin" }
  ],
  "23": [ // Tucumán
    { id: "23-001", nombre: "San Miguel de Tucumán" },
    { id: "23-002", nombre: "Yerba Buena" },
    { id: "23-003", nombre: "Concepción" },
    { id: "23-004", nombre: "Monteros" }
  ],
  "24": [ // Ciudad Autónoma de Buenos Aires
    { id: "24-001", nombre: "Retiro" },
    { id: "24-002", nombre: "Recoleta" },
    { id: "24-003", nombre: "Palermo" },
    { id: "24-004", nombre: "San Telmo" },
    { id: "24-005", nombre: "La Boca" },
    { id: "24-006", nombre: "Puerto Madero" },
    { id: "24-007", nombre: "Belgrano" },
    { id: "24-008", nombre: "Flores" }
  ]
};
