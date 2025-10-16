import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "http://127.0.0.1:54321";
const supabaseKey =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0";

const supabase = createClient(supabaseUrl, supabaseKey);

async function testValidBuilding() {
  console.log("Testowanie tworzenia budynku z prawidłowymi danymi...\n");

  const buildingData = {
    voivodeship_code: "14", // Mazowieckie
    district_code: "1465", // Warszawa
    community_code: "1465011", // Warszawa
    city_code: "0918123", // Warszawa
    building_number: "123",
    post_code: "00-001",
    location: {
      type: "Point",
      coordinates: [21.0122, 52.2297],
    },
    provider_id: 1,
  };

  console.log("Dane do wysłania:", JSON.stringify(buildingData, null, 2));

  try {
    const response = await fetch("http://localhost:3002/api/v1/buildings", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(buildingData),
    });

    const result = await response.json();

    console.log("Status odpowiedzi:", response.status);
    console.log("Odpowiedź:", JSON.stringify(result, null, 2));

    if (response.ok) {
      console.log("✅ Sukces! Budynek został utworzony.");
    } else {
      console.log("❌ Błąd:", result.error || result.message);
    }
  } catch (error) {
    console.error("Błąd połączenia:", error.message);
  }
}

async function testInvalidBuilding() {
  console.log("\nTestowanie tworzenia budynku z nieprawidłowymi danymi...\n");

  const buildingData = {
    voivodeship_code: "99", // Nieistniejący kod województwa
    district_code: "1465",
    community_code: "1465011",
    city_code: "0918123",
    building_number: "123",
    post_code: "00-001",
    location: {
      type: "Point",
      coordinates: [21.0122, 52.2297],
    },
    provider_id: 1,
  };

  console.log("Dane do wysłania:", JSON.stringify(buildingData, null, 2));

  try {
    const response = await fetch("http://localhost:3002/api/v1/buildings", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(buildingData),
    });

    const result = await response.json();

    console.log("Status odpowiedzi:", response.status);
    console.log("Odpowiedź:", JSON.stringify(result, null, 2));
  } catch (error) {
    console.error("Błąd połączenia:", error.message);
  }
}

async function main() {
  await testValidBuilding();
  await testInvalidBuilding();
}

main();
