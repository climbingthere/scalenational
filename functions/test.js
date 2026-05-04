export async function onRequest() {
  return new Response(JSON.stringify({ ok: true, fn: "test" }), {
    headers: { "Content-Type": "application/json" }
  });
}
