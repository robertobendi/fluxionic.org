// Slatestack Demo Frontend

const API_BASE = '/api/content';

// Fetch collections list (from admin API since public API doesn't list collections)
async function loadCollections() {
  const grid = document.getElementById('collections-grid');

  try {
    // Try to get collections from admin API (requires auth)
    // Fall back to showing a message if not authenticated
    const response = await fetch('/api/admin/collections', {
      credentials: 'include'
    });

    if (!response.ok) {
      // Not authenticated - show public message
      grid.innerHTML = `
        <div class="empty" style="grid-column: 1/-1;">
          <p>Create collections in the <a href="/admin">Admin Panel</a> to see them here.</p>
          <p style="margin-top: 1rem;">Once you publish entries, they'll appear on this demo site.</p>
        </div>
      `;
      return;
    }

    const collections = await response.json();

    if (!collections || collections.length === 0) {
      grid.innerHTML = `
        <div class="empty" style="grid-column: 1/-1;">
          <p>No collections yet.</p>
          <p>Create your first collection in the <a href="/admin">Admin Panel</a></p>
        </div>
      `;
      return;
    }

    grid.innerHTML = collections.map(collection => `
      <a href="/public/collection.html?c=${encodeURIComponent(collection.slug)}" class="card">
        <h3>${escapeHtml(collection.name)}</h3>
        <p>${collection.fields?.length || 0} fields</p>
        <div class="meta">/${collection.slug}</div>
      </a>
    `).join('');

  } catch (error) {
    console.error('Error loading collections:', error);
    grid.innerHTML = `
      <div class="empty" style="grid-column: 1/-1;">
        <p>Could not load collections.</p>
        <p>Make sure the server is running.</p>
      </div>
    `;
  }
}

// Load collection and its entries
async function loadCollection(slug) {
  const nameEl = document.getElementById('collection-name');
  const titleEl = document.getElementById('collection-title');
  const listEl = document.getElementById('entries-list');

  try {
    // Fetch entries from public API
    const response = await fetch(`${API_BASE}/${slug}`);

    if (!response.ok) {
      throw new Error('Collection not found');
    }

    const result = await response.json();
    const entries = result.data || [];

    // Update header
    const collectionName = slug.charAt(0).toUpperCase() + slug.slice(1).replace(/-/g, ' ');
    nameEl.textContent = collectionName;
    titleEl.textContent = collectionName;
    document.title = `${collectionName} - Slatestack`;

    if (entries.length === 0) {
      listEl.innerHTML = `
        <div class="empty">
          <p>No published entries in this collection yet.</p>
          <p>Publish entries from the <a href="/admin">Admin Panel</a></p>
        </div>
      `;
      return;
    }

    listEl.innerHTML = entries.map(entry => {
      const title = getEntryTitle(entry);
      const excerpt = getEntryExcerpt(entry);
      const thumbnail = getEntryThumbnail(entry);
      const date = new Date(entry.createdAt).toLocaleDateString();

      return `
        <a href="/public/entry.html?c=${encodeURIComponent(slug)}&e=${encodeURIComponent(entry.slug)}" class="entry-card">
          ${thumbnail ? `<img src="${thumbnail}" alt="" class="thumbnail">` : ''}
          <div class="content">
            <h3>${escapeHtml(title)}</h3>
            ${excerpt ? `<p class="excerpt">${escapeHtml(excerpt)}</p>` : ''}
            <div class="meta">${date}</div>
          </div>
        </a>
      `;
    }).join('');

  } catch (error) {
    console.error('Error loading collection:', error);
    nameEl.textContent = 'Not Found';
    titleEl.textContent = 'Collection Not Found';
    listEl.innerHTML = `
      <div class="empty">
        <p>This collection doesn't exist or has no published entries.</p>
        <p><a href="/">← Back to Home</a></p>
      </div>
    `;
  }
}

