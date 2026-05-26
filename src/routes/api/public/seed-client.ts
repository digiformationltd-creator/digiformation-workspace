import { createFileRoute } from "@tanstack/react-router";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

export const Route = createFileRoute("/api/public/seed-client")({
  server: {
    handlers: {
      POST: async () => {
        const { data, error } = await supabaseAdmin.auth.admin.createUser({
          email: "zhkj717@gmail.com",
          password: "unitedkingdom123@LTD",
          email_confirm: true,
        });
        if (error) {
          return new Response(JSON.stringify({ error: error.message }), {
            status: 400,
            headers: { "Content-Type": "application/json" },
          });
        }
        return new Response(JSON.stringify({ id: data.user?.id, email: data.user?.email }), {
          headers: { "Content-Type": "application/json" },
        });
      },
    },
  },
});
