import { createClient } from "@supabase/supabase-js";
import { config } from "dotenv";

// Load local environment variables
config({ path: ".env" });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY || process.env.SUPABASE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("❌ Error: SUPABASE_URL and SUPABASE_ANON_KEY must be set in .env file");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Generate sample buildings data
async function generateSampleBuildings() {
  console.log("🚀 Generating sample buildings data");
  console.log("==================================");

  try {
    // Get existing data to build relationships
    const { data: cities, error: citiesError } = await supabase
      .from("cities")
      .select("code, name, community_code")
      .limit(50); // Get some cities to work with

    const { data: providers, error: providersError } = await supabase.from("providers").select("id, name");

    if (citiesError || providersError || !cities || !providers) {
      console.error("❌ Error fetching reference data:", citiesError || providersError);
      return;
    }

    console.log(`📊 Found ${cities.length} cities and ${providers.length} providers`);

    // Sample building data templates
    const streetNames = [
      "Marszałkowska",
      "Krakowska",
      "Warszawska",
      "Główna",
      "Rynek",
      "Słoneczna",
      "Kościuszki",
      "Mickiewicza",
      "Szkolna",
      "Polna",
      "Leśna",
      "Ogrodowa",
      "Zielona",
      "Kwiatowa",
      "Lipowa",
    ];

    const generatedBuildings = [];
    let buildingCounter = 1;

    // Generate buildings for each city
    for (const city of cities) {
      // Generate 5-15 buildings per city
      const numBuildings = Math.floor(Math.random() * 11) + 5;

      for (let i = 0; i < numBuildings; i++) {
        // Get community and district info for this city
        const { data: community } = await supabase
          .from("communities")
          .select("code, district_code")
          .eq("code", city.community_code)
          .single();

        if (!community) {
          console.log(`Skipping city ${city.code} - no community found`);
          continue;
        }

        const { data: district } = await supabase
          .from("districts")
          .select("code, name, voivodeship_code")
          .eq("code", community.district_code)
          .single();

        if (!district) {
          console.log(`Skipping city ${city.code} - no district found for ${community.district_code}`);
          continue;
        }

        const { data: voivodeship } = await supabase
          .from("voivodeships")
          .select("code, name")
          .eq("code", district.voivodeship_code)
          .single();

        if (!voivodeship) {
          console.log(`Skipping city ${city.code} - no voivodeship found for ${district.voivodeship_code}`);
          continue;
        }

        // Generate building data - ensure uniqueness
        const streetName = streetNames[Math.floor(Math.random() * streetNames.length)];
        const buildingNumber = buildingCounter.toString(); // Use counter to ensure uniqueness
        const postalCode = `${Math.floor(Math.random() * 90) + 10}-${Math.floor(Math.random() * 900) + 100}`;
        const provider = providers[Math.floor(Math.random() * providers.length)];

        // Generate random coordinates (within Poland's bounds)
        const latitude = 49 + Math.random() * 8; // 49-57°N
        const longitude = 14 + Math.random() * 10; // 14-24°E

        generatedBuildings.push({
          voivodeship_code: voivodeship.code,
          voivodeship_name: voivodeship.name,
          district_code: district.code,
          district_name: district.name.replace("powiat ", "").replace("Powiat ", ""),
          community_code: community.code,
          community_name: `Gmina ${city.name}`,
          city_code: city.code,
          city_name: city.name,
          building_number: buildingNumber, // Unique per building
          post_code: postalCode,
          provider_id: provider.id,
          latitude,
          longitude,
          location: null, // Will be computed by trigger
          status: "active",
          created_by: "00000000-0000-0000-0000-000000000000", // System user UUID
          updated_by: "00000000-0000-0000-0000-000000000000", // System user UUID
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });

        buildingCounter++;
      }
    }

    console.log(`🎯 Generated ${generatedBuildings.length} sample buildings`);

    // Insert in batches
    const batchSize = 100;
    let inserted = 0;

    for (let i = 0; i < generatedBuildings.length; i += batchSize) {
      const batch = generatedBuildings.slice(i, i + batchSize);
      console.log(
        `📦 Inserting batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(generatedBuildings.length / batchSize)} (${batch.length} buildings)...`
      );

      const { error: insertError } = await supabase.from("buildings").insert(batch);

      if (insertError) {
        console.error(`❌ Error inserting batch:`, insertError);
        return;
      }

      inserted += batch.length;
    }

    // Final count
    const { count: finalCount } = await supabase.from("buildings").select("*", { count: "exact", head: true });

    console.log(`📊 Final count: ${finalCount} buildings`);
    console.log(`✅ Successfully added ${inserted} buildings`);

    // Show sample buildings
    console.log("\n📋 Sample buildings:");
    const { data: samples } = await supabase.from("buildings").select("city_name, house_number, provider_id").limit(5);

    samples?.forEach((building) => {
      console.log(
        `  ${building.city_name}, ul. ${streetNames[Math.floor(Math.random() * streetNames.length)]} ${building.house_number} - Provider ${building.provider_id}`
      );
    });
  } catch (error) {
    console.error("❌ Unexpected error:", error);
  }

  console.log("\n==================================");
  console.log("🎉 Sample buildings generation completed!");
}

generateSampleBuildings().catch(console.error);
