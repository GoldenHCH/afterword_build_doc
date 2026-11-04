import { emailConfig, emailCopy, emailErrors, emailKindLabels, emailTheme } from './email.constants';
import { IEmailRecipient, IRenderedEmail } from './email.interfaces';

type Briefing = Afterword.Firestore.Briefing.IBriefing;
type Section = Afterword.Firestore.Briefing.IBriefingSection;
type Entry = Afterword.Firestore.Briefing.IBriefingEntry;

const bodyStyle = `font:17px/26px ${emailTheme.BODY_FONT};color:${emailTheme.TEXT};`;
const mutedStyle = `font:15px/22px ${emailTheme.BODY_FONT};color:${emailTheme.MUTED};`;
const linkStyle = `color:${emailTheme.LINK};text-decoration:underline;`;
const headingStyle = `font:bold 19px/25px ${emailTheme.HEADING_FONT};color:${emailTheme.TEXT};margin:0;`;

export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export function safeUrl(url: string): string {
  return /^https?:\/\//i.test(url.trim()) ? url.trim() : emailConfig.APP_URL;
}

export function formatDate(date: Date): string {
  return `${date.getUTCDate()} ${emailCopy.MONTHS[date.getUTCMonth()]} ${date.getUTCFullYear()}`;
}

export function formatAuthors(authors: string[]): string {
  const shown = authors.slice(0, emailConfig.MAX_AUTHORS).join(', ');

  return authors.length > emailConfig.MAX_AUTHORS ? `${shown} ${emailCopy.ET_AL}` : shown;
}

export function formatByline(entry: Entry): string {
  if (entry.kind === 'post') {
    return entry.sourceHandle ? `@${entry.sourceHandle.replace(/^@/, '')}` : formatAuthors(entry.authors);
  }

  return formatAuthors(entry.authors);
}

export function kindLabel(noteKind: Section['noteKind']): string {
  return emailKindLabels[noteKind.toUpperCase() as keyof typeof emailKindLabels] ?? noteKind;
}

export function shortenSummary(summary: string, maxLength: number): string {
  const cleaned = summary.trim().replace(/\s+/g, ' ').replace(/[.!?\s]+$/, '');

  if (cleaned.length <= maxLength) {
    return cleaned;
  }

  const cut = cleaned.slice(0, maxLength - 1);
  const lastSpace = cut.lastIndexOf(' ');
  const atWord = lastSpace > maxLength / 2 ? cut.slice(0, lastSpace) : cut;

  return `${atWord.replace(/[,;:\s-]+$/, '')}${emailCopy.ELLIPSIS}`;
}

export function countEntries(briefing: Briefing): number {
  return briefing.sections.reduce((total, section) => total + section.entries.length, 0);
}

export function buildSubject(briefing: Briefing): string {
  const total = countEntries(briefing);
  const first = briefing.sections[0];
  const quoted = first ? ` for "${shortenSummary(first.noteSummary, emailConfig.MAX_SUBJECT_SUMMARY_LENGTH)}"` : '';
  const moreCount = Math.max(briefing.sections.length - 1, 0);
  const more = moreCount > 0 ? ` and ${moreCount} ${moreCount === 1 ? emailCopy.MORE_NOTE : emailCopy.MORE_NOTES}` : '';

  return `${emailCopy.SUBJECT_PREFIX}: ${total}${quoted}${more}`;
}

export function buildSaveUrl(briefing: Briefing, itemId: string, appUrl: string): string {
  if (!briefing.id) {
    return appUrl;
  }

  return `${appUrl}/briefings/${encodeURIComponent(briefing.id)}?save=${encodeURIComponent(itemId)}`;
}

export function firstName(displayName: string): string {
  return displayName.trim().split(/\s+/)[0] || emailCopy.FALLBACK_NAME;
}

export function sortedEntries(section: Section): Entry[] {
  return [...section.entries].sort((left, right) => left.rank - right.rank);
}

export function describeProviderError(statusCode: number | undefined, providerMessage: string | undefined): string {
  if (statusCode === 401 || statusCode === 403) {
    return emailErrors.PROVIDER_AUTH;
  }

  if (statusCode === 429) {
    return emailErrors.PROVIDER_RATE_LIMITED;
  }

  const detail = providerMessage ? ` (${providerMessage.replace(/\s+/g, ' ').trim().replace(/[.\s]+$/, '')})` : '';

  return `${emailErrors.PROVIDER_REJECTED}${detail}`;
}

