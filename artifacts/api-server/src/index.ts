import app from "./app";
import { ensureDemoAccounts } from "./lib/seed";
import { ensureSystemRoles } from "./routes/roles";

const rawPort = process.env["PORT"];

if (!rawPort) {
  throw new Error(
    "PORT environment variable is required but was not provided.",
  );
}

const port = Number(rawPort);

if (Number.isNaN(port) || port <= 0) {
  throw new Error(`Invalid PORT value: "${rawPort}"`);
}

app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
  void ensureDemoAccounts();
  void ensureSystemRoles();
});
