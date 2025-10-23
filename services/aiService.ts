import { GoogleGenAI, Type, FunctionDeclaration } from "@google/genai";
import { AIResponse, ExtractedImageInfo } from "../types";
import { supabase } from './supabaseClient';

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });

// --- Function Calling for Database Queries (MCP - Master Control Protocol) ---

const allowedTables = [
  'productos', 'ventas', 'clientes', 'proveedores', 'caja', 'detalle_ventas', 
  'historial_canjes', 'ingresos', 'orden_compra', 'promociones', 'usuarios', 
  'categorias', 'cargos', 'productos_canje', 'orden_compra_detalle', 'gastos', 'gastos_categorias',
];

const tenantTables = [
  'productos', 'ventas', 'clientes', 'proveedores', 'caja', 'detalle_ventas',
  'historial_canjes', 'ingresos', 'orden_compra', 'promociones', 'usuarios',
  'categorias', 'productos_canje', 'gastos', 'gastos_categorias',
];


const executeQueryOnDatabase: FunctionDeclaration = {
  name: 'executeQueryOnDatabase',
  description: "Realiza consultas directas y simples con filtros en la base de datos. Ideal para buscar registros específicos o listas filtradas.",
  parameters: {
    type: Type.OBJECT,
    properties: {
      tableName: { type: Type.STRING, description: `La tabla a consultar. Tablas disponibles: ${allowedTables.join(', ')}.` },
      select: { type: Type.STRING, description: "Campos a seleccionar, separados por comas (ej. 'nombre, stock_unid')." },
      filters: {
        type: Type.ARRAY, description: "Array de filtros. Cada filtro es un objeto {column, operator, value}.",
        items: {
          type: Type.OBJECT,
          properties: {
            column: { type: Type.STRING },
            operator: { type: Type.STRING, description: "Operador de Supabase (ej. 'eq', 'gt', 'gte', 'lt', 'lte', 'ilike')." },
            value: { type: Type.STRING }
          }
        }
      },
      orderBy: { type: Type.STRING, description: "Columna para ordenar los resultados." },
      ascending: { type: Type.BOOLEAN, description: "Orden: true para ascendente, false para descendente." },
      limit: { type: Type.INTEGER, description: "Máximo de resultados a devolver (def: 10)." }
    },
    required: ["tableName", "select"]
  },
};

const getFullTableData: FunctionDeclaration = {
  name: 'getFullTableData',
  description: "Obtiene todos los datos de una tabla específica para análisis complejos que requieren cálculos, comparaciones entre columnas o agrupaciones (GROUP BY).",
  parameters: {
    type: Type.OBJECT,
    properties: {
      tableName: {
        type: Type.STRING,
        description: `La tabla de la que se extraerán todos los datos. Tablas disponibles: ${allowedTables.join(', ')}.`,
      },
    },
    required: ["tableName"]
  },
};

const responseSchema = {
    type: Type.OBJECT,
    properties: {
        displayText: {
            type: Type.STRING,
            description: "El texto principal de la respuesta para el usuario. Debe ser amigable y conversacional."
        },
        table: {
            type: Type.OBJECT,
            description: "Datos tabulares para mostrar al usuario, si la consulta lo requiere. Opcional.",
            properties: {
                headers: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING },
                    description: "Un array de strings para las cabeceras de la tabla."
                },
                rows: {
                    type: Type.ARRAY,
                    items: {
                        type: Type.ARRAY,
                        items: {
                            type: Type.STRING,
                        }
                    },
                    description: "Un array de arrays, donde cada array interno es una fila de la tabla. Todos los valores deben ser strings."
                }
            },
            required: ["headers", "rows"]
        },
        suggestions: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
            description: "Un array de 2 a 3 preguntas de seguimiento sugeridas que el usuario podría hacer. Opcional."
        }
    },
    required: ["displayText"]
};

