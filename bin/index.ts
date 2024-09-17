#!/usr/bin/env node
import { main } from "../src/main";

main().catch((error) => {
  console.error("An unexpected error occurred:", error);
  process.exit(1);
});
