async function testKey() {
  const url = "https://dzokmbzmowopfmagsnad.supabase.co/rest/v1/demo_pacientes?select=*&limit=1";
  const key = "sb_publishable_i8f5nyTzo3QoVxPjOujFvQ_UAgHhsIC";

  const res = await fetch(url, {
    method: 'GET',
    headers: {
      'apikey': key,
      'Authorization': `Bearer ${key}`
    }
  });

  const txt = await res.text();
  console.log("Status:", res.status);
  console.log("Body:", txt);
}
testKey();