const systemInstruction = `
  Eres GestionFarma AI, un asistente experto y analista de datos para el administrador de una farmacia.
  Tu misión es responder preguntas consultando la base de datos y DEVOLVER SIEMPRE UN OBJETO JSON estructurado según el schema proporcionado.
  La fecha de hoy es ${new Date().toISOString().split('T')[0]}.
  IMPORTANTE: Tu zona horaria operativa es la de Perú (UTC-5). Todas las preguntas y respuestas relacionadas con la hora deben usar esta zona horaria, no UTC.

  **PROTOCOLO DE RESPUESTA JSON:**
  1.  **displayText:** Proporciona siempre un texto introductorio o un resumen en lenguaje natural. Ej: "Aquí tienes los productos con bajo stock:" o "La última venta fue de S/ 50.00."
  2.  **table (Opcional):** Si la consulta devuelve una lista de datos (ventas, productos, etc.), formatea el resultado en este objeto.
      - \`headers\`: Un array con los nombres de las columnas.
      - \`rows\`: Un array de arrays, donde cada array interno representa una fila con los valores correspondientes a las cabeceras. **Todos los valores en las filas deben ser strings.** Formatea fechas a 'DD/MM/YYYY' y valores monetarios a 'S/ XX.XX'.
  3.  **suggestions (Opcional):** Ofrece 2 o 3 preguntas de seguimiento relevantes que el usuario podría hacer a continuación.

  **TUS CAPACIDADES DE ANÁLISIS:**
  Utiliza las herramientas \`executeQueryOnDatabase\` y \`getFullTableData\` para obtener los datos que necesitas para construir la respuesta JSON.
  - Para preguntas complejas (ej. "producto más vendido", "bajo stock"), primero usa \`getFullTableData\` para obtener los datos crudos, analízalos internamente, y luego construye el objeto JSON final con el \`displayText\`, la \`table\` y las \`suggestions\`.
  - **NUNCA** incluyas el JSON crudo de la base de datos en el \`displayText\`. Tu trabajo es procesarlo y presentarlo de forma limpia en la estructura JSON final.

  **ESQUEMA DE DATOS (TABLAS PRINCIPALES):**
  - 'productos': Inventario. Columnas clave: \`nombre\`, \`stock_unid\`, \`f_vencimiento\`, \`unid_pv\`, \`costo_x_unid\`, \`stock_min\`, y \`cont\` (contador de ventas).
  - 'ventas': Registros de ventas. Columnas clave: \`fecha_venta\`, \`total\`, \`cliente\`, \`usuario\`.
  - 'detalle_ventas': Productos específicos vendidos. Columnas: \`venta_id\`, \`producto_nombre\`, \`cantidad\`, \`subtotal\`.
  - ... y todas las demás tablas que conoces.

  **REGLAS DE ORO:**
  - **RESPUESTA SIEMPRE EN JSON.** Cada una de tus respuestas finales al usuario debe ser un objeto JSON que valide con el schema.
  - **ERES UN ANALISTA DE SOLO LECTURA.** No tienes permitido modificar, insertar o eliminar datos. Si te piden eliminar algo, responde en el \`displayText\` del JSON: "Mi función es analizar y consultar la información. No tengo permisos para modificar o eliminar datos por seguridad."
`;

const chat = ai.chats.create({
  model: 'gemini-2.5-flash',
  config: {
    tools: [{ functionDeclarations: [executeQueryOnDatabase, getFullTableData] }],
    systemInstruction: systemInstruction,
    temperature: 0.1,
    responseMimeType: "application/json",
    responseSchema: responseSchema,
  }
});

