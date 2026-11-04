import { Timestamp } from 'firebase-admin/firestore';

import { itemDocId } from '../shared/item-id.helper';
import briefingJson from '../seed/data/briefing.json';
import notesJson from '../seed/data/notes.json';
import { ISeedBriefing, ISeedNote } from '../seed/seed.interfaces';
import { AnthropicClientService } from './anthropic-client.service';
import { explainConfig } from './brief.constants';
import { IEntryWithText } from './brief.interfaces';
import {
  applyExplanation,
  buildExplainPrompt,
  buildSystemPrompt,
  parseExplainResponse,
  validateExplainResponse,
} from './explain.helper';

function print(line: string): void {
  process.stdout.write(`${line}\n`);
}

function buildSection(
  noteKey: string,
  seedEntries: ISeedBriefing['sections'][number]['entries'],
  note: ISeedNote,
): { section: Afterword.Firestore.Briefing.IBriefingSection; entriesWithText: IEntryWithText[] } {
  const entriesWithText = seedEntries.map((seedEntry): IEntryWithText => ({
    text: seedEntry.text,
    entry: {
      itemId: itemDocId(seedEntry.kind, seedEntry.externalId),
      kind: seedEntry.kind,
      title: seedEntry.title,
      url: seedEntry.url,
      authors: seedEntry.authors,
      publishedAt: Timestamp.fromDate(new Date(seedEntry.publishedAt)),
      rank: seedEntry.rank,
      score: seedEntry.score,
      whyThis: seedEntry.whyThis,
      ...(seedEntry.sourceHandle ? { sourceHandle: seedEntry.sourceHandle } : {}),
    },
  }));

  return {
    section: {
      noteId: `note_${noteKey}`,
      noteSummary: note.summary,
      noteKind: note.kind,
      entries: entriesWithText.map(({ entry }) => entry),
    },
    entriesWithText,
  };
}

async function main(): Promise<void> {
  const apiKey = process.env['ANTHROPIC_API_KEY'];

  if (!apiKey) {
    print('ANTHROPIC_API_KEY is not set, so the live model call was skipped. Set it and run explain:dry again.');

    return;
  }

  const notes = notesJson as ISeedNote[];
  const briefing = briefingJson as unknown as ISeedBriefing;
  const client = new AnthropicClientService();
  const system = buildSystemPrompt();

  print(`Model ${explainConfig.MODEL}, nothing is written to Firestore.`);

  for (const seedSection of briefing.sections) {
    const note = notes.find((candidate) => candidate.key === seedSection.noteKey) as ISeedNote;
    const { section, entriesWithText } = buildSection(seedSection.noteKey, seedSection.entries, note);
    const userContent = buildExplainPrompt(note, entriesWithText);

    print('');
    print(`== ${note.summary}`);

    let explained = false;

    for (let attempt = 1; attempt <= explainConfig.MAX_ATTEMPTS && !explained; attempt++) {
      const completion = await client.complete(apiKey, system, userContent);
      const response = parseExplainResponse(completion.text);
      const problem = response ? validateExplainResponse(response, section) : 'reply was not valid JSON';

      print(
        `attempt ${attempt}: ${completion.inputTokens} in / ${completion.outputTokens} out tokens, ${completion.latencyMs} ms` +
          (problem ? `, rejected: ${problem}` : ''),
      );

      if (response && problem === null) {
        explained = true;

        for (const entry of applyExplanation(section, response).entries) {
          print(`${entry.rank}. [${entry.kind}] ${entry.title}`);
          print(`   why:  ${entry.whyThis}`);
          print(`   note: ${entry.readingNote}`);
        }
      }
    }

    if (!explained) {
      print('No valid explanation, a real run would keep the keyword-match fallback for this section.');
    }
  }
}

main().catch((error: unknown) => {
  process.stderr.write(`Explain dry run failed: ${error instanceof Error ? error.message : String(error)}\n`);
  process.exit(1);
});
