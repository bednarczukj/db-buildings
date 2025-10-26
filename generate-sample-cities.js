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

// Generate sample cities data based on communities
async function generateSampleCities() {
  console.log("🚀 Generating sample cities data");
  console.log("===============================");

  try {
    // Get communities to generate cities for
    const { data: communities, error: communitiesError } = await supabase
      .from("communities")
      .select("code, name, district_code")
      .limit(200); // Generate cities for first 200 communities

    if (communitiesError || !communities) {
      console.error("❌ Error fetching communities:", communitiesError);
      return;
    }

    console.log(`📊 Found ${communities.length} communities to generate cities for`);

    // City name patterns
    const citySuffixes = [
      "ów",
      "y",
      "a",
      "o",
      "ice",
      "sko",
      "no",
      "ówko",
      "ówka",
      "owo",
      "in",
      "yna",
      "burg",
      "stadt",
      "dorf",
      "hausen",
      "heim",
      "tal",
    ];

    const generatedCities = [];
    let cityCounter = 1;

    for (const community of communities) {
      // Generate 1-3 cities per community
      const numCities = Math.floor(Math.random() * 3) + 1;

      for (let i = 0; i < numCities; i++) {
        // Generate unique city code using counter
        const cityCode = `9${cityCounter.toString().padStart(6, "0")}`;

        // Generate city name based on community
        const baseName = community.name.replace("Gmina ", "").replace("Miejscowość ", "").split(" ")[0];
        const suffix = citySuffixes[Math.floor(Math.random() * citySuffixes.length)];
        const cityName = `${baseName}${suffix}`;

        generatedCities.push({
          code: cityCode,
          name: cityName,
          community_code: community.code,
        });

        cityCounter++;
      }
    }

    console.log(`🎯 Generated ${generatedCities.length} cities`);

    // Insert in batches
    const batchSize = 100;
    let inserted = 0;

    for (let i = 0; i < generatedCities.length; i += batchSize) {
      const batch = generatedCities.slice(i, i + batchSize);
      console.log(
        `📦 Inserting batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(generatedCities.length / batchSize)} (${batch.length} cities)...`
      );

      const { error: insertError } = await supabase.from("cities").insert(batch);

      if (insertError) {
        console.error(`❌ Error inserting batch:`, insertError);
        return;
      }

      inserted += batch.length;
    }

    // Final count
    const { count: finalCount } = await supabase.from("cities").select("*", { count: "exact", head: true });

    console.log(`📊 Final count: ${finalCount} cities`);
    console.log(`✅ Successfully added ${inserted} cities`);

    // Show sample cities
    console.log("\n📋 Sample cities:");
    const { data: samples } = await supabase.from("cities").select("code, name, community_code").limit(5);

    samples?.forEach((city) => {
      console.log(`  ${city.code} - ${city.name} [community: ${city.community_code}]`);
    });
  } catch (error) {
    console.error("❌ Unexpected error:", error);
  }

  console.log("\n===============================");
  console.log("🎉 Cities generation completed!");
}

generateSampleCities().catch(console.error);