// Load single entry
async function loadEntry(collectionSlug, entrySlug) {
  const linkEl = document.getElementById('collection-link');
  const titleEl = document.getElementById('entry-title');
  const contentEl = document.getElementById('entry-content');

  try {
    const response = await fetch(`${API_BASE}/${collectionSlug}/${entrySlug}`);

    if (!response.ok) {
      throw new Error('Entry not found');
    }

    const entry = await response.json();
    const title = getEntryTitle(entry);
    const date = new Date(entry.createdAt).toLocaleDateString();

    // Update breadcrumb
    const collectionName = collectionSlug.charAt(0).toUpperCase() + collectionSlug.slice(1).replace(/-/g, ' ');
    linkEl.textContent = collectionName;
    linkEl.href = `/public/collection.html?c=${encodeURIComponent(collectionSlug)}`;
    titleEl.textContent = title;
    document.title = `${title} - Slatestack`;

    // Render entry content
    let html = `
      <h1>${escapeHtml(title)}</h1>
      <div class="entry-meta">Published ${date}</div>
    `;

    // Render each field
    for (const [key, value] of Object.entries(entry.data || {})) {
      if (key === 'title' || key === 'name' || value === null || value === undefined) continue;

      const label = key.charAt(0).toUpperCase() + key.slice(1).replace(/([A-Z])/g, ' $1');
      html += `
        <div class="field">
          <div class="field-label">${escapeHtml(label)}</div>
          <div class="field-value">${renderFieldValue(value)}</div>
        </div>
      `;
    }

    contentEl.innerHTML = html;

  } catch (error) {
    console.error('Error loading entry:', error);
    titleEl.textContent = 'Not Found';
    contentEl.innerHTML = `
      <div class="empty">
        <p>This entry doesn't exist.</p>
        <p><a href="/">← Back to Home</a></p>
      </div>
    `;
  }
}

// Helper functions
function getEntryTitle(entry) {
  const data = entry.data || {};
  return data.title || data.name || data.heading || entry.slug || 'Untitled';
}

function getEntryExcerpt(entry) {
  const data = entry.data || {};
  // Look for common text fields
  const textFields = ['excerpt', 'description', 'summary', 'content', 'body', 'text'];
  for (const field of textFields) {
    if (data[field] && typeof data[field] === 'string') {
      // Strip HTML and truncate
      const text = data[field].replace(/<[^>]*>/g, '').trim();
      return text.length > 150 ? text.substring(0, 150) + '...' : text;
    }
  }
  return null;
}

function getEntryThumbnail(entry) {
  const data = entry.data || {};
  // Look for image fields - they might be media IDs or URLs
  const imageFields = ['image', 'thumbnail', 'cover', 'photo', 'featuredImage'];
  for (const field of imageFields) {
    if (data[field]) {
      // If it's a URL, use it directly
      if (typeof data[field] === 'string' && data[field].startsWith('/uploads/')) {
        return data[field];
      }
    }
  }
  return null;
}

function renderFieldValue(value) {
  if (value === null || value === undefined) {
    return '<em>-</em>';
  }

  if (typeof value === 'boolean') {
    return value ? 'Yes' : 'No';
  }

  if (Array.isArray(value)) {
    return value.map(v => `<span class="tag">${escapeHtml(String(v))}</span>`).join(' ');
  }

  if (typeof value === 'string') {
    // Check if it's HTML (rich text)
    if (value.includes('<p>') || value.includes('<h') || value.includes('<ul>')) {
      return `<div class="rich-text">${value}</div>`;
    }
    // Check if it's an image URL
    if (value.startsWith('/uploads/') && /\.(jpg|jpeg|png|gif|webp)$/i.test(value)) {
      return `<img src="${escapeHtml(value)}" alt="">`;
    }
    // Check if it's a date
    if (/^\d{4}-\d{2}-\d{2}/.test(value)) {
      return new Date(value).toLocaleDateString();
    }
    return escapeHtml(value);
  }

  return escapeHtml(String(value));
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}
