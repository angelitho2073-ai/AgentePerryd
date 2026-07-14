export default async function handler(req, res) {
    if (req.method !== 'POST') {
        res.status(405).json({ error: 'Method not allowed' });
        return;
    }

    const openAiApiKey = process.env.OPENAI_API_KEY;
    const model = process.env.OPENAI_MODEL || 'gpt-4o-mini';

    try {
        const body = typeof req.body === 'string' ? JSON.parse(req.body) : (req.body || {});
        const message = String(body.message || '').trim();
        const history = Array.isArray(body.history) ? body.history : [];
        const context = body.context || {};

        if (!message) {
            res.status(400).json({ error: 'message is required' });
            return;
        }

        if (!openAiApiKey) {
            const base = [
                'Excelente, te puedo ayudar con eso.',
                `Tema detectado: ${context.topic || 'general'}.`,
                'Tambien puedo responder consultas generales de cualquier tema de forma clara y directa.'
            ];

            if (/precio|costo|cuanto/i.test(message)) {
                base.push('Si es una cotizacion academica, el precio varía segun complejidad, cantidad de avances y urgencia de entrega.');
            }

            if (/pago|abono|yape|plin|cerrar|trato|seña|sena/i.test(message)) {
                base.push('Metodo de pago: escanea el QR mostrado en el chat web. Pago a nombre de Kevin Nima; luego manda el vaucher. Para mayor seguridad tuya y la de mi creador, dirigete a: https://wa.me/51932598200?text=Hola%20Agente%20Perry%2C%20te%20mando%20mi%20vaucher%20de%20pago.');
            }

            if (/whatsapp|contacto|numero|número/i.test(message)) {
                base.push('Si deseas, te atiendo por WhatsApp para resolverlo mas rapido.');
            }

            res.status(200).json({
                reply: base.join(' '),
                source: 'fallback-api'
            });
            return;
        }

        const normalizedHistory = history
            .filter((item) => item && (item.role === 'user' || item.role === 'assistant') && typeof item.content === 'string')
            .slice(-6)
            .map((item) => ({ role: item.role, content: item.content.slice(0, 800) }));

        const systemPrompt = [
            'Eres el asistente virtual de Academia Agente Perry: Operacion Excelencia.',
            'Responde en espanol, con tono cercano, profesional y seguro.',
            'Puedes usar humor ligero y emojis moderados para sonar mas humano, sin perder profesionalismo.',
            'Debes poder responder preguntas de cualquier tema (academico o general) con utilidad real.',
            'Si la consulta es academica o de admision, prioriza enfoque de asesoria y orientacion accionable.',
            'Responde breve: maximo 5 lineas y sin parrafos largos.',
            'Si el usuario pide cotizacion academica, solicita datos clave: curso, tipo de trabajo, rubrica y fecha limite.',
            'No repitas textualmente la misma pregunta en mensajes seguidos.',
            'Si falta informacion, pide solo 1 dato faltante por turno y varia la redaccion.',
            'Si el cliente habla de examen: pregunta fecha y hora del examen.',
            'Si el cliente dice que ya esta en examen: pregunta cuanto tiempo le queda.',
            'Si preguntan precio, explica que depende de complejidad, rubrica y urgencia; no inventes montos fijos.',
            'Comparte WhatsApp solo cuando aporte valor (cotizar, cerrar o derivar soporte).',
            'Cuando el cliente pregunte por metodo de pago, responde exactamente esto en 1 o 2 lineas: "Metodo de pago: escanea el QR mostrado en el chat web. Pago a nombre de Kevin Nima; luego manda el vaucher. Para mayor seguridad tuya y la de mi creador, dirigete a: https://wa.me/51932598200?text=Hola%20Agente%20Perry%2C%20te%20mando%20mi%20vaucher%20de%20pago."',
            'Cierra con llamada a la accion solo si corresponde al contexto.',
            'Evita prometer resultados imposibles o notas garantizadas.',
            `Contexto actual del cliente: tema=${context.topic || 'no definido'}, plazo=${context.deadline || 'no definido'}, urgencia=${context.urgency ? 'alta' : 'normal'}.`
        ].join(' ');

        const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${openAiApiKey}`
            },
            body: JSON.stringify({
                model,
                temperature: 0.5,
                max_tokens: 180,
                messages: [
                    { role: 'system', content: systemPrompt },
                    ...normalizedHistory,
                    { role: 'user', content: message.slice(0, 1200) }
                ]
            })
        });

        if (!response.ok) {
            const errText = await response.text();
            res.status(502).json({ error: 'Upstream AI error', details: errText.slice(0, 300) });
            return;
        }

        const data = await response.json();
        const reply = data?.choices?.[0]?.message?.content?.trim();

        if (!reply) {
            res.status(502).json({ error: 'Empty AI reply' });
            return;
        }

        res.status(200).json({ reply, source: 'api' });
    } catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
}
