function generateSlug(text) {
  if (!text) return '';
  return text
    .toString()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // remove diacritics
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '') // remove non-alphanumeric chars
    .replace(/[\s_-]+/g, '-') // swap spaces/underscores with hyphen
    .replace(/^-+|-+$/g, ''); // remove leading/trailing hyphens
}

async function ensureUniqueSlug(baseSlug, existsCheckFn, currentId = null) {
  let slug = baseSlug || 'unnamed';
  let counter = 1;
  let uniqueSlug = slug;

  while (await existsCheckFn(uniqueSlug, currentId)) {
    counter += 1;
    uniqueSlug = `${slug}-${counter}`;
  }

  return uniqueSlug;
}

module.exports = {
  generateSlug,
  ensureUniqueSlug,
};
