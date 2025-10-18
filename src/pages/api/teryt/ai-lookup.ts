import type { APIRoute } from "astro";
import { z } from "zod";

export const prerender = false;

const requestSchema = z.object({
  wojewodztwo: z.string().min(1, "Województwo jest wymagane"),
  powiat: z.string().min(1, "Powiat jest wymagany"),
  gmina: z.string().min(1, "Gmina jest wymagana"),
  miejscowosc: z.string().min(1, "Miejscowość jest wymagana"),
  dzielnica: z.string().optional(),
  ulica: z.string().optional(),
  numer_budynku: z.string().optional(),
});

export const POST: APIRoute = async ({ request, locals }) => {
  const { user, session } = locals;

  // 1. Security Check: Allow only WRITE/ADMIN roles
  if (!session || !user || (user.role !== "ADMIN" && user.role !== "WRITE")) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  // 2. Validate request body
  const body = await request.json();
  const validation = requestSchema.safeParse(body);

  if (!validation.success) {
    return new Response(JSON.stringify({ error: "Invalid request body", details: validation.error.flatten() }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const { wojewodztwo, powiat, gmina, miejscowosc, dzielnica, ulica, numer_budynku } = validation.data;

  // 3. Get OpenRouter API Key
  const openRouterApiKey = import.meta.env.OPENROUTER_API_KEY;
  if (!openRouterApiKey) {
    console.error("OPENROUTER_API_KEY is not set in environment variables.");
    return new Response(JSON.stringify({ error: "AI service is not configured." }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }

  // 4. Construct AI Prompt
  const promptParts = [
    `Na podstawie oficjalnych danych TERYT GUS, podaj kody TERYT dla następującej lokalizacji w Polsce:`,
    `- Województwo: ${wojewodztwo}`,
    `- Powiat: ${powiat}`,
    `- Gmina: ${gmina}`,
    `- Miejscowość: ${miejscowosc}`,
  ];
  if (dzielnica) promptParts.push(`- Dzielnica/Część miejscowości: ${dzielnica}`);
  if (ulica) promptParts.push(`- Ulica: ${ulica}`);
  if (numer_budynku) promptParts.push(`- Numer budynku: ${numer_budynku}`);

  promptParts.push(
    `Twoim zadaniem jest zwrócić kody TERYT dla podanej lokalizacji zgodnie z systemem TERYT. Odpowiedź musi być wyłącznie w formacie JSON.`,
    `Struktura JSON-a musi zawierać następujące klucze: "wojewodztwo_kod", "powiat_kod", "gmina_kod", "miejscowosc_kod", "dzielnica_kod", "ulica_kod".`,
    `Pole "dzielnica_kod" dotyczy tylko 5 miast w Polsce: Warszawy, Krakowa, Łodzi, Poznania i Wrocławia. Dla innych lokalizacji zwróć null.`,
    `Jeśli dla danego pola nie można znaleźć kodu (np. brak ulicy), zwróć dla tego klucza wartość null. Nie pomijaj żadnych kluczy.`,
    `Przykład poprawnej odpowiedzi dla Warszawy: {"wojewodztwo_kod":"14","powiat_kod":"1465","gmina_kod":"1465011","miejscowosc_kod":"0918123","dzielnica_kod":"0988833","ulica_kod":"00034"}`,
    `Przykład poprawnej odpowiedzi bez dzielnicy: {"wojewodztwo_kod":"02","powiat_kod":"0201","gmina_kod":"020101_1","miejscowosc_kod":"0952082","dzielnica_kod":null,"ulica_kod":null}`
  );

  const prompt = promptParts.join("\n");

  try {
    // 5. Query OpenRouter AI
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${openRouterApiKey}`,
        "HTTP-Referer": request.headers.get("referer") || "http://localhost:4321",
        "X-Title": "Baza Budynków Polski",
      },
      body: JSON.stringify({
        model: "openai/gpt-4o",
        messages: [{ role: "user", content: prompt }],
        response_format: { type: "json_object" },
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Error from OpenRouter:", response.status, errorText);
      return new Response(JSON.stringify({ error: "Failed to get data from AI service." }), {
        status: response.status,
        headers: { "Content-Type": "application/json" },
      });
    }

    const aiResult = await response.json();
    const content = aiResult.choices[0]?.message?.content;

    if (!content) {
      console.error("No content in AI response:", aiResult);
      return new Response(JSON.stringify({ error: "AI returned an empty response." }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    // 6. Parse and return the result
    const terytData = JSON.parse(content);

    // Ensure all keys are present, defaulting to null if missing
    const assuredTerytData = {
      wojewodztwo_kod: terytData.wojewodztwo_kod || null,
      powiat_kod: terytData.powiat_kod || null,
      gmina_kod: terytData.gmina_kod || null,
      miejscowosc_kod: terytData.miejscowosc_kod || null,
      dzielnica_kod: terytData.dzielnica_kod || null,
      ulica_kod: terytData.ulica_kod || null,
    };

    return new Response(JSON.stringify({ teryt: assuredTerytData }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error calling OpenRouter or parsing response:", error);
    return new Response(JSON.stringify({ error: "An unexpected error occurred." }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};
