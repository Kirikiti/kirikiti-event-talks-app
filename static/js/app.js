// State Management
const state = {
    notes: [],
    filteredNotes: [],
    selectedCategory: 'All',
    searchQuery: '',
    isLoading: false,
    activeTweetNote: null
};

// SVG Icons Constants
const ICONS = {
    tweet: `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>`,
    copy: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>`,
    link: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path></svg>`,
    markdown: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><path d="M7 8v8M7 8l4 4 4-4v8"></path><path d="M17 12h4"></path></svg>`,
    calendar: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>`,
    externalLink: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path><polyline points="15 3 21 3 21 9"></polyline><line x1="10" y1="14" x2="21" y2="3"></line></svg>`
};

// Initialize App
document.addEventListener('DOMContentLoaded', () => {
    initTheme();
    setupEventListeners();
    fetchReleaseNotes();
});

// Theme Setup
function initTheme() {
    const savedTheme = localStorage.getItem('theme');
    const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    
    // Default to dark mode for rich aesthetics, or use saved preference
    const theme = savedTheme || (systemPrefersDark ? 'dark' : 'dark');
    document.documentElement.setAttribute('data-theme', theme);
}

function toggleTheme() {
    const currentTheme = document.documentElement.getAttribute('data-theme');
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
}

// Event Listeners Setup
function setupEventListeners() {
    // Theme Toggle Button
    const themeToggleBtn = document.getElementById('theme-toggle-btn');
    if (themeToggleBtn) {
        themeToggleBtn.addEventListener('click', toggleTheme);
    }
    
    // Refresh Button
    const refreshBtn = document.getElementById('refresh-btn');
    if (refreshBtn) {
        refreshBtn.addEventListener('click', fetchReleaseNotes);
    }

    // Export CSV Button
    const exportCsvBtn = document.getElementById('export-csv-btn');
    if (exportCsvBtn) {
        exportCsvBtn.addEventListener('click', exportToCSV);
    }
    
    // Search Input
    const searchInput = document.getElementById('search-input');
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            state.searchQuery = e.target.value;
            applyFilters();
        });
    }

    // Modal Close Trigger
    const closeModalBtn = document.getElementById('close-modal-btn');
    if (closeModalBtn) {
        closeModalBtn.addEventListener('click', closeModal);
    }
    const cancelModalBtn = document.getElementById('cancel-modal-btn');
    if (cancelModalBtn) {
        cancelModalBtn.addEventListener('click', closeModal);
    }
    const modalOverlay = document.getElementById('modal-overlay');
    if (modalOverlay) {
        modalOverlay.addEventListener('click', (e) => {
            if (e.target === modalOverlay) closeModal();
        });
    }

    // Tweet Send trigger
    const tweetSubmitBtn = document.getElementById('tweet-submit-btn');
    if (tweetSubmitBtn) {
        tweetSubmitBtn.addEventListener('click', submitTweet);
    }

    // Tweet Textarea length indicator
    const tweetTextarea = document.getElementById('tweet-textarea');
    if (tweetTextarea) {
        tweetTextarea.addEventListener('input', updateTweetCharCount);
    }
}

// API Call - Fetch Release Notes
async function fetchReleaseNotes() {
    if (state.isLoading) return;
    
    setLoadingState(true);
    showSkeletonLoaders();
    
    try {
        const response = await fetch('/api/release-notes');
        const data = await response.json();
        
        if (data.success) {
            state.notes = data.notes;
            updateFilterPillsCount();
            applyFilters();
            showToast('✓ Successfully updated release notes');
        } else {
            showErrorState(data.error || 'Failed to fetch release notes.');
        }
    } catch (error) {
        console.error('Error fetching release notes:', error);
        showErrorState('Network error: Unable to reach the server.');
    } finally {
        setLoadingState(false);
        updateLastRefreshedTime();
    }
}

function setLoadingState(loading) {
    state.isLoading = loading;
    const refreshBtn = document.getElementById('refresh-btn');
    if (refreshBtn) {
        if (loading) {
            refreshBtn.classList.add('loading');
        } else {
            refreshBtn.classList.remove('loading');
        }
    }
}

function updateLastRefreshedTime() {
    const timeElem = document.getElementById('last-updated-time');
    if (timeElem) {
        const now = new Date();
        const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
        timeElem.textContent = `Last checked: ${timeStr}`;
    }
}

// Render Skeleton Loaders
function showSkeletonLoaders() {
    const listContainer = document.getElementById('notes-list');
    if (!listContainer) return;
    
    listContainer.innerHTML = Array(4).fill(0).map(() => `
        <div class="skeleton-card"></div>
    `).join('');
}

// Render Error state
function showErrorState(message) {
    const listContainer = document.getElementById('notes-list');
    if (!listContainer) return;
    
    listContainer.innerHTML = `
        <div class="empty-state">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="12" y1="8" x2="12" y2="12"></line>
                <line x1="12" y1="16" x2="12.01" y2="16"></line>
            </svg>
            <h3>Unable to load release notes</h3>
            <p>${message}</p>
            <button class="btn btn-primary" style="margin-top: 16px;" onclick="fetchReleaseNotes()">Try Again</button>
        </div>
    `;
}

// Update Counts on Filter Pills
function updateFilterPillsCount() {
    const counts = { All: state.notes.length };
    
    state.notes.forEach(note => {
        const cat = normalizeCategory(note.category);
        counts[cat] = (counts[cat] || 0) + 1;
    });
    
    // Render the pills dynamically
    const filterPillsContainer = document.getElementById('filter-pills');
    if (!filterPillsContainer) return;
    
    const categories = ['All', 'Feature', 'Issue', 'Deprecation', 'Change', 'Note'];
    
    filterPillsContainer.innerHTML = categories.map(cat => {
        const count = counts[cat] || 0;
        const isActive = state.selectedCategory === cat;
        
        // Skip rendering category if there are 0 items, unless it's 'All'
        if (count === 0 && cat !== 'All') return '';
        
        return `
            <button class="filter-pill ${isActive ? 'active' : ''}" onclick="selectCategory('${cat}')">
                ${cat}
                <span class="pill-count">${count}</span>
            </button>
        `;
    }).join('');
}

function selectCategory(category) {
    state.selectedCategory = category;
    
    // Update active pill UI
    const pills = document.querySelectorAll('.filter-pill');
    pills.forEach(pill => {
        if (pill.textContent.includes(category)) {
            pill.classList.add('active');
        } else {
            pill.classList.remove('active');
        }
    });
    
    updateFilterPillsCount(); // Refresh pills state
    applyFilters();
}

// Normalize categories into standard types
function normalizeCategory(category) {
    const cat = category.toLowerCase();
    if (cat.includes('feature')) return 'Feature';
    if (cat.includes('issue')) return 'Issue';
    if (cat.includes('deprecat')) return 'Deprecation';
    if (cat.includes('change')) return 'Change';
    if (cat.includes('note')) return 'Note';
    return 'Note'; // default fallback for Note/General
}

// Filtering Logic
function applyFilters() {
    let filtered = state.notes;
    
    // Apply Category Filter
    if (state.selectedCategory !== 'All') {
        filtered = filtered.filter(note => normalizeCategory(note.category) === state.selectedCategory);
    }
    
    // Apply Search Query Filter
    if (state.searchQuery.trim() !== '') {
        const query = state.searchQuery.toLowerCase();
        filtered = filtered.filter(note => {
            return note.category.toLowerCase().includes(query) || 
                   note.date.toLowerCase().includes(query) || 
                   note.plain_text.toLowerCase().includes(query) || 
                   note.html.toLowerCase().includes(query);
        });
    }
    
    state.filteredNotes = filtered;
    renderNotes();
}

// Render Cards to DOM
function renderNotes() {
    const listContainer = document.getElementById('notes-list');
    if (!listContainer) return;
    
    // Update visible item count
    const totalCountElem = document.getElementById('visible-count');
    if (totalCountElem) {
        totalCountElem.textContent = `${state.filteredNotes.length} updates found`;
    }

    if (state.filteredNotes.length === 0) {
        listContainer.innerHTML = `
            <div class="empty-state">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <circle cx="11" cy="11" r="8"></circle>
                    <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                </svg>
                <h3>No release notes match your criteria</h3>
                <p>Try clearing your search query or choosing a different category filter.</p>
            </div>
        `;
        return;
    }
    
    listContainer.innerHTML = state.filteredNotes.map(note => {
        const catNorm = normalizeCategory(note.category).toLowerCase();
        return `
            <article class="card cat-${catNorm}" id="card-${note.id}">
                <div class="card-header">
                    <div class="card-meta">
                        <span class="badge badge-${catNorm}">${note.category}</span>
                        <div class="card-date">
                            ${ICONS.calendar}
                            <span>${note.date}</span>
                        </div>
                    </div>
                    <div class="card-actions">
                        <button class="action-btn btn-tweet" title="Compose Tweet / Share on X" onclick="openTweetComposer('${note.id}')">
                            ${ICONS.tweet}
                        </button>
                        <button class="action-btn" title="Copy markdown snippet" onclick="copyMarkdownSnippet('${note.id}')">
                            ${ICONS.markdown}
                        </button>
                        <button class="action-btn" title="Copy plain text to clipboard" onclick="copyTextContent('${note.id}')">
                            ${ICONS.copy}
                        </button>
                        <button class="action-btn" title="Copy link to this release note" onclick="copyLink('${note.id}')">
                            ${ICONS.link}
                        </button>
                    </div>
                </div>
                
                <div class="card-body">
                    ${note.html}
                </div>
                
                <div class="card-footer">
                    <a href="${note.link}" target="_blank" rel="noopener noreferrer" class="card-doc-link">
                        View official documentation
                        ${ICONS.externalLink}
                    </a>
                </div>
            </article>
        `;
    }).join('');
}

// Copy Functions
function copyTextContent(noteId) {
    const note = state.notes.find(n => n.id === noteId);
    if (!note) return;
    
    const textToCopy = `[BigQuery Release Note - ${note.category} (${note.date})]\n\n${note.plain_text}`;
    navigator.clipboard.writeText(textToCopy)
        .then(() => showToast('✓ Copied to clipboard!'))
        .catch(err => console.error('Could not copy text: ', err));
}

function copyLink(noteId) {
    const note = state.notes.find(n => n.id === noteId);
    if (!note) return;
    
    // We can also create a direct app link using the window location hash
    const appLink = `${window.location.origin}${window.location.pathname}#card-${note.id}`;
    navigator.clipboard.writeText(note.link)
        .then(() => showToast('✓ Official docs link copied to clipboard'))
        .catch(err => console.error('Could not copy link: ', err));
}

