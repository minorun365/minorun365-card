#!/usr/bin/env node
import { renderCard } from './card.js';

renderCard().catch((err) => {
  process.stderr.write(String(err) + '\n');
  process.exit(1);
});
