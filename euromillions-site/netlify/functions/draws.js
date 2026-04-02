// netlify/functions/draws.js
// Ce fichier tourne côté serveur (Netlify) — zéro problème CORS

exports.handler = async function(event, context) {
  try {
    const response = await fetch("https://euromillions.api.pedromealha.dev/v1/draws?limit=50");
    
    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }

    const data = await response.json();

    return {
      statusCode: 200,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Content-Type": "application/json"
      },
      body: JSON.stringify(data)
    };

  } catch (err) {
    return {
      statusCode: 500,
      headers: { "Access-Control-Allow-Origin": "*" },
      body: JSON.stringify({ error: err.message })
    };
  }
};
