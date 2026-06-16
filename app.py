import os
import re
import requests
import xml.etree.ElementTree as ET
from flask import Flask, jsonify, render_template, request

app = Flask(__name__)

FEED_URL = "https://docs.cloud.google.com/feeds/bigquery-release-notes.xml"

def strip_html_for_tweet(html_str):
    """Converts HTML release note body to clean plain text for social sharing."""
    # Replace hyperlinks with "text (URL)"
    # <a href="URL">text</a> -> "text (URL)"
    text = html_str
    
    # We want to format links nicely in text.
    # Find all links
    links = re.findall(r'<a\s+href="([^"]+)">([^<]+)</a>', text)
    for href, link_text in links:
        # If the href is relative, resolve it (Google Cloud docs URL)
        if href.startswith('/'):
            href = f"https://cloud.google.com{href}"
        # If it's a short link or self link, we might not want to add it if it's too long,
        # but let's include it nicely.
        text = text.replace(f'<a href="{href}">{link_text}</a>', f'{link_text} ({href})')
        # Also handle potential variations in quotes/spaces
        text = re.sub(r'<a\s+href=\'' + re.escape(href) + r'\'>' + re.escape(link_text) + r'</a>', f'{link_text} ({href})', text)

    # Convert common formatting tags
    text = re.sub(r'</p>', '\n\n', text)
    text = re.sub(r'</li>', '\n', text)
    text = re.sub(r'<br\s*/?>', '\n', text)
    text = re.sub(r'<strong>(.*?)</strong>', r'\1', text)
    text = re.sub(r'<code>(.*?)</code>', r'`\1`', text)
    
    # Strip all remaining tags
    text = re.sub(r'<[^>]+>', '', text)
    
    # Clean up whitespace
    text = re.sub(r'^[ \t]+|[ \t]+$', '', text, flags=re.MULTILINE)
    text = re.sub(r'\n{3,}', '\n\n', text)
    return text.strip()

def fetch_and_parse_feed():
    try:
        response = requests.get(FEED_URL, timeout=10)
        if response.status_code != 200:
            return None, f"Failed to fetch feed: Status {response.status_code}"
    except Exception as e:
        return None, f"Network error fetching feed: {str(e)}"

    namespaces = {'atom': 'http://www.w3.org/2005/Atom'}
    
    try:
        root = ET.fromstring(response.content)
    except ET.ParseError as e:
        return None, f"Failed to parse XML: {str(e)}"

    release_notes = []
    
    for entry in root.findall('atom:entry', namespaces):
        title_elem = entry.find('atom:title', namespaces)
        id_elem = entry.find('atom:id', namespaces)
        updated_elem = entry.find('atom:updated', namespaces)
        link_elem = entry.find('atom:link[@rel="alternate"]', namespaces)
        if link_elem is None:
            link_elem = entry.find('atom:link', namespaces)
        content_elem = entry.find('atom:content', namespaces)
        
        date_str = title_elem.text if title_elem is not None else "Unknown Date"
        entry_id = id_elem.text if id_elem is not None else ""
        updated_str = updated_elem.text if updated_elem is not None else ""
        link_href = link_elem.get('href') if link_elem is not None else "https://cloud.google.com/bigquery/docs/release-notes"
        content_html = content_elem.text if content_elem is not None else ""
        
        # Parse content_html into sub-sections by splitting on <h3>
        parts = re.split(r'<h3>', content_html)
        
        # Keep track of category occurrences to generate unique anchor IDs
        cat_counts = {}
        
        for part in parts:
            if not part.strip():
                continue
            
            if '</h3>' in part:
                category, body = part.split('</h3>', 1)
                category = category.strip()
                body = body.strip()
                
                # Format relative links to absolute ones in the HTML body
                body = re.sub(r'href="/', 'href="https://cloud.google.com/', body)
                
                cat_counts[category] = cat_counts.get(category, 0) + 1
                unique_id = f"{entry_id}_{category.lower()}_{cat_counts[category]}"
                # Sanitize the unique ID to be a safe CSS selector/HTML id
                unique_id = re.sub(r'[^a-zA-Z0-9_\-#]', '_', unique_id)
                
                plain_text = strip_html_for_tweet(body)
                
                release_notes.append({
                    "id": unique_id,
                    "date": date_str,
                    "raw_date": updated_str,
                    "link": link_href,
                    "category": category,
                    "html": body,
                    "plain_text": plain_text
                })
            else:
                body = part.strip()
                if body:
                    body = re.sub(r'href="/', 'href="https://cloud.google.com/', body)
                    unique_id = f"{entry_id}_general"
                    unique_id = re.sub(r'[^a-zA-Z0-9_\-#]', '_', unique_id)
                    plain_text = strip_html_for_tweet(body)
                    
                    release_notes.append({
                        "id": unique_id,
                        "date": date_str,
                        "raw_date": updated_str,
                        "link": link_href,
                        "category": "General",
                        "html": body,
                        "plain_text": plain_text
                    })
                    
    return release_notes, None

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/api/release-notes')
def get_release_notes():
    notes, error = fetch_and_parse_feed()
    if error:
        return jsonify({"success": False, "error": error}), 500
    return jsonify({"success": True, "notes": notes})

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    app.run(host='0.0.0.0', port=port, debug=True)
