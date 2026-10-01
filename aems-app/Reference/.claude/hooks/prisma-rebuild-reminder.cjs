#!/usr/bin/env node
// Hook: PostToolUse on Edit|Write. If the edited path is under prisma/prisma/
// (schema.prisma or models/*), remind to rebuild prisma so downstream types
// stay in sync. Advisory only — never blocks.

let raw = "";
process.stdin.setEncoding("utf8");
process.stdin.on("data", (chunk) => (raw += chunk));
process.stdin.on("end", () => {
  try {
    const input = JSON.parse(raw || "{}");
    const filePath = String(input?.tool_input?.file_path || "").replace(/\\/g, "/");
    if (/(^|\/)prisma\/prisma\/(schema\.prisma|models\/)/.test(filePath)) {
      console.log(
        "[reminder] prisma schema/models edited — run `yarn build` in prisma/ " +
          "before typechecking server or client (downstream @local/prisma types come from prisma/dist)."
      );
    }
  } catch {
    // swallow — hook must not fail on bad input
  }
});