function copyMarkdownSnippet(noteId) {
    const note = state.notes.find(n => n.id === noteId);
    if (!note) return;
    
    const markdown = `> **BigQuery Release Note** | **${note.category}** - *${note.date}*\n>\n> ${note.plain_text.split('\n').join('\n> ')}\n>\n> [Official Release Notes](${note.link})`;
    
    navigator.clipboard.writeText(markdown)
        .then(() => showToast('✓ Markdown snippet copied to clipboard'))
        .catch(err => console.error('Could not copy markdown: ', err));
}

// Tweet Composer Modal Logic
function openTweetComposer(noteId) {
    const note = state.notes.find(n => n.id === noteId);
    if (!note) return;
    
    state.activeTweetNote = note;
    
    // Formulate a beautiful initial tweet draft
    const prefix = `📢 BigQuery #${note.category} update (${note.date}):\n\n`;
    const suffix = `\n\nRead more: ${note.link}`;
    
    // Twitter character limit is 280.
    // Calculate space left for the main content
    const baseLength = prefix.length + suffix.length;
    const maxBodyLength = 280 - baseLength - 5; // minus some extra safety padding
    
    let draftBody = note.plain_text;
    if (draftBody.length > maxBodyLength) {
        draftBody = draftBody.substring(0, maxBodyLength) + '...';
    }
    
    const tweetText = `${prefix}${draftBody}${suffix}`;
    
    // Populate modal elements
    const textarea = document.getElementById('tweet-textarea');
    textarea.value = tweetText;
    
    // Open Modal
    const modalOverlay = document.getElementById('modal-overlay');
    modalOverlay.classList.add('active');
    
    // Focus textarea
    setTimeout(() => textarea.focus(), 150);
    
    updateTweetCharCount();
}

