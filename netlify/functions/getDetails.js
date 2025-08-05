// This is your secure backend function.
// It will live at a URL like: /.netlify/functions/getDetails

exports.handler = async function(event, context) {
    // Only allow POST requests
    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, body: 'Method Not Allowed' };
    }

    try {
        const body = JSON.parse(event.body);
        const restaurantName = body.name;

        if (!restaurantName) {
            return { statusCode: 400, body: 'Restaurant name is required.' };
        }

        // Your secret API key is stored securely as an environment variable on Netlify
        const apiKey = process.env.GOOGLE_API_KEY;

        if (!apiKey) {
             return { statusCode: 500, body: 'API Key not configured on the server.' };
        }

        const prompt = `Generate details for the London restaurant '${restaurantName}'. Provide only a valid JSON object with these exact keys: name, cuisine, cost, rating, whyGo, nonVeg (array), veg (array), maps (URL), insta (URL), lat (number), lng (number), tags (array), and image (a valid, public image URL). If a detail isn't found, use an empty string or array.`;
        
        const payload = {
            contents: [{ role: "user", parts: [{ text: prompt }] }],
            generationConfig: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: "OBJECT",
                    properties: {
                        "name": { "type": "STRING" }, "cuisine": { "type": "STRING" }, "cost": { "type": "STRING" },
                        "rating": { "type": "STRING" }, "whyGo": { "type": "STRING" }, "nonVeg": { "type": "ARRAY", "items": { "type": "STRING" } },
                        "veg": { "type": "ARRAY", "items": { "type": "STRING" } }, "maps": { "type": "STRING" }, "insta": { "type": "STRING" },
                        "lat": { "type": "NUMBER" }, "lng": { "type": "NUMBER" }, "tags": { "type": "ARRAY", "items": { "type": "STRING" } }, "image": { "type": "STRING" }
                    }
                }
            }
        };

        const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-05-20:generateContent?key=${apiKey}`;
        
        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            console.error("Google AI API Error:", await response.text());
            return { statusCode: response.status, body: 'Error from Google AI API.' };
        }

        const result = await response.json();
        
        return {
            statusCode: 200,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(result)
        };

    } catch (error) {
        console.error("Serverless function error:", error);
        return { statusCode: 500, body: JSON.stringify({ error: error.message }) };
    }
};
