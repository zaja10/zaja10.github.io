const ORCID_ID = '0000-0003-2468-1050';

async function getCitationCount(doi) {
    if (!doi) return 0;
    try {
        const response = await fetch(`https://api.openalex.org/works/https://doi.org/${doi}`);
        if (!response.ok) return 0;
        const data = await response.json();
        return data.cited_by_count || 0;
    } catch (e) {
        console.error('Error fetching citations for', doi, e);
        return 0;
    }
}

async function fetchOrcidPublications() {
    const container = document.getElementById('orcid-publications');
    if (!container) return;

    container.innerHTML = '<p style="text-align: center; color: var(--text-muted);"><i class="fas fa-spinner fa-spin fa-2x"></i><br>Loading and sorting publications by citations...</p>';

    try {
        const response = await fetch(`https://pub.orcid.org/v3.0/${ORCID_ID}/works`, {
            headers: { 'Accept': 'application/json' }
        });
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        const data = await response.json();
        const groups = data.group;

        if (!groups || groups.length === 0) {
            container.innerHTML = '<p>No publications found on ORCID.</p>';
            return;
        }

        // Parse all publications
        let pubs = groups.map(group => {
            const summary = group['work-summary'][0];
            const title = summary.title?.title?.value || 'Untitled';
            const year = summary['publication-date']?.year?.value || 'Unknown Year';
            const rawType = summary.type || '';
            let typeStr = rawType.replace(/-/g, ' ');
            typeStr = typeStr.replace(/\w\S*/g, (txt) => txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase());
            const journal = summary['journal-title']?.value || typeStr;
            let doi = null;
            let url = summary.url?.value || '#';

            if (summary['external-ids'] && summary['external-ids']['external-id']) {
                const extIds = summary['external-ids']['external-id'];
                const doiObj = extIds.find(id => id['external-id-type'] === 'doi');
                if (doiObj) {
                    doi = doiObj['external-id-value'];
                    url = doiObj['external-id-url']?.value || `https://doi.org/${doi}`;
                }
            }

            let iconClass = 'fa-file-alt';
            if (rawType.includes('journal')) iconClass = 'fa-book-open';
            else if (rawType.includes('conference')) iconClass = 'fa-users';
            else if (rawType.includes('book')) iconClass = 'fa-book';
            else if (rawType.includes('preprint')) iconClass = 'fa-file-signature';

            return { title, year, journal, doi, url, iconClass, citationCount: 0 };
        });

        // Fetch citations for all DOIs in parallel
        await Promise.all(pubs.map(async (pub) => {
            if (pub.doi) {
                pub.citationCount = await getCitationCount(pub.doi);
            }
        }));

        // Sort by citations descending, then by year descending
        pubs.sort((a, b) => {
            if (b.citationCount !== a.citationCount) {
                return b.citationCount - a.citationCount;
            }
            return b.year - a.year;
        });

        // Render HTML
        let html = '';
        pubs.forEach(pub => {
            html += `
                <div class="card pub-card-layout">
                    <div class="pub-icon">
                        <i class="fas ${pub.iconClass}"></i>
                    </div>
                    <div class="pub-content">
                        <h3 class="card-title">${pub.title}</h3>
                        <div class="card-meta">
                            <span><i class="fas fa-calendar-alt"></i> ${pub.year}</span>
                            <span><i class="fas fa-book"></i> ${pub.journal}</span>
                            ${pub.doi ? `<span class="citation-badge"><i class="fas fa-quote-right"></i> ${pub.citationCount} Citation${pub.citationCount === 1 ? '' : 's'}</span>` : ''}
                        </div>
                        <div class="pub-actions">
                            ${pub.url !== '#' ? `<a href="${pub.url}" target="_blank" rel="noopener noreferrer" class="btn btn-outline"><i class="fas fa-link"></i> View Source</a>` : ''}
                            ${pub.doi ? `<a href="https://doi.org/${pub.doi}" target="_blank" rel="noopener noreferrer" class="btn btn-outline"><i class="fas fa-external-link-alt"></i> DOI</a>` : ''}
                        </div>
                    </div>
                </div>
            `;
        });

        container.innerHTML = html;

    } catch (error) {
        console.error('Error fetching ORCID data:', error);
        container.innerHTML = `<div class="card"><p style="color: #ef4444;"><i class="fas fa-exclamation-circle"></i> Failed to load publications automatically. Please visit my <a href="https://orcid.org/${ORCID_ID}" target="_blank">ORCID profile</a> directly.</p></div>`;
    }
}

document.addEventListener('DOMContentLoaded', fetchOrcidPublications);
