/* eslint-disable no-console */
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
  console.log("AI Lookup API called");

  const { user, session } = locals;
  console.log("Auth check:", { hasSession: !!session, hasUser: !!user, userRole: user?.role });

  // 1. Security Check: Allow only WRITE/ADMIN roles
  if (!session || !user || (user.role !== "ADMIN" && user.role !== "WRITE")) {
    console.log("Auth failed:", { session: !!session, user: !!user, role: user?.role });
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  console.log("Auth passed, validating request body");

  // 2. Validate request body
  let body;
  try {
    body = await request.json();
    console.log("Request body:", body);
  } catch (error) {
    console.log("Failed to parse request body:", error);
    return new Response(JSON.stringify({ error: "Invalid JSON in request body" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const validation = requestSchema.safeParse(body);
  console.log("Validation result:", validation.success);

  if (!validation.success) {
    console.log("Validation errors:", validation.error.flatten());
    return new Response(JSON.stringify({ error: "Invalid request body", details: validation.error.flatten() }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const { wojewodztwo, powiat, gmina, miejscowosc, dzielnica, ulica, numer_budynku } = validation.data;
  console.log("Parsed data:", { wojewodztwo, powiat, gmina, miejscowosc });

  // 3. Get OpenRouter API Key
  const openRouterApiKey = process.env.OPENROUTER_API_KEY;
  console.log("API Key check:", { hasKey: !!openRouterApiKey, keyLength: openRouterApiKey?.length });

  // Debug: List all environment variables containing ROUTER
  console.log(
    "Environment variables check:",
    Object.keys(process.env).filter((key) => key.includes("ROUTER") || key.includes("OPEN") || key.includes("API"))
  );

  if (!openRouterApiKey) {
    console.log("API key missing from environment");
    return new Response(
      JSON.stringify({
        error: "AI service is not configured.",
        debug: {
          availableEnvKeys: Object.keys(process.env).filter(
            (key) => key.includes("ROUTER") || key.includes("OPEN") || key.includes("API")
          ),
          hasOpenRouterKey: !!process.env.OPENROUTER_API_KEY,
          hasOpenAiKey: !!process.env.OPENAI_API_KEY,
        },
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
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
    console.log("Making OpenRouter API call...");

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

    console.log("OpenRouter response status:", response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.log("OpenRouter error response:", errorText);
      return new Response(JSON.stringify({ error: "Failed to get data from AI service." }), {
        status: response.status,
        headers: { "Content-Type": "application/json" },
      });
    }

    const aiResult = await response.json();
    console.log("OpenRouter response received successfully");

    const content = aiResult.choices[0]?.message?.content;
    console.log("AI content received:", !!content);

    if (!content) {
      console.log("AI returned empty content");
      return new Response(JSON.stringify({ error: "AI returned an empty response." }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    console.log("Parsing AI content...");
    // 6. Parse and return the result
    const terytData = JSON.parse(content);
    console.log("Parsed TERYT data:", terytData);

    // Ensure all keys are present, defaulting to null if missing
    const assuredTerytData = {
      wojewodztwo_kod: terytData.wojewodztwo_kod || null,
      powiat_kod: terytData.powiat_kod || null,
      gmina_kod: terytData.gmina_kod || null,
      miejscowosc_kod: terytData.miejscowosc_kod || null,
      dzielnica_kod: terytData.dzielnica_kod || null,
      ulica_kod: terytData.ulica_kod || null,
    };

    console.log("Returning successful response with TERYT data");
    return new Response(JSON.stringify({ teryt: assuredTerytData }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Unexpected error in AI lookup:", error);
    return new Response(JSON.stringify({ error: "An unexpected error occurred.", details: error?.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};
