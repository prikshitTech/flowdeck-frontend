export interface MentionCandidate {
  id: string;
  name: string;
}

const TRAILING_PUNCTUATION = new Set(['.', ',', '!', '?', ':', ';', ')']);

export function mentionHandle(name: string): string {
  return name.split(' ').filter(Boolean).join('');
}

function words(text: string): string[] {
  return text
    .split('\n')
    .flatMap((line) => line.split(' '))
    .filter(Boolean);
}

function withoutTrailingPunctuation(word: string): string {
  let end = word.length;

  while (end > 0 && TRAILING_PUNCTUATION.has(word[end - 1])) {
    end -= 1;
  }

  return word.slice(0, end);
}

export function findMentionedIds(body: string, candidates: MentionCandidate[]): string[] {
  const tokens = new Set(words(body).map((word) => withoutTrailingPunctuation(word).toLowerCase()));

  return candidates
    .filter((candidate) => tokens.has(`@${mentionHandle(candidate.name).toLowerCase()}`))
    .map((candidate) => candidate.id);
}

export function currentMentionQuery(draft: string): string | null {
  const lastBreak = Math.max(draft.lastIndexOf(' '), draft.lastIndexOf('\n'));
  const word = draft.slice(lastBreak + 1);

  return word.startsWith('@') ? word.slice(1).toLowerCase() : null;
}

export function insertMention(draft: string, candidate: MentionCandidate): string {
  const lastBreak = Math.max(draft.lastIndexOf(' '), draft.lastIndexOf('\n'));

  return `${draft.slice(0, lastBreak + 1)}@${mentionHandle(candidate.name)} `;
}

export function isMentionWord(word: string): boolean {
  return word.startsWith('@') && word.length > 1;
}
