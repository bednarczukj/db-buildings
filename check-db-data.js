import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "http://127.0.0.1:54321";
const supabaseKey =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0";

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkData() {
  console.log("Sprawdzanie danych w bazie...\n");

  try {
    // Województwa
    console.log("WOJEWÓDZTWA:");
    const { data: voivodeships, error: vError } = await supabase
      .from("voivodeships")
      .select("code, name")
      .order("code");

    if (vError) {
      console.error("Błąd:", vError);
    } else {
      voivodeships.forEach((v) => console.log(`  ${v.code} - ${v.name}`));
    }

    // Powiaty
    console.log("\nPOWIATY:");
    const { data: districts, error: dError } = await supabase
      .from("districts")
      .select("code, name, voivodeship_code")
      .order("code");

    if (dError) {
      console.error("Błąd:", dError);
    } else {
      districts.forEach((d) => console.log(`  ${d.code} - ${d.name} (${d.voivodeship_code})`));
    }

    // Gminy
    console.log("\nGMINY:");
    const { data: communities, error: cError } = await supabase
      .from("communities")
      .select("code, name, district_code")
      .order("code");

    if (cError) {
      console.error("Błąd:", cError);
    } else {
      communities.forEach((c) => console.log(`  ${c.code} - ${c.name} (${c.district_code})`));
    }

    // Miejscowości
    console.log("\nMIEJSCOWOŚCI:");
    const { data: cities, error: ciError } = await supabase
      .from("cities")
      .select("code, name, community_code")
      .order("code");

    if (ciError) {
      console.error("Błąd:", ciError);
    } else {
      cities.forEach((c) => console.log(`  ${c.code} - ${c.name} (${c.community_code})`));
    }

    // Dostawcy
    console.log("\nDOSTAWCY:");
    const { data: providers, error: pError } = await supabase.from("providers").select("id, name").order("id");

    if (pError) {
      console.error("Błąd:", pError);
    } else {
      providers.forEach((p) => console.log(`  ${p.id} - ${p.name}`));
    }
  } catch (error) {
    console.error("Błąd ogólny:", error);
  }
}

checkData();