function renderEntryHtml(briefing: Briefing, entry: Entry, appUrl: string): string {
  const byline = formatByline(entry);
  const meta = [byline, formatDate(entry.publishedAt.toDate())].filter(Boolean).map(escapeHtml).join(' &middot; ');
  const readingNote = entry.readingNote
    ? `<p style="margin:6px 0 0 0;${mutedStyle}font-style:italic;">${escapeHtml(entry.readingNote)}</p>`
    : '';

  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:0 0 22px 0;">
<tr>
<td width="32" valign="top" style="width:32px;${headingStyle}color:${emailTheme.ACCENT};">${entry.rank}</td>
<td valign="top" style="${bodyStyle}">
<a href="${escapeHtml(safeUrl(entry.url))}" style="font:bold 17px/24px ${emailTheme.BODY_FONT};${linkStyle}">${escapeHtml(entry.title)}</a>
<p style="margin:2px 0 0 0;${mutedStyle}">${meta}</p>
<p style="margin:8px 0 0 0;${bodyStyle}">${escapeHtml(entry.whyThis)}</p>
${readingNote}
<p style="margin:8px 0 0 0;${mutedStyle}"><a href="${escapeHtml(buildSaveUrl(briefing, entry.itemId, appUrl))}" style="font-weight:bold;${linkStyle}">${emailCopy.SAVE}</a></p>
</td>
</tr>
</table>`;
}

function renderSectionHtml(briefing: Briefing, section: Section, appUrl: string): string {
  const entries = sortedEntries(section)
    .map((entry) => renderEntryHtml(briefing, entry, appUrl))
    .join('\n');

  return `<tr>
<td style="padding:28px 32px 0 32px;">
<p style="margin:0 0 4px 0;${mutedStyle}text-transform:uppercase;letter-spacing:0.5px;font-size:13px;line-height:18px;">${escapeHtml(kindLabel(section.noteKind))}</p>
<h2 style="${headingStyle}margin-bottom:16px;">${escapeHtml(section.noteSummary)}</h2>
${entries}
</td>
</tr>`;
}

function renderHtml(briefing: Briefing, recipient: IEmailRecipient, appUrl: string, subject: string): string {
  const total = countEntries(briefing);
  const sections = briefing.sections.map((section) => renderSectionHtml(briefing, section, appUrl)).join('\n');

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${escapeHtml(subject)}</title>
</head>
<body style="margin:0;padding:0;background:${emailTheme.PAGE_BACKGROUND};">
<div style="display:none;max-height:0;overflow:hidden;opacity:0;">${total} ${emailCopy.PREHEADER_SUFFIX}</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:${emailTheme.PAGE_BACKGROUND};">
<tr>
<td align="center" style="padding:24px 12px;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="width:100%;max-width:600px;background:${emailTheme.CARD_BACKGROUND};border-top:3px solid ${emailTheme.ACCENT};text-align:left;">
<tr>
<td style="padding:24px 32px 0 32px;${headingStyle}">${escapeHtml(emailCopy.BRAND)}</td>
</tr>
<tr>
<td style="padding:16px 32px 0 32px;${bodyStyle}">
<p style="margin:0 0 8px 0;${bodyStyle}">Hi ${escapeHtml(firstName(recipient.displayName))},</p>
<p style="margin:0;${bodyStyle}">${escapeHtml(emailCopy.GREETING_LEAD)}</p>
</td>
</tr>
${sections}
<tr>
<td style="padding:8px 32px 0 32px;"><hr style="border:0;border-top:1px solid ${emailTheme.RULE};margin:0;"></td>
</tr>
<tr>
<td style="padding:16px 32px 28px 32px;${mutedStyle}">
<p style="margin:0 0 8px 0;${mutedStyle}">${escapeHtml(emailCopy.FOOTER_SOLVED)}</p>
<p style="margin:0;${mutedStyle}"><a href="${escapeHtml(appUrl)}" style="${linkStyle}">${escapeHtml(emailCopy.OPEN_APP)}</a></p>
</td>
</tr>
</table>
</td>
</tr>
</table>
</body>
</html>
`;
}

function renderEntryText(briefing: Briefing, entry: Entry, appUrl: string): string {
  const meta = [formatByline(entry), formatDate(entry.publishedAt.toDate())].filter(Boolean).join(' | ');
  const lines = [`${entry.rank}. ${entry.title}`, `   ${meta}`, `   ${safeUrl(entry.url)}`, `   ${entry.whyThis}`];

  if (entry.readingNote) {
    lines.push(`   ${entry.readingNote}`);
  }

  lines.push(`   ${emailCopy.SAVE}: ${buildSaveUrl(briefing, entry.itemId, appUrl)}`);

  return lines.join('\n');
}

function renderText(briefing: Briefing, recipient: IEmailRecipient, appUrl: string): string {
  const blocks = briefing.sections.map((section) => {
    const entries = sortedEntries(section)
      .map((entry) => renderEntryText(briefing, entry, appUrl))
      .join('\n\n');

    return `${kindLabel(section.noteKind).toUpperCase()}: ${section.noteSummary}\n\n${entries}`;
  });

  return [
    emailCopy.BRAND,
    `Hi ${firstName(recipient.displayName)},`,
    emailCopy.GREETING_LEAD,
    ...blocks,
    `${emailCopy.FOOTER_SOLVED}\n${emailCopy.OPEN_APP}: ${appUrl}`,
  ].join('\n\n') + '\n';
}

export function renderBriefingEmail(briefing: Briefing, recipient: IEmailRecipient, appUrl: string): IRenderedEmail {
  const subject = buildSubject(briefing);

  return {
    subject,
    html: renderHtml(briefing, recipient, appUrl, subject),
    text: renderText(briefing, recipient, appUrl),
  };
}
