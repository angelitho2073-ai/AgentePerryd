exports.handler = async (event) => {
    if (event.httpMethod !== 'POST') {
        return {
            statusCode: 405,
            body: JSON.stringify({ error: 'Method not allowed' })
        };
    }

    const openAiApiKey = process.env.OPENAI_API_KEY;
    const model = process.env.OPENAI_MODEL || 'gpt-4o-mini';

    try {
        const body = event.body ? JSON.parse(event.body) : {};
        const message = String(body.message || '').trim();
        const history = Array.isArray(body.history) ? body.history : [];
        const context = body.context || {};

        if (!message) {
            return {
                statusCode: 400,
                body: JSON.stringify({ error: 'message is required' })
            };
        }

        if (!openAiApiKey) {
            const base = [
                'Excelente, te puedo ayudar con eso.',
                `Tema detectado: ${context.topic || 'general'}.`,
                `Plazo: ${context.deadline || 'por definir'}.`,
                'Para cotizarte exacto necesito: curso, tipo de trabajo, rubrica y fecha limite.'
            ];

            if (/precio|costo|cuanto/i.test(message)) {
                base.push('El precio varía segun complejidad, cantidad de avances y urgencia de entrega.');
            }

            if (/pago|abono|yape|plin|cerrar|trato|seña|sena/i.test(message)) {
                base.push('Para cerrar el trato, aceptamos Yape o Plin al numero completo +51 932598200.');
            }

            if (/whatsapp|contacto|numero|número/i.test(message)) {
                base.push('Te contacto por WhatsApp para cerrar detalles.');
            }

            return {
                statusCode: 200,
                body: JSON.stringify({ reply: base.join(' '), source: 'fallback-api' })
            };
        }

        const normalizedHistory = history
            .filter((item) => item && (item.role === 'user' || item.role === 'assistant') && typeof item.content === 'string')
            .slice(-6)
            .map((item) => ({ role: item.role, content: item.content.slice(0, 800) }));

        const systemPrompt = [
            'Eres Agente Perry, asesor comercial y academico para universitarios.',
            'Responde en espanol, con tono cercano y profesional.',
            'Objetivo principal: convertir la conversacion en contacto por WhatsApp.',
            'Responde breve: maximo 4 lineas y sin parrafos largos.',
            'Haz preguntas concretas para cotizar: curso, tipo de trabajo, rubrica y fecha limite.',
            'Si preguntan precio, explica que depende de complejidad, rubrica y urgencia; no inventes montos fijos.',
            'Comparte el enlace de WhatsApp solo una vez por conversacion; si ya lo compartiste, no repitas el numero ni el enlace en cada respuesta.',
            'Cuando el cliente quiera cerrar, pagar, abonar o reservar, indica metodos de pago disponibles: Yape o Plin al numero completo +51 932598200.',
            'Cierra con llamada a la accion breve, sin repetir datos innecesarios.',
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
            return {
                statusCode: 502,
                body: JSON.stringify({ error: 'Upstream AI error', details: errText.slice(0, 300) })
            };
        }

        const data = await response.json();
        const reply = data?.choices?.[0]?.message?.content?.trim();

        if (!reply) {
            return {
                statusCode: 502,
                body: JSON.stringify({ error: 'Empty AI reply' })
            };
        }

        return {
            statusCode: 200,
            body: JSON.stringify({ reply, source: 'api' })
        };
    } catch (error) {
        return {
            statusCode: 500,
            body: JSON.stringify({ error: 'Internal server error' })
        };
    }
};
