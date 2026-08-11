import { unzipSync } from "fflate";

export type ImportedExercise = {
  id: string;
  name: string;
  type: string;
  prescribedSets: number;
  setPrescription: string;
  reps: string;
  rest: string;
  tempo: string;
  notes: string;
};

export type ImportedWorkout = {
  id: string;
  name: string;
  focus: string;
  optional: boolean;
  exercises: ImportedExercise[];
};

export type ProgrammeImport = {
  workouts: ImportedWorkout[];
  exerciseCount: number;
  warnings: string[];
};

type Table = { rows: string[][]; context: string[] };

const textDecoder = new TextDecoder();

function decodeXml(value: string) {
  return value
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&#(\d+);/g, (_, code: string) => String.fromCodePoint(Number(code)))
    .replace(/&#x([0-9a-f]+);/gi, (_, code: string) => String.fromCodePoint(Number.parseInt(code, 16)));
}

function clean(value: string) {
  return decodeXml(value).replace(/\s+/g, " ").trim();
}

function xmlText(xml: string) {
  const pieces = [...xml.matchAll(/<w:t(?:\s[^>]*)?>([\s\S]*?)<\/w:t>/g)].map((match) => match[1]);
  return clean(pieces.join(""));
}

function tableRows(xml: string) {
  return [...xml.matchAll(/<w:tr(?:\s[^>]*)?>([\s\S]*?)<\/w:tr>/g)].map((row) =>
    [...row[1].matchAll(/<w:tc(?:\s[^>]*)?>([\s\S]*?)<\/w:tc>/g)].map((cell) => {
      const paragraphs = [...cell[1].matchAll(/<w:p(?:\s[^>]*)?>([\s\S]*?)<\/w:p>/g)]
        .map((paragraph) => xmlText(paragraph[1]))
        .filter(Boolean);
      return clean(paragraphs.join(" "));
    }),
  );
}

function extractTables(xml: string): Table[] {
  const context: string[] = [];
  const tables: Table[] = [];
  const blocks = xml.match(/<w:tbl(?:\s[^>]*)?>[\s\S]*?<\/w:tbl>|<w:p(?:\s[^>]*)?>[\s\S]*?<\/w:p>/g) ?? [];
  for (const block of blocks) {
    if (block.startsWith("<w:p")) {
      const value = xmlText(block);
      if (value) {
        context.push(value);
        if (context.length > 16) context.shift();
      }
    } else {
      tables.push({ rows: tableRows(block), context: [...context] });
    }
  }
  return tables;
}

function normalized(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

function slug(value: string, fallback: string) {
  const result = normalized(value).replace(/\s+/g, "-").slice(0, 80);
  return result || fallback;
}

function findColumn(headers: string[], aliases: RegExp[]) {
  return headers.findIndex((header) => aliases.some((alias) => alias.test(normalized(header))));
}

function prescribedSetCount(value: string) {
  const match = value.match(/\d+/);
  return Math.max(1, Math.min(12, match ? Number(match[0]) : 3));
}

function isPlaceholder(value: string) {
  const name = normalized(value);
  return !name || /^exercise \d+$/.test(name) || /^movement \d+$/.test(name) || /^exercise$/.test(name) || /^tbd$/.test(name);
}

function workoutContext(context: string[], index: number) {
  const normalizedContext = context.map(normalized);
  let markerIndex = -1;
  for (let contextIndex = normalizedContext.length - 1; contextIndex >= 0; contextIndex -= 1) {
    if (/^(workout|session|day)\s*(\d+|[a-z])\b/.test(normalizedContext[contextIndex])) {
      markerIndex = contextIndex;
      break;
    }
  }
  let name = "";
  if (markerIndex >= 0) {
    const marker = context[markerIndex];
    const inlineName = marker.match(/^(?:workout|session|day)\s*(?:\d+|[a-z])\s*(?:[-:–—|]\s*)?(.+)$/i)?.[1]?.trim();
    const following = context.slice(markerIndex + 1).find((line) => !/^(focus|objective|duration|warm.?up|progression)\s*:/i.test(line));
    name = inlineName || following || marker;
  }
  if (!name) {
    name = [...context].reverse().find((line) => /^(upper|lower|push|pull|legs?|full body|conditioning|recovery|workout|session|day)\b/i.test(line)) || `Workout ${index + 1}`;
  }
  const focusLine = [...context].reverse().find((line) => /^(focus|objective)\s*:/i.test(line));
  const focus = focusLine?.replace(/^(focus|objective)\s*:\s*/i, "") || "Complete the prescribed work with controlled form.";
  return { name: clean(name), focus: clean(focus) };
}

function parseExerciseTable(table: Table, workoutIndex: number): ImportedWorkout[] {
  const headerRowIndex = table.rows.findIndex((row) => {
    const headers = row.map(normalized);
    return headers.some((header) => /^(exercise|movement)$/.test(header)) && headers.some((header) => /^(sets?|working sets?)$/.test(header));
  });
  if (headerRowIndex < 0) return [];

  const headers = table.rows[headerRowIndex];
  const exerciseColumn = findColumn(headers, [/^exercise$/, /^movement$/]);
  const workoutColumn = findColumn(headers, [/^workout$/, /^session$/, /^day$/]);
  const typeColumn = findColumn(headers, [/^type$/, /^role$/]);
  const setsColumn = findColumn(headers, [/^set$/, /^sets$/, /^working sets$/]);
  const repsColumn = findColumn(headers, [/^reps$/, /^rep range$/, /^repetitions$/]);
  const restColumn = findColumn(headers, [/^rest$/, /^rest time$/]);
  const tempoColumn = findColumn(headers, [/^tempo$/]);
  const notesColumn = findColumn(headers, [/^notes$/, /^coaching notes$/, /^cues?$/]);
  if (exerciseColumn < 0 || setsColumn < 0) return [];

  const fallback = workoutContext(table.context, workoutIndex);
  const grouped = new Map<string, ImportedExercise[]>();
  for (const row of table.rows.slice(headerRowIndex + 1)) {
    const name = clean(row[exerciseColumn] || "");
    if (isPlaceholder(name)) continue;
    const groupName = clean((workoutColumn >= 0 ? row[workoutColumn] : "") || fallback.name);
    if (!groupName) continue;
    const setPrescription = clean(row[setsColumn] || "3");
    const exercise: ImportedExercise = {
      id: slug(`${groupName}-${name}`, `exercise-${grouped.size + 1}`),
      name,
      type: clean(typeColumn >= 0 ? row[typeColumn] || "" : ""),
      prescribedSets: prescribedSetCount(setPrescription),
      setPrescription,
      reps: clean(repsColumn >= 0 ? row[repsColumn] || "" : ""),
      rest: clean(restColumn >= 0 ? row[restColumn] || "" : ""),
      tempo: clean(tempoColumn >= 0 ? row[tempoColumn] || "" : ""),
      notes: clean(notesColumn >= 0 ? row[notesColumn] || "" : ""),
    };
    grouped.set(groupName, [...(grouped.get(groupName) ?? []), exercise]);
  }

  return [...grouped.entries()].map(([name, exercises], groupIndex) => ({
    id: slug(name, `workout-${workoutIndex + groupIndex + 1}`),
    name,
    focus: fallback.focus,
    optional: /optional|recovery|conditioning|cardio|mobility/i.test(`${name} ${fallback.focus}`),
    exercises,
  }));
}

export function parseProgrammeDocx(bytes: Uint8Array): ProgrammeImport {
  const archive = unzipSync(bytes);
  const documentXml = archive["word/document.xml"];
  if (!documentXml) throw new Error("This DOCX does not contain a readable training plan.");
  const parsed = extractTables(textDecoder.decode(documentXml)).flatMap(parseExerciseTable);
  const merged = new Map<string, ImportedWorkout>();
  for (const workout of parsed) {
    const key = normalized(workout.name);
    const current = merged.get(key);
    if (current) {
      const seen = new Set(current.exercises.map((exercise) => normalized(exercise.name)));
      current.exercises.push(...workout.exercises.filter((exercise) => !seen.has(normalized(exercise.name))));
    } else if (workout.exercises.length) {
      merged.set(key, workout);
    }
  }
  const workouts = [...merged.values()].slice(0, 14);
  const exerciseCount = workouts.reduce((total, workout) => total + workout.exercises.length, 0);
  return {
    workouts,
    exerciseCount,
    warnings: workouts.length ? [] : ["No completed Exercise / Sets / Reps workout tables were found."],
  };
}
