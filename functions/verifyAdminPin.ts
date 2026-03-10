import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

Deno.serve(async (req) => {
  try {
    const { pin } = await req.json();
    const correctPin = Deno.env.get("ADMIN_PIN");

    if (!correctPin) {
      return Response.json({ error: "PIN no configurado" }, { status: 500 });
    }

    if (!pin || pin !== correctPin) {
      return Response.json({ success: false }, { status: 401 });
    }

    return Response.json({ success: true });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});