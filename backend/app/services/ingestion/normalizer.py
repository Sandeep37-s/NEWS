import re
from urllib.parse import urlparse, urlunparse, parse_qsl, urlencode
import bleach
from bs4 import BeautifulSoup

TRACKING_QUERY_PARAMS = {
    "utm_source", "utm_medium", "utm_campaign", "utm_term", "utm_content",
    "fbclid", "gclid", "msclkid", "mc_cid", "mc_eid", "ref", "source"
}

def clean_url(url: str) -> str:
    """Strip tracking query parameters and fragments from URL for clean deduplication."""
    if not url:
        return ""
    parsed = urlparse(url.strip())
    query_params = parse_qsl(parsed.query)
    filtered_params = [(k, v) for k, v in query_params if k.lower() not in TRACKING_QUERY_PARAMS]
    
    clean_query = urlencode(filtered_params)
    clean_parsed = parsed._replace(query=clean_query, fragment="")
    return urlunparse(clean_parsed)

def clean_html_to_text(html_content: str) -> str:
    """Extract plain sanitized text from raw HTML content or RSS description."""
    if not html_content:
        return ""
    
    # Strip dangerous script/style elements
    soup = BeautifulSoup(html_content, "html.parser")
    for script in soup(["script", "style", "iframe", "noscript"]):
        script.decompose()
        
    text = soup.get_text(separator=" ", strip=True)
    # Collapse multiple whitespace
    text = re.sub(r'\s+', ' ', text).strip()
    return text

def sanitize_rich_text(html_content: str) -> str:
    """Sanitize HTML rich text allowing only safe tags for internal editorial content."""
    if not html_content:
        return ""
    allowed_tags = ["p", "b", "i", "strong", "em", "u", "h2", "h3", "h4", "ul", "ol", "li", "a", "blockquote", "hr", "br"]
    allowed_attributes = {
        "a": ["href", "title", "target", "rel"],
    }
    cleaned = bleach.clean(
        html_content,
        tags=allowed_tags,
        attributes=allowed_attributes,
        strip=True
    )
    return cleaned

def generate_slug(text: str) -> str:
    """Convert text to URL-friendly lowercase slug."""
    text = text.lower().strip()
    # Replace non-alphanumeric with hyphens
    text = re.sub(r'[^a-z0-9\s-]', '', text)
    text = re.sub(r'[\s-]+', '-', text).strip('-')
    return text or "article"
