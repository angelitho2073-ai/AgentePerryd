exports.handler = async (event) => {
    if (event.httpMethod !== 'POST') {
        return {
            statusCode: 405,
            body: JSON.stringify({ error: 'Method not allowed' })
        };
    }

    const openAiApiKey = process.env.OPENAI_API_KEY;
    const model = process.env.OPENAI_MODEL || 'gpt-4o-mini';

    if (!openAiApiKey) {
        return {
            statusCode: 503,
            body: JSON.stringify({ error: 'OPENAI_API_KEY is not configured' })
        };
    }

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

        const normalizedHistory = history
            .filter((item) => item && (item.role === 'user' || item.role === 'assistant') && typeof item.content === 'string')
            .slice(-6)
            .map((item) => ({ role: item.role, content: item.content.slice(0, 800) }));

        const systemPrompt = [
            'Eres Agente Perry, un asistente virtual de asesoria academica para universitarios.',
            'Responde en espanol con tono profesional, claro y amable.',
            'Da orientacion practica y evita prometer resultados imposibles.',
            'Si el usuario pregunta por precio, explica que depende de rubrica, complejidad y plazo.',
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
                temperature: 0.7,
                max_tokens: 240,
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
