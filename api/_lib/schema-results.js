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

  function validateFinishers(finishers, fieldPath) {
    const positions = finishers.map(f => f.pos);
    const expected = Array.from({ length: positions.length }, (_, i) => i + 1);
    if (JSON.stringify(positions) !== JSON.stringify(expected)) {
      errors.push({ field: fieldPath, message: 'Positions must be sequential from 1' });
    }
    finishers.forEach((f, fi) => {
      if (!f.driver?.trim()) errors.push({ field: `${fieldPath}[${fi}].driver`, message: 'Driver name required' });
      if (f.pts != null && (typeof f.pts !== 'number' || !Number.isFinite(f.pts) || f.pts < 0)) {
        errors.push({ field: `${fieldPath}[${fi}].pts`, message: 'Points must be a non-negative number' });
      }
    });
  }

  entry.divisions.forEach((div, di) => {
    const p = `divisions[${di}]`;
    if (!VALID_SLUGS.has(div.slug)) errors.push({ field: `${p}.slug`, message: `Unknown slug "${div.slug}"` });
    if (!div.name?.trim()) errors.push({ field: `${p}.name`, message: 'Division name required' });

    // A division carries either a single `feature` array, or a `features`
    // array of { label, finishers } for double-feature nights.
    if (Array.isArray(div.features)) {
      div.features.forEach((feat, fi) => {
        const fp = `${p}.features[${fi}]`;
        if (!feat || typeof feat !== 'object') {
          errors.push({ field: fp, message: 'feature must be an object with label and finishers' });
          return;
        }
        if (!feat.label?.trim()) errors.push({ field: `${fp}.label`, message: 'Feature label required' });
        if (!Array.isArray(feat.finishers)) {
          errors.push({ field: `${fp}.finishers`, message: 'finishers must be an array' });
        } else {
          validateFinishers(feat.finishers, `${fp}.finishers`);
        }
      });
    } else if (!Array.isArray(div.feature)) {
      errors.push({ field: `${p}.feature`, message: 'feature must be an array' });
    } else {
      validateFinishers(div.feature, `${p}.feature`);
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
          if (d.pts != null && (typeof d.pts !== 'number' || !Number.isFinite(d.pts) || d.pts < 0)) {
            errors.push({ field: `${p}.dnf[${di2}].pts`, message: 'Points must be a non-negative number' });
          }
          return;
        }
        errors.push({ field: `${p}.dnf[${di2}]`, message: 'dnf entry must be string or {driver, tag}' });
      });
    }
  });

  return errors.length === 0 ? { ok: true } : { ok: false, errors };
}
