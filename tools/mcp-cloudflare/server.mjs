import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { readFile } from "node:fs/promises";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const execFileAsync = promisify(execFile);

async function runWrangler(args, cwd = process.cwd()) {
  const { stdout, stderr } = await execFileAsync("npx", ["wrangler", ...args], {
    cwd,
    env: process.env,
    maxBuffer: 1024 * 1024 * 10,
  });

  return [stdout, stderr].filter(Boolean).join("\n").trim();
}

async function runSupabase(args, cwd = process.cwd(), extraEnv = {}) {
  const env = { ...process.env, ...extraEnv };
  const { stdout, stderr } = await execFileAsync("npx", ["supabase", ...args], {
    cwd,
    env,
    maxBuffer: 1024 * 1024 * 10,
  });

  return [stdout, stderr].filter(Boolean).join("\n").trim();
}

const server = new Server(
  {
    name: "kbouffe-cloudflare-mcp",
    version: "0.1.0",
  },
  {
    capabilities: {
      tools: {},
    },
  }
);


server.setRequestHandler(ListToolsRequestSchema, async () => {
  const tools = [
    {
      name: "cf_workers_deploy",
      description: "Deploy the current worker using wrangler deploy",
      inputSchema: {
        type: "object",
        properties: {
          cwd: { type: "string", description: "Working directory (default: process cwd)" },
        },
      },
    },
    {
      name: "cf_r2_bucket_create",
      description: "Create an R2 bucket",
      inputSchema: {
        type: "object",
        properties: {
          bucketName: { type: "string" },
          cwd: { type: "string" },
        },
        required: ["bucketName"],
      },
    },
    {
      name: "cf_r2_bucket_list",
      description: "List R2 buckets",
      inputSchema: {
        type: "object",
        properties: {
          cwd: { type: "string" },
        },
      },
    },
    {
      name: "cf_provision_supabase_tenant",
      description: "Apply tenant schema to Supabase project and register tenant",
      inputSchema: {
        type: "object",
        properties: {
          restaurantSlug: { type: "string", description: "Unique slug for the restaurant" },
          supabaseUrl: { type: "string", description: "https://<project>.supabase.co" },
          serviceRoleKey: { type: "string", description: "Supabase service role key (kept secret)" },
          cwd: { type: "string" },
        },
        required: ["restaurantSlug", "supabaseUrl", "serviceRoleKey"],
      },
    },
    {
      name: "cf_secret_put",
      description: "Set a Worker secret (interactive value via env var)",
      inputSchema: {
        type: "object",
        properties: {
          key: { type: "string" },
          value: { type: "string" },
          cwd: { type: "string" },
        },
        required: ["key", "value"],
      },
    },
  ];

  return { tools };
});

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args = {} } = request.params;

  try {
    if (name === "cf_workers_deploy") {
      const output = await runWrangler(["deploy"], args.cwd);
      return { content: [{ type: "text", text: output }] };
    }

    if (name === "cf_r2_bucket_create") {
      const output = await runWrangler(["r2", "bucket", "create", args.bucketName], args.cwd);
      return { content: [{ type: "text", text: output }] };
    }

    if (name === "cf_r2_bucket_list") {
      const output = await runWrangler(["r2", "bucket", "list"], args.cwd);
      return { content: [{ type: "text", text: output }] };
    }

    if (name === "cf_provision_supabase_tenant") {
      // Attempt to apply the tenant schema to the Supabase project using the
      // Supabase CLI. This requires the `supabase` CLI to be available via npx
      // and the service role key to be provided. We derive the project ref
      // from the supabase URL and call `supabase db push --file`.

      const { restaurantSlug, supabaseUrl, serviceRoleKey } = args;
      if (!restaurantSlug || !supabaseUrl || !serviceRoleKey) {
        return {
          content: [{ type: "text", text: "Missing required args: restaurantSlug, supabaseUrl, serviceRoleKey" }],
          isError: true,
        };
      }

      const schemaPath = join(__dirname, "../../packages/db/migrations/0002_restaurant_tenant.sql");

      // extract project ref from https://<ref>.supabase.co
      let projectRef;
      try {
        const u = new URL(supabaseUrl);
        projectRef = u.hostname.split(".")[0];
      } catch (e) {
        projectRef = null;
      }

      const suggestedDbId = `supabase:${restaurantSlug}`;

      try {
        const extraEnv = {
          SUPABASE_SERVICE_ROLE_KEY: serviceRoleKey,
          SUPABASE_ACCESS_TOKEN: serviceRoleKey,
        };

        const pushArgs = ["db", "push", "--file", schemaPath];
        if (projectRef) pushArgs.push("--project-ref", projectRef);

        const output = await runSupabase(pushArgs, args.cwd, extraEnv);

        return {
          content: [
            {
              type: "text",
              text: `✅ Attempted to apply tenant schema to Supabase.\n\nSupabase project: ${supabaseUrl}\nRestaurant slug: ${restaurantSlug}\nSuggested tenant id: ${suggestedDbId}\n\nCLI output:\n${output}\n\nNext: register the tenant in your Global Index (D1) with provider='supabase':\nINSERT INTO tenant_databases (id, restaurant_id, db_name, db_id, provider, status) VALUES ('<uuid>', '<restaurant_id>', 'supabase', '${suggestedDbId}', 'supabase', 'active');`,
            },
          ],
        };
      } catch (err) {
        return {
          content: [{ type: "text", text: `Supabase CLI failed: ${err instanceof Error ? err.message : String(err)}` }],
          isError: true,
        };
      }
    }

    if (name === "cf_secret_put") {
      const output = await runWrangler(
        ["secret", "put", args.key, "--text", args.value],
        args.cwd
      );
      return { content: [{ type: "text", text: output }] };
    }

    return {
      content: [{ type: "text", text: `Unknown tool: ${name}` }],
      isError: true,
    };
  } catch (error) {
    return {
      content: [
        {
          type: "text",
          text: error instanceof Error ? error.message : String(error),
        },
      ],
      isError: true,
    };
  }
});

const transport = new StdioServerTransport();
await server.connect(transport);
