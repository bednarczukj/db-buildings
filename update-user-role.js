import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "http://127.0.0.1:54321";
const supabaseKey =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0";

const supabase = createClient(supabaseUrl, supabaseKey);

async function findUserInfo() {
  const userEmail = "bednarczukj@gmail.com";

  console.log(`Szukanie informacji o użytkowniku ${userEmail}...\n`);

  try {
    // Spróbuj zalogować się jako użytkownik żeby sprawdzić jego dane
    console.log("Próba logowania jako użytkownik...");
    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
      email: userEmail,
      password: "test123", // placeholder - prawdopodobnie nie zadziała bez prawdziwego hasła
    });

    if (signInError && signInError.message !== "Invalid login credentials") {
      console.log("Nie można się zalogować - sprawdzamy inne metody...");
    } else if (signInData?.user) {
      console.log(`✅ Udało się zalogować:`);
      console.log(`   UUID: ${signInData.user.id}`);
      console.log(`   Email: ${signInData.user.email}`);
      return;
    }

    // Sprawdź czy możemy znaleźć użytkownika przez inne metody
    console.log("\nSprawdzanie czy użytkownik istnieje w aplikacji...");

    // Próba sprawdzenia przez API aplikacji
    try {
      const response = await fetch("http://localhost:4321/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: userEmail,
          password: "dummy", // nieistniejące hasło
        }),
      });

      if (response.status === 400) {
        console.log("✅ Użytkownik istnieje w systemie (otrzymano błąd walidacji)");
      } else {
        console.log(`Odpowiedź serwera: ${response.status}`);
      }
    } catch (fetchError) {
      console.log("Serwer nie działa lub nie można połączyć");
    }

    console.log("\n=== INFORMACJE O STRUKTURZE BAZY DANYCH ===");
    console.log("Użytkownik bednarczukj@gmail.com jest zapisany w:");
    console.log("1. Tabela: auth.users (zarządzana przez Supabase Auth)");
    console.log("   - Kolumna: id (UUID)");
    console.log("   - Kolumna: email");
    console.log("   - Kolumna: created_at");
    console.log("   - Kolumna: last_sign_in_at");
    console.log("");
    console.log("2. Tabela: public.profiles (rozszerzenie aplikacji)");
    console.log("   - Kolumna: user_id (UUID, klucz obcy do auth.users.id)");
    console.log("   - Kolumna: role (role_enum: 'READ', 'WRITE', 'ADMIN')");
    console.log("");
    console.log("Aby znaleźć dokładny UUID, potrzebujesz dostępu administratora do Supabase");
    console.log("lub sprawdzić bezpośrednio w bazie danych PostgreSQL.");
  } catch (error) {
    console.error("Błąd ogólny:", error);
  }
}

findUserInfo();
