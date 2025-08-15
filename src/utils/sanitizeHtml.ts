import DOMPurify from 'dompurify';

/**
 * Sanitizes HTML content to prevent XSS attacks
 * Allows only safe HTML tags and attributes
 */
export const sanitizeHtml = (htmlContent: string): string => {
  if (!htmlContent) return '';
  
  // Configure DOMPurify for safe HTML rendering
  const config = {
    ALLOWED_TAGS: [
      'p', 'br', 'strong', 'b', 'em', 'i', 'u', 'ul', 'ol', 'li', 
      'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'blockquote', 'div', 'span',
      'a', 'img'
    ],
    ALLOWED_ATTR: [
      'href', 'target', 'rel', 'src', 'alt', 'title', 'class'
    ],
    ALLOW_DATA_ATTR: false,
    FORBID_TAGS: ['script', 'object', 'embed', 'form', 'input', 'textarea'],
    FORBID_ATTR: ['onclick', 'onload', 'onerror', 'onmouseover', 'style']
  };
  
  return DOMPurify.sanitize(htmlContent, config);
};

/**
 * Creates a safe innerHTML object for React dangerouslySetInnerHTML
 */
export const createSafeHtml = (htmlContent: string) => ({
  __html: sanitizeHtml(htmlContent)
});