export const getAIInsight = async (prompt: string, sedeId?: number, empresaId?: number): Promise<AIResponse> => {
  try {
    let result = await chat.sendMessage({ message: prompt });

    // Loop to handle sequential function calls until the model provides a text response.
    while (result.functionCalls && result.functionCalls.length > 0) {
      const functionCalls = result.functionCalls;
      
      // Execute all function calls in parallel.
      const toolExecutionPromises = functionCalls.map(async (call) => {
        const args = call.args;
        let callResponsePayload;

        if (call.name === 'executeQueryOnDatabase') {
          if (typeof args.tableName !== 'string' || !allowedTables.includes(args.tableName)) {
            callResponsePayload = { error: `Acceso denegado a la tabla '${args.tableName}'.` };
          } else {
            let query = supabase.from(args.tableName).select(args.select as string || '*');
            
            if (sedeId && empresaId && tenantTables.includes(args.tableName as string)) {
                query = query.eq('sede_id', sedeId).eq('empresa_id', empresaId);
            }

            if (args.filters && Array.isArray(args.filters)) {
              args.filters.forEach((filter: any) => {
                if (filter.column && filter.operator && filter.value !== undefined) {
                  query = query.filter(filter.column, filter.operator, filter.value);
                }
              });
            }
            if (args.orderBy) {
              query = query.order(args.orderBy as string, { ascending: args.ascending !== false });
            }
            query = query.limit(args.limit as number || 10);
            const { data: dbData, error } = await query;
            callResponsePayload = error ? { error: error.message } : { results: dbData };
          }
        } else if (call.name === 'getFullTableData') {
          if (typeof args.tableName !== 'string' || !allowedTables.includes(args.tableName)) {
            callResponsePayload = { error: `Acceso denegado a la tabla '${args.tableName}'.` };
          } else {
            let query = supabase.from(args.tableName).select('*');
            if (sedeId && empresaId && tenantTables.includes(args.tableName as string)) {
              query = query.eq('sede_id', sedeId).eq('empresa_id', empresaId);
            }
            query = query.limit(1000); // safety limit
            const { data: fullData, error } = await query;
            callResponsePayload = error ? { error: error.message } : { results: fullData };
          }
        } else {
          callResponsePayload = { error: "Acción no soportada." };
        }

        return {
          functionResponse: {
            name: call.name,
            response: callResponsePayload,
          },
        };
      });

      const toolResponseParts = await Promise.all(toolExecutionPromises);
      
      // Send all tool responses back to the model.
      result = await chat.sendMessage({ message: toolResponseParts });
    }

    const responseText = result.text;

    if (!responseText) {
      console.error("AI response text is empty", JSON.stringify(result, null, 2));
      return { displayText: "Lo siento, no pude generar una respuesta. Por favor, intenta de nuevo." };
    }
    
    try {
        const parsedJson = JSON.parse(responseText);
        return parsedJson as AIResponse;
    } catch (e) {
        console.error("AI returned invalid JSON:", responseText);
        return { displayText: `Lo siento, ocurrió un error al procesar la respuesta. Contenido: ${responseText}` };
    }

  } catch (error) {
    console.error("Error in getAIInsight:", error);
    const chatError = error as any;
    if (chatError.message?.includes('SAFETY')) {
        return { displayText: "Tu consulta fue bloqueada por políticas de seguridad. Por favor, reformula tu pregunta."};
    }
    return { displayText: "Lo siento, ocurrió un error al procesar tu solicitud con la IA." };
  }
};

// --- PUBLIC CHATBOT ---

const publicSystemInstruction = `
  Eres un asistente virtual amigable de la farmacia 'GestionFarma'. Tu público son los clientes.
  Tu misión es responder preguntas sobre productos, precios y horarios de atención.
  Horario de atención: Lunes a Sábado de 8:00 AM a 10:00 PM.
  
  **REGLAS DE SEGURIDAD (MUY IMPORTANTE):**
  - **NO PUEDES** revelar información interna como: cantidad de stock, costos de productos, datos de ventas, nombres de empleados, o cualquier otra información que no sea pública.
  - Si te preguntan por stock, responde únicamente si hay o no hay disponibilidad, nunca la cantidad. Puedes asumir que si un producto está en la base de datos, está disponible.
  - **SIEMPRE** debes usar tus herramientas para consultar la base de datos sobre productos. No inventes precios ni información. Si no encuentras un producto, indica que no lo tienes disponible por el momento.
  - **DEBES RESPONDER SIEMPRE EN FORMATO JSON** usando el schema proporcionado.
  - Formatea todos los precios en Soles Peruanos (S/).

  **Tablas y Columnas Permitidas:**
  - Solo puedes consultar la tabla 'productos'.
  - Solo puedes seleccionar las columnas: 'nombre', 'laboratorio', 'principio_activo', 'accion_terapeutica', 'categoria', 'unid_pv', 'blister_pv', 'caja_pv'.
`;

const publicAllowedTables = ['productos'];
const publicAllowedColumns = ['id', 'nombre', 'laboratorio', 'principio_activo', 'accion_terapeutica', 'categoria', 'unid_pv', 'blister_pv', 'caja_pv'];