function closeModal() {
    const modalOverlay = document.getElementById('modal-overlay');
    modalOverlay.classList.remove('active');
    state.activeTweetNote = null;
}

function updateTweetCharCount() {
    const textarea = document.getElementById('tweet-textarea');
    const counterText = document.getElementById('char-count-text');
    const submitBtn = document.getElementById('tweet-submit-btn');
    const progressCircle = document.getElementById('progress-circle');
    
    if (!textarea || !counterText || !submitBtn) return;
    
    const textLength = textarea.value.length;
    const remaining = 280 - textLength;
    
    counterText.textContent = remaining;
    
    // Update circular progress ring
    if (progressCircle) {
        const radius = progressCircle.r.baseVal.value;
        const circumference = radius * 2 * Math.PI;
        
        progressCircle.style.strokeDasharray = `${circumference} ${circumference}`;
        
        // Calculate offset (cap at 280)
        const percentage = Math.min(textLength / 280, 1);
        const offset = circumference - (percentage * circumference);
        progressCircle.style.strokeDashoffset = offset;
        
        // Color coding ring and text based on usage
        const counterContainer = document.querySelector('.char-counter');
        if (remaining < 0) {
            counterContainer.className = 'char-counter danger';
            progressCircle.style.stroke = 'var(--color-issue)';
            submitBtn.disabled = true;
            submitBtn.style.opacity = '0.5';
            submitBtn.style.cursor = 'not-allowed';
        } else if (remaining <= 20) {
            counterContainer.className = 'char-counter warning';
            progressCircle.style.stroke = 'var(--color-deprecation)';
            submitBtn.disabled = false;
            submitBtn.style.opacity = '1';
            submitBtn.style.cursor = 'pointer';
        } else {
            counterContainer.className = 'char-counter';
            progressCircle.style.stroke = 'var(--brand-x-blue)';
            submitBtn.disabled = false;
            submitBtn.style.opacity = '1';
            submitBtn.style.cursor = 'pointer';
        }
    }
}

