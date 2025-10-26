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

// Generate comprehensive Polish communities dataset
// This script creates realistic community data based on districts
async function generatePolishCommunities() {
  console.log("🚀 Generating comprehensive Polish communities dataset");
  console.log("==================================================");

  try {
    // First, get all districts to generate communities for
    const { data: districts, error: districtError } = await supabase
      .from("districts")
      .select("code, name, voivodeship_code")
      .order("code");

    if (districtError) {
      console.error("❌ Error fetching districts:", districtError);
      return;
    }

    console.log(`📊 Found ${districts.length} districts to generate communities for`);

    // Community types and their distribution
    const communityTypes = [
      { id: 1, type: "miejska", weight: 0.15 }, // 15% urban
      { id: 2, type: "miejsko-wiejska", weight: 0.35 }, // 35% urban-rural
      { id: 3, type: "wiejska", weight: 0.5 }, // 50% rural
    ];

    // Generate communities for each district
    const generatedCommunities = [];
    let communityCounter = 1;

    for (const district of districts) {
      // Generate 5-15 communities per district (realistic distribution)
      const numCommunities = Math.floor(Math.random() * 11) + 5; // 5-15

      for (let i = 0; i < numCommunities; i++) {
        // Select community type based on weights
        const random = Math.random();
        let selectedType = communityTypes[0];
        let cumulativeWeight = 0;

        for (const type of communityTypes) {
          cumulativeWeight += type.weight;
          if (random <= cumulativeWeight) {
            selectedType = type;
            break;
          }
        }

        // Generate community code (7 digits: district_code + 3 digits)
        const communityCode = `${district.code}${(communityCounter % 1000).toString().padStart(3, "0")}`;

        // Generate realistic community name based on district
        const nameSuffixes = {
          miejska: ["Miasto", "Centrum", district.name.split(" ")[0]],
          "miejsko-wiejska": ["Gmina", "Kompleks", "Ośrodek"],
          wiejska: ["Wieś", "Sioło", "Osada", "Kolonia"],
        };

        const suffixes = nameSuffixes[selectedType.type] || ["Miejscowość"];
        const suffix = suffixes[Math.floor(Math.random() * suffixes.length)];
        const communityName = `${suffix} ${district.name.split(" ")[0]} ${String.fromCharCode(65 + (communityCounter % 26))}`;

        generatedCommunities.push({
          code: communityCode,
          name: communityName.trim(),
          type_id: selectedType.id,
          type: selectedType.type,
          district_code: district.code,
        });

        communityCounter++;
      }
    }

    console.log(`🎯 Generated ${generatedCommunities.length} communities`);

    // Check current count
    const { count: currentCount } = await supabase.from("communities").select("*", { count: "exact", head: true });

    // Clear existing communities
    console.log("🧹 Clearing existing communities...");
    await supabase.from("communities").delete().neq("code", "0000000");

    // Insert in batches
    const batchSize = 100;
    let inserted = 0;

    for (let i = 0; i < generatedCommunities.length; i += batchSize) {
      const batch = generatedCommunities.slice(i, i + batchSize);
      console.log(
        `📦 Inserting batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(generatedCommunities.length / batchSize)} (${batch.length} communities)...`
      );

      const { error: insertError } = await supabase.from("communities").insert(batch);

      if (insertError) {
        console.error(`❌ Error inserting batch:`, insertError);
        return;
      }

      inserted += batch.length;
    }

    // Final count
    const { count: finalCount } = await supabase.from("communities").select("*", { count: "exact", head: true });

    console.log(`📊 Final count: ${finalCount} communities`);
    console.log(`✅ Successfully added ${finalCount - (currentCount || 0)} communities`);

    // Show distribution by type
    console.log("\n📈 Communities by type:");
    const typeStats = {};
    generatedCommunities.forEach((c) => {
      typeStats[c.type] = (typeStats[c.type] || 0) + 1;
    });

    Object.entries(typeStats)
      .sort(([, a], [, b]) => b - a)
      .forEach(([type, count]) => {
        console.log(`  ${type}: ${count} communities`);
      });

    // Show sample
    console.log("\n📋 Sample communities:");
    const samples = generatedCommunities.slice(0, 10);
    samples.forEach((c) => {
      console.log(`  ${c.code} - ${c.name} (${c.type}) [district: ${c.district_code}]`);
    });
  } catch (error) {
    console.error("❌ Unexpected error:", error);
  }

  console.log("\n==================================================");
  console.log("🎉 Community generation completed!");
  console.log("\n💡 Note: This generates realistic synthetic data.");
  console.log("   For production, use official TERYT data from:");
  console.log("   https://eteryt.stat.gov.pl");
}

generatePolishCommunities().catch(console.error);
