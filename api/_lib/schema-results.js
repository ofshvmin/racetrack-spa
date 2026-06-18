import schedule from '../../src/content/schedule.json' with { type: 'json' };

const VALID_SLUGS = new Set(['b-mod', 'hobby', '4cyl', 'super', 'vintage']);
const VALID_TAGS = new Set(['DNS', 'DQ', 'BF', 'DNF']);
const RACE_DATES = new Set(schedule.filter(e => e.type === 'race').map(e => e.date));

export function isValidRaceDate(date) {
  return RACE_DATES.has(date);
}

export function validateResultsEntry(entry) {
  const errors = [];

  if (!entry || typeof entry !== 'object') {
    return { ok: false, errors: [{ field: 'root', message: 'Invalid payload' }] };
  }

  if (!entry.date || !RACE_DATES.has(entry.date)) {
    errors.push({ field: 'date', message: `"${entry.date}" is not a scheduled race date` });
  }
  if (!entry.title || typeof entry.title !== 'string' || !entry.title.trim()) {
    errors.push({ field: 'title', message: 'Title is required' });
  }
  if (typeof entry.raceNum !== 'number' || entry.raceNum < 1) {
    errors.push({ field: 'raceNum', message: 'raceNum must be a positive integer' });
  }
  if (!Array.isArray(entry.divisions) || entry.divisions.length === 0) {
    errors.push({ field: 'divisions', message: 'At least one division is required' });
    return { ok: false, errors };
  }

  entry.divisions.forEach((div, di) => {
    const p = `divisions[${di}]`;
    if (!VALID_SLUGS.has(div.slug)) errors.push({ field: `${p}.slug`, message: `Unknown slug "${div.slug}"` });
    if (!div.name?.trim()) errors.push({ field: `${p}.name`, message: 'Division name required' });

    if (!Array.isArray(div.feature)) {
      errors.push({ field: `${p}.feature`, message: 'feature must be an array' });
    } else {
      const positions = div.feature.map(f => f.pos);
      const expected = Array.from({ length: positions.length }, (_, i) => i + 1);
      if (JSON.stringify(positions) !== JSON.stringify(expected)) {
        errors.push({ field: `${p}.feature`, message: 'Positions must be sequential from 1' });
      }
      div.feature.forEach((f, fi) => {
        if (!f.driver?.trim()) errors.push({ field: `${p}.feature[${fi}].driver`, message: 'Driver name required' });
        if (f.pts != null && (typeof f.pts !== 'number' || !Number.isFinite(f.pts) || f.pts < 0)) {
          errors.push({ field: `${p}.feature[${fi}].pts`, message: 'Points must be a non-negative number' });
        }
      });
    }

    if (!Array.isArray(div.heats)) errors.push({ field: `${p}.heats`, message: 'heats must be an array' });

    if (!Array.isArray(div.dnf)) {
      errors.push({ field: `${p}.dnf`, message: 'dnf must be an array' });
    } else {
      div.dnf.forEach((d, di2) => {
        if (typeof d === 'string') return;
        if (typeof d === 'object' && d !== null) {
          if (!d.driver?.trim()) errors.push({ field: `${p}.dnf[${di2}].driver`, message: 'Driver name required' });
          if (d.tag && !VALID_TAGS.has(d.tag)) errors.push({ field: `${p}.dnf[${di2}].tag`, message: `Invalid tag "${d.tag}"` });
          return;
        }
        errors.push({ field: `${p}.dnf[${di2}]`, message: 'dnf entry must be string or {driver, tag}' });
      });
    }
  });

  return errors.length === 0 ? { ok: true } : { ok: false, errors };
}