function submitTweet() {
    const textarea = document.getElementById('tweet-textarea');
    if (!textarea) return;
    
    const tweetText = textarea.value;
    if (tweetText.length > 280) {
        showToast('⚠️ Tweet text exceeds the 280 character limit.');
        return;
    }
    
    // Encode text and open Web Share Intent
    const encodedText = encodeURIComponent(tweetText);
    const twitterUrl = `https://twitter.com/intent/tweet?text=${encodedText}`;
    
    window.open(twitterUrl, '_blank', 'width=550,height=420');
    closeModal();
    showToast('✓ Redirecting to share on X');
}

// Toast System
function showToast(message) {
    const container = document.getElementById('toast-container');
    if (!container) return;
    
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.textContent = message;
    
    container.appendChild(toast);
    
    // Automatically remove after animation completes (3s total)
    setTimeout(() => {
        toast.remove();
    }, 3000);
}

// Export to CSV Function
function exportToCSV() {
    if (state.filteredNotes.length === 0) {
        showToast('⚠️ No release notes available to export.');
        return;
    }
    
    const headers = ["Date", "Category", "Official Link", "Update Content"];
    
    const rows = state.filteredNotes.map(note => {
        return [
            note.date,
            note.category,
            note.link,
            note.plain_text
        ].map(val => {
            // Escape double quotes and wrap in double quotes
            const cleanVal = val.replace(/"/g, '""');
            return `"${cleanVal}"`;
        }).join(",");
    });
    
    const csvString = [headers.join(","), ...rows].join("\n");
    
    // Create download via Blob
    const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `bigquery_release_notes_${state.selectedCategory.toLowerCase()}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    showToast('✓ CSV Export downloaded successfully');
}