export const getPublicAIInsight = async (prompt: string): Promise<AIResponse> => {
    const publicChat = ai.chats.create({
        model: 'gemini-2.5-flash',
        config: {
            tools: [{ functionDeclarations: [executeQueryOnDatabase] }],
            systemInstruction: publicSystemInstruction,
            temperature: 0.2,
            responseMimeType: "application/json",
            responseSchema: responseSchema,
        }
    });

    try {
        let result = await publicChat.sendMessage({ message: prompt });

        while (result.functionCalls && result.functionCalls.length > 0) {
            const functionCalls = result.functionCalls;
            const toolExecutionPromises = functionCalls.map(async (call) => {
                const args = call.args;
                let callResponsePayload;

                if (call.name === 'executeQueryOnDatabase') {
                    if (typeof args.tableName !== 'string' || !publicAllowedTables.includes(args.tableName)) {
                        callResponsePayload = { error: `Acceso denegado a la tabla '${args.tableName}'.` };
                    } else {
                        // Security Check: Filter the selected columns
                        const requestedColumns = (args.select as string || '*').split(',').map(c => c.trim());
                        const safeColumns = requestedColumns.filter(col => publicAllowedColumns.includes(col));
                        
                        if (safeColumns.length === 0) {
                            callResponsePayload = { error: "No se solicitaron columnas válidas." };
                        } else {
                            let query = supabase.from(args.tableName).select(safeColumns.join(','));
                            if (args.filters && Array.isArray(args.filters)) {
                                args.filters.forEach((filter: any) => {
                                    if (filter.column && publicAllowedColumns.includes(filter.column) && filter.operator && filter.value !== undefined) {
                                        query = query.filter(filter.column, filter.operator, filter.value);
                                    }
                                });
                            }
                            query = query.limit(args.limit as number || 5);
                            const { data: dbData, error } = await query;
                            callResponsePayload = error ? { error: error.message } : { results: dbData };
                        }
                    }
                } else {
                    callResponsePayload = { error: "Acción no soportada." };
                }

                return { functionResponse: { name: call.name, response: callResponsePayload } };
            });

            const toolResponseParts = await Promise.all(toolExecutionPromises);
            result = await publicChat.sendMessage({ message: toolResponseParts });
        }

        const responseText = result.text;
        if (!responseText) throw new Error("La IA no generó una respuesta de texto.");
        
        const parsedJson = JSON.parse(responseText);
        return parsedJson as AIResponse;

    } catch (error) {
        console.error("Error in getPublicAIInsight:", error);
        return { displayText: "Lo siento, no puedo responder esa pregunta en este momento. Por favor, intenta reformularla." };
    }
};


export const extractProductInfoFromImage = async (base64Image: string): Promise<ExtractedImageInfo> => {
  const cleanBase64 = base64Image.split(',')[1];
  const mimeType = base64Image.substring(base64Image.indexOf(":") + 1, base64Image.indexOf(";"));

  const textPart = {
    text: `Analiza la imagen de este empaque de producto farmacéutico y extrae la siguiente información. Además de los campos estructurados, proporciona una lista de todos los fragmentos de texto individuales que encuentres. Asegúrate de que la fecha de vencimiento esté en formato YYYY-MM-DD.`
  };

  const schema = {
    type: Type.OBJECT,
    properties: {
        nombre: { type: Type.STRING, description: 'El nombre comercial del producto.' },
        laboratorio: { type: Type.STRING, description: 'El nombre del laboratorio o fabricante.' },
        lote: { type: Type.STRING, description: 'El número de lote o partida.' },
        f_vencimiento: { type: Type.STRING, description: 'La fecha de vencimiento en formato YYYY-MM-DD.' },
        principio_activo: { type: Type.STRING, description: 'El principal ingrediente activo.' },
        textos_extraidos: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
            description: 'Una lista de todos los fragmentos de texto individuales extraídos de la imagen.'
        }
    },
    required: ['nombre']
  };

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: { parts: [textPart, { inlineData: { mimeType, data: cleanBase64 } }] },
      config: {
        responseMimeType: "application/json",
        responseSchema: schema,
        temperature: 0.1,
      },
    });

    const parsedResponse = JSON.parse(response.text);
    for (const key in parsedResponse) {
        if (parsedResponse[key] === '') {
            parsedResponse[key] = null;
        }
    }
    return parsedResponse as ExtractedImageInfo;
  } catch (error) {
    console.error("Error extracting product info from image:", error);
    throw new Error("No se pudo extraer la información de la imagen. Inténtalo con una imagen más clara.");
  }
};
