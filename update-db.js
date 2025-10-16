import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "http://127.0.0.1:54321";
const supabaseKey =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0";

const supabase = createClient(supabaseUrl, supabaseKey);

async function updateDatabase() {
  console.log("Aktualizowanie bazy danych...\n");

  try {
    // Dodaj powiat 1417 (Mazowieckie)
    console.log("Dodawanie powiatu 1417...");
    const { error: districtError } = await supabase.from("districts").insert({
      code: "1417",
      name: "Powiat testowy",
      voivodeship_code: "14",
    });

    if (districtError) {
      console.error("Błąd dodawania powiatu:", districtError);
    } else {
      console.log("✅ Powiat 1417 dodany");
    }

    // Dodaj gminę 1417052 (powiat 1417)
    console.log("Dodawanie gminy 1417052...");
    const { error: communityError } = await supabase.from("communities").insert({
      code: "1417052",
      name: "Gmina testowa",
      type_id: 1,
      type: "miejska",
      district_code: "1417",
    });

    if (communityError) {
      console.error("Błąd dodawania gminy:", communityError);
    } else {
      console.log("✅ Gmina 1417052 dodana");
    }

    // Dodaj miejscowość 0674922 (gmina 1417052)
    console.log("Dodawanie miejscowości 0674922...");
    const { error: cityError } = await supabase.from("cities").insert({
      code: "0674922",
      name: "Miejscowość testowa",
      community_code: "1417052",
    });

    if (cityError) {
      console.error("Błąd dodawania miejscowości:", cityError);
    } else {
      console.log("✅ Miejscowość 0674922 dodana");
    }

    console.log("\nSprawdzanie dodanych danych...");

    // Sprawdź powiat
    const { data: district } = await supabase.from("districts").select("*").eq("code", "1417").single();
    console.log("Powiat 1417:", district);

    // Sprawdź gminę
    const { data: community } = await supabase.from("communities").select("*").eq("code", "1417052").single();
    console.log("Gmina 1417052:", community);

    // Sprawdź miejscowość
    const { data: city } = await supabase.from("cities").select("*").eq("code", "0674922").single();
    console.log("Miejscowość 0674922:", city);
  } catch (error) {
    console.error("Błąd:", error);
  }
}

updateDatabase();
